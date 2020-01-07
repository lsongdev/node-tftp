const fs = require('fs');
const tftp = require('..');

const server = tftp.createServer()

server.on('get', stream => {
  const { filename, mode, address, port } = stream;
  console.log('get', filename, mode, address, port);
  fs.createReadStrem(filename).pipe(stream);
});

server.on('put', stream => {
  const { filename, mode, address, port } = stream;
  console.log('put', filename, mode, address, port);
  stream.pipe(fs.createWriteStream(filename));
});

server.listen(6969);