#!/usr/bin/env zx

import { getNamespace, getRegionByKey } from "../scripts/utils.mjs";
import { container_login } from "../scripts/container.mjs";

$.shell = "/bin/zsh";
$.verbose = false;

const namespace = await getNamespace();
const email = await question("What email? ");
const token = await question("Oracle Cloud Registry Auth Token: ");
const region = await getRegionByKey("FRA");
const ocir_url = `${region.key.toLowerCase()}.ocir.io`;

await container_login(namespace, email, token, ocir_url);
