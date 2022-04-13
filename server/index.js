import {createServer} from 'http';
import {Server} from 'socket.io';

const CORS_URL = process.env.CORS_URL || 'http://localhost';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: CORS_URL,
  },
  serveClient: false,
});

io.on('connection', (socket) => {
  socket.emit('hello', 'world');

  socket.on('earth.rotation.y', (arg) => console.log(arg));
});

httpServer.listen(3000);
