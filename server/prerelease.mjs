#!/usr/bin/env zx

import { build_image } from "../scripts/container.mjs";
import { bumpPreRelease } from "../scripts/npm.mjs";

const version = await bumpPreRelease();

await build_image("localhost/multiplayer/server", version);
