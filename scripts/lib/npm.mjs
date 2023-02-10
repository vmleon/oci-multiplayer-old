#!/usr/bin/env zx
import { exitWithError } from "./utils.mjs";

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
    exitWithError(error.stderr);
  }
}

export async function validateBumpLevel(level) {
  if (!["major", "minor", "patch"].includes(level)) {
    exitWithError("Error: release version must be 'major', 'minor' or 'patch'");
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
    exitWithError(error.stderr);
  }
}
