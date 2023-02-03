#!/usr/bin/env zx

export async function bump(level = "patch") {
  try {
    let newVersion;
    switch (level) {
      case "patch":
        newVersion = (await $`npm version patch`).stdout.trim();
        console.log(`New version: ${newVersion}`);
        break;
      case "minor":
        newVersion = (await $`npm version minor`).stdout.trim();
        console.log(`New version: ${newVersion}`);
        break;
      case "major":
        newVersion = (await $`npm version major`).stdout.trim();
        console.log(`New version: ${newVersion}`);
        break;

      default:
        console.log("No version bump");
        break;
    }
    return newVersion;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}

export async function validateBumpLevel(level) {
  if (!["major", "minor", "patch"].includes(level)) {
    console.log(
      chalk.red("Error: release version must be 'major', 'minor' or 'patch'")
    );
    process.exit(1);
  }
  return level;
}

export async function build_web() {
  try {
    console.log(`Install dependencies`);
    await $`npm install`;
    console.log(`Build static content`);
    const output = (await $`npm run build`).stdout.trim();
    console.log(output);
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}
