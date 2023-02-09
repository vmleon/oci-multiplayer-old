#!/usr/bin/env zx

import { dockerAliasWhenNoPodman } from "./lib/container.mjs";
import { getVersion, getNamespace } from "./lib/utils.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await dockerAliasWhenNoPodman();

const project = "oci_oke_websocket";
const namespace = await getNamespace();

const serverImageName = `${project}/server`;
await cd("server");
const serverVersion = await getVersion();
await cd("..");
const serverRemoteImage = `fra.ocir.io/${namespace}/${serverImageName}:${serverVersion}`;
await $`podman run -d --rm --name server0 -p3000:3000 ${serverRemoteImage}`;
