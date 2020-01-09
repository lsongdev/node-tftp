const { debuglog } = require('util');

const debug = debuglog('tftp2:server');

const createReader = client => {
  const BLOCK_SIZE = 512;
  return async (push, done) => {
    const { address, port } = client;
    var block = 0, data;
    while (true) {
      await client.sendAck(block);
      ({ block, data } = await client.waitBlock(block + 1));
      debug('received block(%s) size(%s), frsom %s:%s', block, data.length, address, port);
      push(data);
      if (data.length < BLOCK_SIZE) {
        done();
        break;
      }
    }
  };
};


module.exports = createReader;