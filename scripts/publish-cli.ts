import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import colors from "picocolors";
import prompts from "prompts";
import semver from "semver";

import { parseErrorMessage } from "../lib/utils";

const execPromise = util.promisify(exec);

const getLatestVersion = async (packageName: string): Promise<string> => {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();
  return data["dist-tags"].latest;
};

const runPrompts = async () => {
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

const ensureDistPathExists = (distPath: string) => {
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    console.log(colors.cyan(`Created directory: ${distPath}`));
  }
};

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

const copyFilesToDist = (rootPath: string, distPath: string) => {
  fs.copyFileSync(
    path.join(rootPath, "README.npm.md"),
    path.join(distPath, "README.md"),
  );
  fs.copyFileSync(
    path.join(rootPath, "package.npm.json"),
    path.join(distPath, "package.json"),
  );
};

const publishPackage = async (packageName: string, newVersion: string) => {
  const rootPath = path.resolve(__dirname, "..");
  const distPath = path.resolve(__dirname, "../dist");
  try {
    ensureDistPathExists(distPath);
    console.log(colors.cyan("Preparing files for publishing..."));
    copyFilesToDist(rootPath, distPath);
    updatePackageJson(rootPath, distPath, packageName, newVersion);

    console.log(
      colors.yellow(`Building ${packageName} with version ${newVersion}...`),
    );
    await execPromise(`NODE_ENV=production bun run build`);

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
  } catch (error) {
    console.error(colors.red(`Failed to publish: ${parseErrorMessage(error)}`));
  }
};

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
