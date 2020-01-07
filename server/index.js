const udp = require('dgram');
const { debuglog } = require('util');
const Packet = require('../packet');
const GetStream = require('./stream/get');
const PutStream = require('./stream/put');
const Connection = require('./connection');

const debug = debuglog('tftp2:server');

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
    switch (packet.opcode) {
      case Packet.OPCODE.RRQ: {
        const stream = new GetStream(client);
        Object.assign(stream, packet, rinfo);
        this.emit('get', stream);
        break;
      }
      case Packet.OPCODE.WRQ: {
        const stream = new PutStream(client);
        Object.assign(stream, packet, rinfo);
        this.emit('put', stream);
        break;
      }
    }
    this.emit('client', client);
    return this;
  }
}

module.exports = TFTPServer;