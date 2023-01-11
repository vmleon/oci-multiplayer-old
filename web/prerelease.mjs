#!/usr/bin/env zx

import { build_image } from "../scripts/container.mjs";
import { bumpPreRelease } from "../scripts/npm.mjs";
import { build } from "../scripts/web.mjs";

await build();
const version = await bumpPreRelease();

await build_image("localhost/multiplayer/web", version);
