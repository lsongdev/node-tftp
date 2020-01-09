const { debuglog } = require('util');
const Packet = require('./packet');
const Connection = require('./connection');

const debug = debuglog('tftp2');

/**
 * [TFTP description]
 * @param {[type]} options [description]
 */
const TFTP = (host, port, { BLOCK_SIZE = 512 } = {}) => {
  const rinfo = { address: host, port };
  const client = new Connection(rinfo);
  const init = () => client.setRemoteDescription(rinfo);
  return {
    async read(filename, push, done) {
      let block = 0, rinfo, data;
      await init();
      await client.sendRequest(Packet.OPCODE.RRQ, filename);
      while (true) {
        ({ rinfo, block, data } = await client.waitBlock(block + 1));
        debug('received block(%s) size(%s), from %s:%s', block, data.length, rinfo.address, rinfo.port);
        push(data);
        await client.setRemoteDescription(rinfo);
        await client.sendAck(block);
        if (data.length < BLOCK_SIZE) {
          done();
          break;
        }
      }
    },
    async write(filename, data) {
      let block, rinfo;
      await init();
      await client.sendRequest(Packet.OPCODE.WRQ, filename);
      const blocks = Math.floor(data.length / BLOCK_SIZE | 0) + 1;
      for (var i = 0; i < blocks; i++) {
        ({ rinfo, block } = await client.waitAck(i));
        await client.setRemoteDescription(rinfo);
        debug('request block %s, from %s:%s', block, rinfo.address, rinfo.port);
        const start = block * BLOCK_SIZE;
        const end = Math.min(start + BLOCK_SIZE, data.length);
        await client.sendBlock(block + 1, data.slice(start, end));
      }
      debug('done');
    }
  };
};

TFTP.Client = TFTP;
TFTP.Packet = Packet;
TFTP.Server = require('./server');
TFTP.createServer = () => new TFTP.Server();

module.exports = TFTP;