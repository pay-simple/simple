import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import colors from "picocolors";
import prompts from "prompts";
import semver from "semver";

import { parseErrorMessage } from "../lib/utils";

const execPromise = util.promisify(exec);

/**
 * Fetches the latest version of a given package from the npm registry.
 * @param {string} packageName - The name of the package to fetch the version for.
 * @returns {Promise<string>} - The latest version of the package.
 */
const getLatestVersion = async (packageName: string): Promise<string> => {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();

  if (response.ok) {
    return data["dist-tags"].latest;
  } else if (data.error === "Not found") {
    return "0.0.0";
  }

  console.error(colors.red("Package not found, exiting..."));
  process.exit(1);
};

/**
 * Runs a series of prompts to gather user input for publishing a package.
 * @returns {Promise<object>} - The responses from the prompts.
 */
const runPrompts = async (): Promise<
  prompts.Answers<
    | "environment"
    | "versionType"
    | "customVersion"
    | "verifyVersion"
    | "confirmPublish"
  >
> => {
  let latestVersion: string | null = null;

  const responses = await prompts(
    [
      {
        type: "select",
        name: "environment",
        message: "Which environment do you want to publish to?",
        choices: [
          {
            title: "Development (@paysimple/simple-dev)",
            value: "@paysimple/simple-dev",
          },
          {
            title: "Production (@paysimple/simple)",
            value: "@paysimple/simple",
          },
        ],
        onState: async (state) => {
          latestVersion = await getLatestVersion(state.value);
        },
      },
      {
        type: "select",
        name: "versionType",
        message: "Select the type of version release:",
        choices: [
          { title: "Major", value: "major" },
          { title: "Minor", value: "minor" },
          { title: "Patch", value: "patch" },
          { title: "Define version yourself", value: "custom" },
        ],
      },
      {
        type: (prev) => (prev === "custom" ? "text" : null),
        name: "customVersion",
        message: "Enter the custom version:",
        initial: latestVersion ? latestVersion : undefined,
      },
      {
        type: "text",
        name: "verifyVersion",
        message: "Enter the version to verify:",
        initial: (_, values) =>
          values.versionType === "custom"
            ? values.customVersion
            : semver.inc(latestVersion!, values.versionType),
        validate: (value) => {
          if (!semver.valid(value)) {
            return "Invalid version";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "confirmPublish",
        message: "Are you sure you want to publish?",
        initial: true,
      },
    ],
    {
      onCancel: () => {
        console.log(colors.red("Publish cancelled"));
        process.exit(1);
      },
    },
  );

  return responses;
};

/**
 * Ensures that the distribution path exists, creating it if necessary.
 * @param {string} distPath - The path to the distribution directory.
 */
const ensureDistPathExists = (distPath: string) => {
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    console.log(colors.cyan(`Created directory: ${distPath}`));
  }
};

/**
 * Updates the package.json file with the new package name and version.
 * @param {string} rootPath - The root directory path.
 * @param {string} distPath - The distribution directory path.
 * @param {string} packageName - The new package name.
 * @param {string} newVersion - The new version of the package.
 */
const updatePackageJson = (
  rootPath: string,
  distPath: string,
  packageName: string,
  newVersion: string,
) => {
  const packageJsonPath = path.join(rootPath, "package.npm.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  packageJson.name = packageName;
  packageJson.version = newVersion;

  fs.writeFileSync(
    path.join(distPath, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
};

/**
 * Updates the CDN URLs in the README file based on the package name.
 * @param {string} rootPath - The root directory path.
 * @param {string} distPath - The distribution directory path.
 * @param {string} packageName - The package name to update the URLs for.
 * @param {string} packageVersion - The version of the package to update the URLs for.
 */
const updateReadmeUrls = (
  rootPath: string,
  distPath: string,
  packageName: string,
  packageVersion: string,
) => {
  console.log(colors.cyan("Updating README CDN URLs and package names..."));
  const readmePath = path.join(rootPath, "README.npm.md");
  let readmeContent = fs.readFileSync(readmePath, "utf-8");

  // Replace CDN URLs based on package name and version
  const cdnUrl = `https://cdn.jsdelivr.net/npm/${packageName}@${packageVersion.replace(/(\d+\.\d+)\.\d+/, "$1")}`;
  readmeContent = readmeContent.replace(
    /https:\/\/cdn\.jsdelivr\.net\/npm\/@paysimple\/simple(?:-dev)?/g,
    cdnUrl,
  );

  // Replace npm package names in install and import statements
  readmeContent = readmeContent.replace(
    /npm install @paysimple\/simple(?:-dev)?/g,
    `npm install ${packageName}`,
  );
  readmeContent = readmeContent.replace(
    /import "@paysimple\/simple(?:-dev)?"/g,
    `import "${packageName}"`,
  );

  const updatedReadmePath = path.join(distPath, "README.md");
  fs.writeFileSync(updatedReadmePath, readmeContent);
};

/**
 * Prepares and publishes the package to npm.
 * @param {string} packageName - The name of the package to publish.
 * @param {string} newVersion - The version of the package to publish.
 */
const publishPackage = async (packageName: string, newVersion: string) => {
  const rootPath = path.resolve(__dirname, "..");
  const distPath = path.resolve(__dirname, "../dist");
  try {
    ensureDistPathExists(distPath);
    console.log(colors.cyan("Preparing files for publishing..."));
    updatePackageJson(rootPath, distPath, packageName, newVersion);
    updateReadmeUrls(rootPath, distPath, packageName, newVersion);
    // copy types
    fs.copyFileSync(
      path.join(rootPath, "types", "globals.d.ts"),
      path.join(distPath, "index.d.ts"),
    );

    console.log(
      colors.yellow(`Building ${packageName} with version ${newVersion}...`),
    );

    // Check if we're publishing to production
    const isProduction = packageName === "@paysimple/simple";

    if (isProduction) {
      process.env.NODE_ENV = "production";
    }

    await execPromise(`bun run build`);

    if (isProduction) {
      console.log(
        colors.yellow("\nProduction package prepared for publishing!"),
      );
      console.log(colors.cyan("\nPlease verify the following:"));
      console.log("1. Check the contents of the dist folder");
      console.log("2. Verify the package.json version and name");
      console.log("3. Confirm the README CDN URLs are correct");
      console.log("\nThen run manually:");
      console.log(
        colors.green(`npm publish ${distPath} --access public --tag latest`),
      );
    } else {
      console.log(
        colors.yellow(
          `Publishing to ${packageName} with version ${newVersion}...`,
        ),
      );
      await execPromise(`npm publish ${distPath} --access public --tag latest`);
      console.log(
        colors.green(
          `Successfully published ${packageName} version ${newVersion}!`,
        ),
      );
    }
  } catch (error) {
    console.error(colors.red(`Failed to publish: ${parseErrorMessage(error)}`));
  }
};

/**
 * Initializes the CLI process, running prompts and publishing the package if confirmed.
 */
const init = async () => {
  console.clear();
  console.log(`${colors.bgGreenBright(colors.bold("Simple Publish CLI"))}\n`);

  try {
    const { verifyVersion, environment, confirmPublish } = await runPrompts();
    const newVersion = verifyVersion;

    if (confirmPublish) {
      await publishPackage(environment, newVersion);
    } else {
      console.log(colors.red("Publish cancelled"));
    }
  } catch (error) {
    console.error(colors.red(`Failed to publish: ${parseErrorMessage(error)}`));
  }
};

init().catch(console.error);
