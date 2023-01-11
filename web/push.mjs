#!/usr/bin/env zx

import { getVersion, getNamespace } from "../scripts/utils.mjs";
import { tag_image, push_image } from "../scripts/container.mjs";

$.shell = "/bin/zsh";
$.verbose = false;

const namespace = await getNamespace();
const version = await getVersion();
const local_image = `localhost/multiplayer/web:v${version}`;
const remote_image = `fra.ocir.io/${namespace}/multiplayer/web:${version}`;
await tag_image(local_image, remote_image);

await push_image(remote_image);
