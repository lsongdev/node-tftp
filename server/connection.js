const udp = require('dgram');
const { debuglog } = require('util');
const Packet = require('../packet');

const debug = debuglog('tftp2:server');

const BLOCK_SIZE = 512;

class Connection extends udp.Socket {
  constructor(rinfo) {
    super({ type: 'udp4' });
    this.rinfo = rinfo;
  }
  send(data) {
    const { rinfo } = this;
    if (data instanceof Packet)
      data = data.toBuffer();
    return new Promise((resolve, reject) => {
      super.send(data, rinfo.port, rinfo.address, (err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });
  }
  sendAck(block) {
    const { rinfo } = this;
    const packet = Packet.createAck(block);
    debug('send ack block %s to %s:%s', block, rinfo.address, rinfo.port);
    return this.send(packet);
  }
  sendBlock(block, data) {
    const { rinfo } = this;
    const packet = Packet.createData(block, data);
    debug('send block %s size %s, to %s:%s', block, data.length, rinfo.address, rinfo.port);
    return this.send(packet);
  }
  wait(fn) {
    return new Promise((resolve, reject) => {
      const onMessage = (message, rinfo) => {
        console.log(message);

        const packet = Packet.parse(message);
        packet.rinfo = rinfo;
        fn(packet) && (resolve(packet), removeListener());
      };
      const removeListener = () =>
        this.removeListener('message', onMessage);
      this.on('message', onMessage);
      // const timeoutError = new Error('TFTP Timeout');
      // setTimeout(() => (reject(timeoutError), removeListener()), timeout);
    });
  }
  waitAck(block) {
    return this.wait(message =>
      message.opcode === Packet.OPCODE.ACK && message.block === block);
  }
  waitBlock(block) {
    debug('waitBlock', block);
    return this.wait(message =>
      message.opcode === Packet.OPCODE.DATA && message.block === block);
  }
  async read(push, done) {
    const { rinfo } = this;
    var block = 0, data;
    while (true) {
      await this.sendAck(block);
      ({ block, data } = await this.waitBlock(block + 1));
      push(data);
      debug('received block(%s) size(%s), frsom %s:%s', block, data.length, rinfo.address, rinfo.port);
      if (data.length < BLOCK_SIZE) break;
    }
    return done();
  }
  async write(data) {
    const blocks = Math.floor(data.length / BLOCK_SIZE) + 1;
    for (var block = 1; block <= blocks; block++) {
      const start = (block - 1) * BLOCK_SIZE;
      const end = Math.min(start + BLOCK_SIZE, data.length);
      await sendBlock(block, data.slice(start, end));
      await waitAck(block);
    }
  }
}

module.exports = Connection;