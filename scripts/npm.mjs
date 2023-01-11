#!/usr/bin/env zx

export async function bumpPreRelease() {
  console.log(`npm version prerelease`);
  try {
    const prerelease = (await $`npm version prerelease`).stdout.trim();
    console.log(`Version bumped: ${prerelease}`);
    return prerelease;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}
