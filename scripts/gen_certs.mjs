#!/usr/bin/env zx

import { createSelfSignedCert } from "./lib/tls.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const certPath = "./deploy/k8s/base/ingress/.certs";
await createSelfSignedCert(certPath);
