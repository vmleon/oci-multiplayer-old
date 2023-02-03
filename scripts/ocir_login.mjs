#!/usr/bin/env zx

import { getNamespace } from "./lib/utils.mjs";
import { containerLogin } from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const namespace = await getNamespace();
const user = await question("OCI Username (usually the email): ");
const tokenEnv = process.env.OCI_OCIR_TOKEN;
const token = tokenEnv ? tokenEnv : await question("OCI Auth Token for OCIR: ");

const regionAnswer = await question("What region are you using? (fra,lhr): ");
const url = `${regionAnswer.toLowerCase()}.ocir.io`;

await containerLogin(namespace, user, token, url);
