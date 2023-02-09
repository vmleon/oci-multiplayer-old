#!/usr/bin/env zx

import { dockerAliasWhenNoPodman } from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await dockerAliasWhenNoPodman();

try {
  const { stdout, stderr, exitCode } = await $`podman stop redis_multiplayer`;
  if (exitCode == 0) {
    console.log(chalk.green(stdout.trim()));
  } else {
    console.error(chalk.red(stderr.trim()));
  }
} catch (error) {
  console.error(chalk.red(error.stderr.trim()));
  process.exit(1);
}
