import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import colors from "picocolors";
import prompts from "prompts";
import semver from "semver";

import { parseErrorMessage } from "../lib/utils";

type PackageName = `@paysimple/simple${"" | "-dev" | "-types" | "-dev-types"}`;

const execPromise = util.promisify(exec);

let latestVersion: Record<PackageName, string | null> = {
  "@paysimple/simple": null,
  "@paysimple/simple-dev": null,
  "@paysimple/simple-types": null,
  "@paysimple/simple-dev-types": null,
};

/**
 * Fetches the latest version of a given package from the npm registry.
 * @param {PackageName} packageName - The name of the package to fetch the version for.
 * @returns {Promise<string>} - The latest version of the package.
 */
const fetchLatestVersion = async (
  packageName: PackageName,
): Promise<string> => {
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
 * Retrieves the latest version of a given package.
 * @param {PackageName} packageName - The name of the package to retrieve the version for.
 * @returns {string | null} - The latest version of the package or null if not found.
 */
function getLatestVersion(packageName: PackageName) {
  return latestVersion[packageName];
}

/**
 * Runs a series of prompts to gather user input for publishing a package.
 * @returns {Promise<object>} - The responses from the prompts.
 */
const runPrompts = async (): Promise<
  prompts.Answers<
    | "publishType"
    | "environment"
    | "versionType"
    | "customVersion"
    | "verifyVersion"
    | "typesVersionType"
    | "typesCustomVersion"
    | "typesVerifyVersion"
    | "confirmPublish"
  >
> => {
  const responses = await prompts(
    [
      {
        type: "select",
        name: "publishType",
        message: "What would you like to publish?",
        choices: [
          { title: "Both SDK and Types", value: "both" },
          { title: "SDK Only", value: "sdk" },
          { title: "Types Only", value: "types" },
        ],
      },
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
      },
      {
        type: (_, values) =>
          ["sdk", "both"].includes(values.publishType) ? "select" : null,
        name: "versionType",
        message: "Select the type of version release for SDK:",
        choices: [
          { title: "Patch", value: "patch" },
          { title: "Minor", value: "minor" },
          { title: "Major", value: "major" },
          { title: "Define version yourself", value: "custom" },
        ],
      },
      {
        type: (prev, values) =>
          prev === "custom" && ["sdk", "both"].includes(values.publishType)
            ? "text"
            : null,
        name: "customVersion",
        message: "Enter the custom version for SDK:",
        initial: (_, { environment }) => getLatestVersion(environment) ?? "",
      },
      {
        type: (_, values) =>
          ["sdk", "both"].includes(values.publishType) ? "text" : null,
        name: "verifyVersion",
        message: "Enter the version to verify for SDK:",
        initial: (_, values) => {
          if (values.versionType === "custom") {
            return values.customVersion;
          }

          return semver.inc(
            getLatestVersion(values.environment) ?? "",
            values.versionType,
          );
        },
        validate: (value) => {
          if (!semver.valid(value)) {
            return "Invalid version";
          }
          return true;
        },
      },
      {
        type: (_, values) =>
          ["types", "both"].includes(values.publishType) ? "select" : null,
        name: "typesVersionType",
        message: "Select the type of version release for types:",
        choices: [
          { title: "Patch", value: "patch" },
          { title: "Minor", value: "minor" },
          { title: "Major", value: "major" },
          { title: "Define version yourself", value: "custom" },
        ],
      },
      {
        type: (prev, values) =>
          prev === "custom" && ["types", "both"].includes(values.publishType)
            ? "text"
            : null,
        name: "typesCustomVersion",
        message: "Enter the custom version for types:",
        initial: (_, { environment }) => {
          const packageName = environment.includes("dev")
            ? "@paysimple/simple-dev-types"
            : "@paysimple/simple-types";

          return getLatestVersion(packageName) ?? "";
        },
      },
      {
        type: (_, values) =>
          ["types", "both"].includes(values.publishType) ? "text" : null,
        name: "typesVerifyVersion",
        message: "Enter the version to verify for types:",
        initial: (_, values) => {
          if (values.typesVersionType === "custom") {
            return values.typesCustomVersion;
          }

          const packageName = values.environment.includes("dev")
            ? "@paysimple/simple-dev-types"
            : "@paysimple/simple-types";

          return semver.inc(
            getLatestVersion(packageName) ?? "",
            values.typesVersionType,
          );
        },
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
        message: (_, values) => {
          if (values.publishType === "both") {
            return "Are you sure you want to publish both the package and types?";
          }
          return `Are you sure you want to publish the ${values.publishType}?`;
        },
        initial: false,
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
  packageName: PackageName,
  newVersion: string,
) => {
  const packageJsonPath = path.join(rootPath, "package.npm.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  packageJson.name = packageName;
  packageJson.version = newVersion;

  if (packageName.includes("types")) {
    packageJson.main = "index.d.ts";
    packageJson.types = "index.d.ts";
    packageJson.files = ["index.d.ts"];
  }

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
 * @param {PackageName} packageName - The name of the package to publish.
 * @param {string} newVersion - The version of the package to publish.
 */
const publishPackage = async (
  packageName: PackageName,
  newVersion: string | undefined,
  newTypesVersion: string | undefined,
  publishType: "sdk" | "types" | "both",
) => {
  const isProduction = packageName === "@paysimple/simple";
  process.env.NODE_ENV = isProduction ? "production" : "development";

  const rootPath = path.resolve(__dirname, "..");
  const distPath = path.resolve(
    __dirname,
    "../dist",
    isProduction ? "prod" : "dev",
  );
  const typesDistPath = path.resolve(
    __dirname,
    "../dist",
    isProduction ? "types" : "dev-types",
  );

  try {
    if (["sdk", "both"].includes(publishType)) {
      ensureDistPathExists(distPath);
      updatePackageJson(rootPath, distPath, packageName, newVersion!);
      updateReadmeUrls(rootPath, distPath, packageName, newVersion!);
    }

    if (["types", "both"].includes(publishType)) {
      ensureDistPathExists(typesDistPath);
      updatePackageJson(
        rootPath,
        typesDistPath,
        isProduction
          ? "@paysimple/simple-types"
          : "@paysimple/simple-dev-types",
        newTypesVersion!,
      );
      updateReadmeUrls(rootPath, typesDistPath, packageName, newTypesVersion!);
    }

    // Build only if publishing SDK
    if (["sdk", "both"].includes(publishType)) {
      console.log(
        colors.yellow(
          `\nBuilding ${packageName} with version ${newVersion}...\n`,
        ),
      );
      await execPromise(`bun run build`);

      const indexPath = path.join(rootPath, "dist", "index.js");
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, path.join(distPath, "index.js"));
      } else {
        throw new Error(`index.js not found at ${indexPath}`);
      }
    }

    // Copy types if publishing types or both
    if (["types", "both"].includes(publishType)) {
      const typesPath = path.join(rootPath, "types", "globals.d.ts");
      if (fs.existsSync(typesPath)) {
        if (publishType === "both") {
          fs.copyFileSync(typesPath, path.join(distPath, "index.d.ts"));
        }
        fs.copyFileSync(typesPath, path.join(typesDistPath, "index.d.ts"));
      } else {
        throw new Error(`globals.d.ts not found at ${typesPath}`);
      }
    }

    if (isProduction) {
      console.log(colors.yellow("Production package prepared for publishing!"));
      console.log(colors.cyan("\nPlease verify the following:"));
      console.log("1. Check the contents of the dist folder");
      console.log("2. Verify the package.json version and name");
      console.log("3. Confirm the README CDN URLs are correct");
      console.log("\nThen run manually:");

      if (["sdk", "both"].includes(publishType)) {
        console.log(
          colors.cyan(
            "\nRun the following command to publish the main package:",
          ),
        );
        console.log(
          colors.green(`npm publish ${distPath} --access public --tag latest`),
        );
      }

      if (["types", "both"].includes(publishType)) {
        console.log(
          colors.cyan(
            "\nRun the following command to publish the types package:",
          ),
        );
        console.log(
          colors.green(
            `npm publish ${typesDistPath} --access public --tag latest`,
          ),
        );
      }
    } else {
      if (["sdk", "both"].includes(publishType)) {
        console.log(
          colors.yellow(
            `Publishing to ${packageName} with version ${newVersion}...`,
          ),
        );
        await execPromise(
          `npm publish ${distPath} --access public --tag latest`,
        );
        console.log(
          colors.green(
            `Successfully published ${packageName} with version ${newVersion}!\n`,
          ),
        );
      }

      if (["types", "both"].includes(publishType)) {
        console.log(
          colors.yellow(
            `Publishing types to ${packageName} with version ${newTypesVersion}...`,
          ),
        );
        await execPromise(
          `npm publish ${typesDistPath} --access public --tag latest`,
        );
        console.log(
          colors.green(
            `Successfully published types for ${packageName} with version ${newTypesVersion}!\n`,
          ),
        );
      }
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
  console.log(colors.cyan("Fetching latest versions..."));

  const [
    latestProdVersion,
    latestDevVersion,
    latestProdTypesVersion,
    latestDevTypesVersion,
  ] = await Promise.all([
    fetchLatestVersion("@paysimple/simple"),
    fetchLatestVersion("@paysimple/simple-dev"),
    fetchLatestVersion("@paysimple/simple-types"),
    fetchLatestVersion("@paysimple/simple-dev-types"),
  ]);

  console.log(colors.green("Latest versions fetched"));

  latestVersion = {
    "@paysimple/simple-dev": latestDevVersion,
    "@paysimple/simple-dev-types": latestDevTypesVersion,
    "@paysimple/simple": latestProdVersion,
    "@paysimple/simple-types": latestProdTypesVersion,
  };

  console.log(colors.cyan("\nRunning prompts...\n"));

  try {
    const {
      environment,
      verifyVersion,
      typesVerifyVersion,
      confirmPublish,
      publishType,
    } = await runPrompts();

    if (confirmPublish) {
      await publishPackage(
        environment,
        verifyVersion,
        typesVerifyVersion,
        publishType,
      );
    } else {
      console.log(colors.red("Publishing cancelled"));
    }
  } catch (error) {
    console.error(colors.red(`Failed to publish: ${parseErrorMessage(error)}`));
  }
};

init().catch(console.error);
