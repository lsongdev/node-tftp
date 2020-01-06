const udp = require('dgram');
const Packet = require('./packet');
const { debuglog } = require('util');

const debug = debuglog('tftp2');

/**
 * [TFTP description]
 * @param {[type]} options [description]
 */
const TFTP = (host, port, options = {}) => {
  const {
    timeout = 5000,
    BLOCK_SIZE = 512,
  } = options;
  const rinfo = { port, address: host };
  const client = new udp.createSocket('udp4');
  const send = (rinfo, data) => {
    if (data instanceof Packet)
      data = data.toBuffer();
    return new Promise((resolve, reject) => {
      client.send(data, rinfo.port, rinfo.address, (err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });
  };
  const sendRequest = (opcode, filename) => {
    const packet = Packet.createRequest(opcode, filename);
    return send(rinfo, packet);
  };
  const sendAck = (rinfo, block) => {
    const packet = Packet.createAck(block);
    debug('send ack block %s, sent to %s:%s', block, rinfo.address, rinfo.port);
    return send(rinfo, packet);
  };
  const sendBlock = (rinfo, block, data) => {
    const packet = Packet.createData(block, data);
    debug('send block %s, to %s:%s', block, rinfo.address, rinfo.port);
    return send(rinfo, packet);
  };
  const wait = fn => new Promise((resolve, reject) => {
    const onMessage = (message, rinfo) => {
      const packet = Packet.parse(message);
      packet.rinfo = rinfo;
      fn(packet) && (resolve(packet), removeListener());
    };
    const removeListener = () =>
      client.removeListener('message', onMessage);
    client.on('message', onMessage);
    // const timeoutError = new Error('TFTP Timeout');
    // setTimeout(() => (reject(timeoutError), removeListener()), timeout);
  });

  const waitAck = block => wait(message =>
    message.opcode === Packet.OPCODE.ACK && message.block === block);

  const waitBlock = block => wait(message =>
    message.opcode === Packet.OPCODE.DATA && message.block === block);

  return {
    close() {
      return new Promise(done => {
        client.once('close', done);
        return client.close();
      });
    },
    async read(filename) {
      var block = 0, rinfo, data, buffer = [];
      await sendRequest(Packet.OPCODE.RRQ, filename);
      while (true) {
        ({ rinfo, block, data } = await waitBlock(block + 1));
        debug('received block(%s) size(%s), from %s:%s', block, data.length, rinfo.address, rinfo.port);
        buffer.push(data);
        await sendAck(rinfo, block);
        if (data.length < BLOCK_SIZE) break;
      }
      const result = Buffer.concat(buffer);
      debug('done', Buffer.byteLength(result));
      return result;
    },
    async write(filename, data) {
      var block, rinfo;
      await sendRequest(Packet.OPCODE.WRQ, filename);
      const blocks = Math.floor(data.length / BLOCK_SIZE | 0) + 1;
      for (var i = 0; i < blocks; i++) {
        ({ rinfo, block } = await waitAck(i));
        debug('request block %s, from %s:%s', block, rinfo.address, rinfo.port);
        const start = block * BLOCK_SIZE;
        const end = Math.min(start + BLOCK_SIZE, data.length);
        await sendBlock(rinfo, block + 1, data.slice(start, end));
      }
      debug('done');
    }
  };
};

TFTP.Client = TFTP;
TFTP.Server = require('./server');
TFTP.createServer = () => new TFTP.Server();

module.exports = TFTP;