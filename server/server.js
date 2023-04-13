import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import short from "short-uuid";
import pino from "pino";
import { deleteCurrentScore, postCurrentScore } from "./score.js";

dotenv.config({ path: "./config/.env" });
// FIXME change log level based on NODE_ENV
const logger = pino();

const serverId = short.generate();
logger.info(`Server ${serverId}`);

const BROADCAST_REFRESH_UPDATE = process.env.BROADCAST_REFRESH_UPDATE || 50;

// FIXME variable env?
const CLEANUP_STALE_IN_SECONDS = process.env.CLEANUP_STALE_IN_SECONDS || 2;
const BROADCAST_ITEMS_IN_SECONDS = process.env.BROADCAST_ITEMS_IN_SECONDS || 2;

// FIXME variable env?
const ITEM_MAX_SIZE = process.env.ITEM_MAX_SIZE || 0.9;
const ITEM_MIN_SIZE = process.env.ITEM_MIN_SIZE || 0.5;

// FIXME variable env?
const WORLD_SIZE_X = process.env.WORLD_SIZE_X || 88;
const WORLD_SIZE_Y = process.env.WORLD_SIZE_Y || 22;

// FIXME variable env?
const GAME_DURATION_IN_SECONDS = process.env.GAME_DURATION_IN_SECONDS || 180;

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

    // FIXME send random starting position
    socket.emit("game.on");

    socket.on("player.info.joining", ({ id, name }) => {
      playersInfo[id] = { name };
    });

    socket.on("game.start", ({ playerId }) => {
      setTimeout(async () => {
        socket.emit("game.end");
        await deleteCurrentScore(playerId);
      }, GAME_DURATION_IN_SECONDS * 1000);
    });

    socket.on("player.trace.change", ({ id, ...traceData }) => {
      if (!playersTraces[id]) {
        io.emit("player.info.joined", { id, ...playersInfo[id] });
      }
      playersTraces[id] = { ...traceData, updated: new Date() };
    });

    socket.on("items.collision", async (data) => {
      const { itemId, playerId, playerName } = data;
      if (trashPoll[itemId]) {
        delete trashPoll[itemId];
        io.emit("item.destroy", itemId);
        const jsonResponse = await postCurrentScore(
          playerId,
          playerName,
          "INCREMENT"
        );
      } else if (marineLifePoll[itemId]) {
        delete marineLifePoll[itemId];
        io.emit("item.destroy", itemId);
        const jsonResponse = await postCurrentScore(
          playerId,
          playerName,
          "DECREMENT"
        );
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
