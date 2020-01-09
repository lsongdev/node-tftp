const udp = require('dgram');
const Packet = require('../packet');
const Connection = require('../connection');
const createReader = require('./reader');
const createWriter = require('./writer');

/**
 * [Server description]
 * @param {[type]} options [description]
 * @docs https://tools.ietf.org/html/rfc1350
 */
class TFTPServer extends udp.Socket {
  constructor() {
    super({ type: 'udp4' });
    this.on('message', this.handleMessage.bind(this));
  }
  listen(port) {
    return new Promise((resolve, reject) => {
      return this.bind(port, err => err ? reject(err) : resolve());
    });
  }
  handleMessage(message, rinfo) {
    const packet = Packet.parse(message);
    const client = new Connection(rinfo);
    this.emit('client', client);
    client.mode = packet.mode;
    client.filename = packet.filename;
    switch (packet.opcode) {
      case Packet.OPCODE.RRQ: {
        this.handleReadRequest(client, packet);
        break;
      }
      case Packet.OPCODE.WRQ: {
        this.handleWriteRequest(client, packet);
        break;
      }
    }
    return this;
  }
  handleReadRequest(client) {
    const write = createWriter(client);
    this.emit('get', client, write);
  }
  handleWriteRequest(client) {
    const read = createReader(client);
    this.emit('put', client, read);
  }
}

module.exports = TFTPServer;