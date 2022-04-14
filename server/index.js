import {createServer} from 'http';
import {Server} from 'socket.io';
import pino from 'pino';

const logger = pino();
const CORS_URL = process.env.CORS_URL || '*';

const httpServer = createServer();

let planes = {};

const io = new Server(httpServer, {
  cors: {
    origin: CORS_URL,
  },
  serveClient: false,
});

io.on('connection', (socket) => {
  logger.info(socket.id);
  Object.keys(planes).forEach((id) => {
    logger.info(`plane.new ${id} to ${socket.id}`);
    socket.emit('plane.new', id);
  });

  socket.on('plane.trace', (plane) => {
    const {id, ...others} = plane;
    if (!planes[id]) {
      io.emit('plane.new', id);
    }
    planes[id] = {...others, updated: new Date()};
  });
});

// send all planes data to all
setInterval(() => {
  io.emit('planes', planes);
}, 1000);

// Clean stale planes, and send delete plane if stale
setInterval(() => {
  const now = new Date();
  const elapsedTimesById = Object.entries(planes).map((e) => ({
    id: e[0],
    elapsed: now - e[1].updated,
  }));
  const staleIds = elapsedTimesById.filter((e) => e.elapsed > 2000);
  staleIds.forEach((p) => {
    logger.info(`Cleaning stale plane ${p.id} last updated ${p.elapsed / 1000}s ago`);
    io.emit('plane.delete', p.id);
    planes[p.id] = undefined;
    delete planes[p.id];
  });
}, 2000);

setInterval(() => logger.info(`Currently, ${Object.keys(planes).length} active planes`), 5000);

httpServer.listen(3000);
