import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import short from "short-uuid";
import pino from "pino";

dotenv.config({ path: "./config/.env" });
// FIXME change log level based on NODE_ENV
const logger = pino();

const serverId = short.generate();
logger.info(`Server ${serverId}`);

const BROADCAST_REFRESH_UPDATE = process.env.BROADCAST_REFRESH_UPDATE || 50;

// FIXME variable env?
const CLEANUP_STALE_IN_SECONDS = process.env.CLEANUP_STALE_IN_SECONDS || 2;
const BROADCAST_ITEMS_IN_SECONDS = process.env.BROADCAST_ITEMS_IN_SECONDS || 2;

const SCORE_SERVICE_HOST = process.env.SCORE_SERVICE_HOST;
if (!SCORE_SERVICE_HOST) {
  logger.error(`SCORE_SERVICE_HOST not defined`);
  process.exit(1);
}
const SCORE_SERVICE_PORT = process.env.SCORE_SERVICE_PORT;
if (!SCORE_SERVICE_PORT) {
  logger.error(`SCORE_SERVICE_PORT not defined`);
  process.exit(1);
}

const scoreServiceUrl = `${SCORE_SERVICE_HOST}:${SCORE_SERVICE_PORT}`;
logger.info(`Connecting to Score on ${scoreServiceUrl}`);

// FIXME variable env?
const ITEM_MAX_SIZE = process.env.ITEM_MAX_SIZE || 0.9;
const ITEM_MIN_SIZE = process.env.ITEM_MIN_SIZE || 0.5;

const WORLD_SIZE_X = process.env.WORLD_SIZE_X || 88;
const WORLD_SIZE_Y = process.env.WORLD_SIZE_Y || 22;

const GAME_DURATION_IN_SECONDS = process.env.GAME_DURATION_IN_SECONDS || 30;

// FIXME this needs to be stored on some DB
let playersTraces = {};
let playersInfo = {};
let trashPoll = {};
let marineLifePoll = {};

export function start(httpServer, port, pubClient, subClient) {
  const io = new Server(httpServer, {});

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    logger.info(`New client added, ${io.engine.clientsCount} in total.`);

    socket.emit("server.info", {
      id: serverId,
      gameDuration: GAME_DURATION_IN_SECONDS,
    });
    socket.emit("items.all", { ...trashPoll, ...marineLifePoll });

    // FIXME scope this to surrounding players only
    socket.emit("player.info.all", playersInfo);

    socket.emit("game.on");

    socket.on("player.info.joining", ({ id, name }) => {
      playersInfo[id] = { name };
    });

    socket.on("game.start", ({ playerId }) => {
      logger.info(`Client ${playerId} sent "game.start"`);
      setTimeout(async () => {
        logger.info(`"game.end" sent to client ${playerId}`);
        socket.emit("game.end");
        // FIXME thrown exceptions will kill the process!
        const response = await fetch(
          `http://${scoreServiceUrl}/api/score/${playerId}`,
          {
            method: "DELETE",
            headers: { "Content-type": "application/json" },
          }
        );
        // const jsonResponse = await response.json();
      }, GAME_DURATION_IN_SECONDS * 1000);
    });

    socket.on("player.trace.change", ({ id, ...traceData }) => {
      if (!playersTraces[id]) {
        io.emit("player.info.joined", { id, ...playersInfo[id] });
      }
      playersTraces[id] = { ...traceData, updated: new Date() };
    });

    socket.on("items.collision", async (data) => {
      console.log(data);
      const { itemId, playerId, playerName, localScore } = data;
      let stringifyBody;
      if (trashPoll[itemId]) {
        logger.info(
          `Player ${playerId} increased score for collecting ${itemId} trash`
        );
        delete trashPoll[itemId];
        io.emit("item.destroy", itemId);
        stringifyBody = JSON.stringify({
          operationType: "INCREMENT",
          name: playerName,
        });
        console.log({ stringifyBody });
        // FIXME thrown exceptions will kill the process!
        const response = await fetch(
          `http://${scoreServiceUrl}/api/score/${playerId}`,
          {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: stringifyBody,
          }
        );
        const jsonResponse = await response.json();
        socket.emit("player.score", jsonResponse.score);
      } else if (marineLifePoll[itemId]) {
        logger.info(
          `Player ${playerId} decreased score for hitting ${itemId} marine life`
        );
        delete marineLifePoll[itemId];
        io.emit("item.destroy", itemId);
        stringifyBody = JSON.stringify({
          operationType: "DECREMENT",
          name: playerName,
        });
        console.log({ stringifyBody });
        // FIXME thrown exceptions will kill the process!
        const response = await fetch(
          `http://${scoreServiceUrl}/api/score/${playerId}`,
          {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: stringifyBody,
          }
        );
        const jsonResponse = await response.json();
        socket.emit("player.score", jsonResponse.score);
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Disconnect: ${reason}`);
    });
  });

  io.engine.on("connection_error", (err) => {
    logger.error(`ERROR ${err.code}: ${err.message}; ${err.context}`);
  });

  // broadcast all players traces
  setInterval(() => {
    io.emit("player.trace.all", playersTraces);
  }, BROADCAST_REFRESH_UPDATE);

  // refresh items
  setInterval(() => {
    const numberOfPlayers = Object.keys(playersInfo).length;
    const numberOfTrash = Object.keys(trashPoll).length;
    const numberOfMarineLife = Object.keys(marineLifePoll).length;
    const deltaOfDesiredNumberOfTrash = numberOfPlayers - numberOfTrash;
    const deltaOfDesiredNumberOfMarineLife =
      numberOfPlayers * 2 - numberOfMarineLife;
    const extraTrashPoll = {};
    for (let index = 0; index < deltaOfDesiredNumberOfTrash; index++) {
      const { id, ...trashData } = createObject("trash");
      extraTrashPoll[id] = trashData;
      io.emit("item.new", { id, data: extraTrashPoll[id] });
    }
    trashPoll = { ...trashPoll, ...extraTrashPoll };
    const extraMarineLifePoll = {};
    for (let index = 0; index < deltaOfDesiredNumberOfMarineLife; index++) {
      const { id, ...trashData } = createObject("turtle");
      extraMarineLifePoll[id] = trashData;
      io.emit("item.new", { id, data: extraMarineLifePoll[id] });
    }
    marineLifePoll = { ...marineLifePoll, ...extraMarineLifePoll };
  }, BROADCAST_ITEMS_IN_SECONDS * 1000);

  function createObject(type) {
    const x = Math.round((Math.random() - 0.5) * WORLD_SIZE_X);
    const y = Math.round((Math.random() - 0.5) * WORLD_SIZE_Y);
    const z = 0;
    const size = (
      Math.random() * (ITEM_MAX_SIZE - ITEM_MIN_SIZE) +
      ITEM_MIN_SIZE
    ).toFixed(2);
    return { id: short.generate(), type, position: { x, y, z }, size };
  }

  // broadcast all players info
  setInterval(() => {
    io.emit("gen.info.all", playersInfo);
  }, BROADCAST_REFRESH_UPDATE);

  // Clean stale players, and send delete player if stale
  setInterval(() => {
    const now = new Date();
    // FIXME can we delete them without adding elapsed to all of them?
    const elapsedTimesById = Object.entries(playersTraces).map((player) => ({
      id: player[0],
      elapsed: now - player[1].updated,
    }));
    const staleIds = elapsedTimesById.filter((e) => e.elapsed > 250);
    staleIds.forEach((p) => {
      logger.info(`Stale player ${p.id} by ${p.elapsed}ms`);
      io.emit("player.info.left", p.id);
      playersTraces[p.id] = undefined;
      delete playersTraces[p.id];
      playersInfo[p.id] = undefined;
      delete playersInfo[p.id];
    });
  }, CLEANUP_STALE_IN_SECONDS * 1000);

  setInterval(
    () =>
      logger.info(
        `${Object.keys(playersInfo).length} Players, ${
          Object.keys(trashPoll).length
        } Trash items and ${Object.keys(marineLifePoll).length} Marine Life`
      ),
    5000
  );

  httpServer.listen(port, () =>
    logger.info(`Server listening to port ${port}`)
  );
}
