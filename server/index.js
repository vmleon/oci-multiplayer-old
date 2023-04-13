import { createServer } from "http";
import express from "express";
import { createClient } from "redis";
import { createTerminus } from "@godaddy/terminus";
import pino from "pino";
import * as dotenv from "dotenv";
import { start } from "./server.js";

dotenv.config({ path: "./config/.env" });

const logger = pino();
const port = process.env.PORT | 3000;
const environment = process.env.NODE_ENV || "development";
logger.info(`Environment: ${environment}`);

const app = express();
const httpServer = createServer(app);

const ENABLE_REDIS_BACKEND =
  process.env.ENABLE_REDIS_BACKEND === "false" ? false : true;

if (ENABLE_REDIS_BACKEND) {
  const REDIS_SERVICE_HOST = process.env.REDIS_SERVICE_HOST
    ? process.env.REDIS_SERVICE_HOST
    : "localhost";

  const REDIS_SERVICE_PORT = process.env.REDIS_SERVICE_PORT
    ? process.env.REDIS_SERVICE_PORT
    : 6379;

  const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
  if (!REDIS_PASSWORD) {
    logger.error(`REDIS_PASSWORD is not declared`);
    process.exit(1);
  }

  const REDIS_URL = `redis://default:${REDIS_PASSWORD}@${REDIS_SERVICE_HOST}:${REDIS_SERVICE_PORT}`;
  const REDIS_URL_OBFUSCATED = `redis://default:*******@${REDIS_SERVICE_HOST}:${REDIS_SERVICE_PORT}`;
  logger.info(`Redis URL: ${REDIS_URL_OBFUSCATED}`);

  const pubClient = createClient({
    url: REDIS_URL,
  });
  const subClient = pubClient.duplicate();
  pubClient.on("error", (err) =>
    logger.error(`Redis Pub Client Error: ${err}`)
  );
  subClient.on("error", (err) =>
    logger.error(`Redis Sub Client Error: ${err}`)
  );

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    start(httpServer, port, pubClient, subClient);
  });
} else {
  start(httpServer, port);
}

function onSignal() {
  console.log("server is starting cleanup");
  if (pubClient) pubClient.quit();
  if (subClient) subClient.quit();
}

async function onHealthCheck() {
  // TODO redis connection status
  return;
}

createTerminus(httpServer, {
  signal: "SIGINT",
  healthChecks: { "/healthz": onHealthCheck },
  onSignal,
});
