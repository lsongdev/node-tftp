const udp = require('dgram');
const Packet = require('./packet');
const { debuglog } = require('util');

const debug = debuglog('tftp2:server');

const createClient = (rinfo, { opcode, filename, mode }) => {
  const BLOCK_SIZE = 512;
  const socket = new udp.createSocket('udp4');
  const send = data => {
    if (data instanceof Packet)
      data = data.toBuffer();
    return new Promise((resolve, reject) => {
      socket.send(data, rinfo.port, rinfo.address, (err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });
  };
  const sendAck = block => {
    const packet = Packet.createAck(block);
    debug('send ack block %s to %s:%s', block, rinfo.address, rinfo.port);
    return send(packet);
  };
  const sendBlock = (block, data) => {
    const packet = Packet.createData(block, data);
    debug('send block %s size %s, to %s:%s', block, data.length, rinfo.address, rinfo.port);
    return send(packet);
  };
  const wait = fn => new Promise((resolve, reject) => {
    const onMessage = (message, rinfo) => {
      const packet = Packet.parse(message);
      packet.rinfo = rinfo;
      fn(packet) && (resolve(packet), removeListener());
    };
    const removeListener = () =>
      socket.removeListener('message', onMessage);
    socket.on('message', onMessage);
    // const timeoutError = new Error('TFTP Timeout');
    // setTimeout(() => (reject(timeoutError), removeListener()), timeout);
  });

  const waitAck = block => wait(message =>
    message.opcode === Packet.OPCODE.ACK && message.block === block);

  const waitBlock = block => wait(message =>
    message.opcode === Packet.OPCODE.DATA && message.block === block);

  return {
    opcode,
    mode,
    filename,
    async read() {
      var block = 0, data, buffer = [];
      while (true) {
        await sendAck(block);
        ({ block, data } = await waitBlock(block + 1));
        buffer.push(data);
        debug('received block(%s) size(%s), from %s:%s', block, data.length, rinfo.address, rinfo.port);
        if (data.length < BLOCK_SIZE) break;
      }
      return Buffer.concat(buffer);
    },
    async write(data) {
      const blocks = Math.floor(data.length / BLOCK_SIZE) + 1;
      for (var block = 1; block <= blocks; block++) {
        const start = (block - 1) * BLOCK_SIZE;
        const end = Math.min(start + BLOCK_SIZE, data.length);
        await sendBlock(block, data.slice(start, end));
        await waitAck(block);
      }
      debug('done');
    }
  };
};

/**
 * [Server description]
 * @param {[type]} options [description]
 * @docs https://tools.ietf.org/html/rfc1350
 */
class TFTPServer extends udp.Socket {
  constructor() {
    super({
      type: 'udp4'
    });
    this.on('message', this.handleMessage.bind(this));
  }
  handleMessage(message, rinfo) {
    const packet = Packet.parse(message);
    const client = createClient(rinfo, packet);
    this.emit('client', client);
  }
  listen(port) {
    return new Promise((resolve, reject) => {
      return this.bind(port, err => err ? reject(err) : resolve());
    });
  }
}

module.exports = TFTPServer;