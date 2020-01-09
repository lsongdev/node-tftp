const fs = require('fs');
const tftp = require('..');

const server = tftp.createServer()

server.on('get', async (req, send) => {
  const { filename, mode, address, port } = req;
  console.log('get', filename, mode, address, port);
  await send(fs.readFileSync(filename));
});

server.on('put', async (req, read) => {
  const { filename, mode, address, port } = req;
  console.log('put', filename, mode, address, port);
  const buffer = [];
  read(chunk => buffer.push(chunk), () => {
    fs.writeFileSync(filename, Buffer.concat(buffer));
  });
});

server.listen(6969);