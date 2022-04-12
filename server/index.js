import {createServer} from 'http';
import {Server} from 'socket.io';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: 'http://192.168.1.4:8080',
  },
  serveClient: false,
});

io.on('connection', (socket) => {
  socket.emit('hello', 'world');

  socket.on('earth.rotation.y', (arg) => console.log(arg));
});

httpServer.listen(3000);
