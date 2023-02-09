#!/usr/bin/env zx

import { dockerAliasWhenNoPodman } from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await dockerAliasWhenNoPodman();

await $`podman stop server0`;
