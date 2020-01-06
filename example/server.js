const tftp = require('..');

const server = tftp.createServer()

server.on('client', client => {
  client.write(Buffer.allocUnsafe(0xffffff));
});

server.listen(6969);