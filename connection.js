const udp = require('dgram');
const { debuglog } = require('util');
const Packet = require('./packet');

const debug = debuglog('tftp2:server');

class Connection extends udp.Socket {
  constructor(rinfo) {
    super('udp4');
    this.socket = this;
    this.setRemoteDescription(rinfo);
  }
  setRemoteDescription(rinfo) {
    return Object.assign(this, this.rinfo = rinfo);
  }
  sendPacket(data) {
    const { rinfo } = this;
    if (data instanceof Packet)
      data = data.toBuffer();
    return new Promise((resolve, reject) => {
      this.socket.send(data, rinfo.port, rinfo.address, (err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });
  }
  sendRequest(opcode, filename) {
    const packet = Packet.createRequest(opcode, filename);
    return this.sendPacket(packet);
  };
  sendAck(block) {
    const { rinfo } = this;
    const packet = Packet.createAck(block);
    debug('send ack block %s to %s:%s', block, rinfo.address, rinfo.port);
    return this.sendPacket(packet);
  }
  sendBlock(block, data) {
    const { rinfo } = this;
    const packet = Packet.createData(block, data);
    debug('send block %s size %s, to %s:%s', block, data.length, rinfo.address, rinfo.port);
    return this.sendPacket(packet);
  }
  wait(fn) {
    return new Promise((resolve, reject) => {
      const onMessage = (message, rinfo) => {
        const packet = Packet.parse(message);
        packet.rinfo = rinfo;
        fn(packet) && (resolve(packet), removeListener());
      };
      const removeListener = () =>
        this.socket.removeListener('message', onMessage);
      this.socket.on('message', onMessage);
    });
  }
  waitAck(block) {
    return this.wait(message =>
      message.opcode === Packet.OPCODE.ACK && message.block === block);
  }
  waitBlock(block) {
    return this.wait(message =>
      message.opcode === Packet.OPCODE.DATA && message.block === block);
  }
}

module.exports = Connection;