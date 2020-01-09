
/**
 * TFTP Packet
 * @param {*} opcode 
 */
function Packet(opcode) {
  this.opcode = opcode;
  return this;
};

/**
 * [OPCODE description]
 * @type {Object}
 * @docs https://tools.ietf.org/html/rfc1350#section-5
 */
Packet.OPCODE = {
  RRQ: 0x01,
  WRQ: 0x02,
  DATA: 0x03,
  ACK: 0x04,
  ERROR: 0x05
};

/**
 * Read Buffer
 */
Packet.createReader = (data, offset = 0) => {
  return {
    read(n) {
      const v = data.readUIntBE(offset, n);
      offset += n;
      return v;
    },
    readStr() {
      var start = offset;
      while (data[offset++]) { }
      return data.toString('ascii', start, offset - 1);
    },
    readToEnd() {
      return data.slice(offset);
    }
  }
};

/**
 * Write Buffer
 */
Packet.createWriter = () => {
  return () => {

  };
};

/**
 * [parse description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Packet.parse = msg => {
  const packet = new Packet();
  const reader = Packet.createReader(msg);
  packet.opcode = reader.read(2);
  switch (packet.opcode) {
    case Packet.OPCODE.RRQ:
    case Packet.OPCODE.WRQ:
      packet.filename = reader.readStr();
      packet.mode = reader.readStr();
      break;
    case Packet.OPCODE.DATA:
      packet.block = reader.read(2);
      packet.data = reader.readToEnd();
      break;
    case Packet.OPCODE.ACK:
      packet.block = reader.read(2);
      break;
    case Packet.OPCODE.ERROR:
      packet.code = reader.read(2);
      packet.message = reader.readStr();
      break;
    default:
      break;
  }
  return packet;
};

/**
 * Encode Packet 
 */
Packet.encode = packet => {
  switch (packet.opcode) {
    case Packet.OPCODE.RRQ:
    case Packet.OPCODE.WRQ: {
      const { opcode, filename, mode } = packet;
      return Packet.createRequest(opcode, filename, mode);
    }
    case Packet.OPCODE.DATA: {
      const { block, data } = packet;
      return Packet.createData(block, data);
    }
    case Packet.OPCODE.ACK: {
      return Packet.createAck(packet.block);
    }
    case Packet.OPCODE.ERROR: {
      const { code, message } = packet;
      return Packet.createError(code, message);
    }
  }
};

/**
 * Packet to Buffer
 */
Packet.prototype.toBuffer = function () {
  return Packet.encode(this);
};

/**
 * Creates a buffer for a request.
   2 bytes     string    1 byte     string   1 byte
   ------------------------------------------------
  | Opcode |  Filename  |   0  |    Mode    |   0  |
   ------------------------------------------------
 * @param  {String|Number} type     Int Opcode, or String (read|write|rrq|wrq)
 * @param  {String} filename        Filename to add in the request
 * @param  {String} mode            optional Mode (netascii|octet|email) - Defaults to octet
 * @return {Buffer}                 The Buffer
 */
Packet.createRequest = (type, filename, mode = 'octet') => {
  // Calculate the length of the buffer
  // mode (2 byte opcode) + length of filename + 1 null byte + length of mode + 1 null byte.
  const buffLen = 4 + filename.length + mode.length;
  // Create the buffer
  const buff = Buffer.alloc(buffLen);
  // Write mode (as unsigned 16 bit integer) on offset 0
  buff.writeUInt16BE(type, 0);
  // Write filename as ascii on offset 2
  buff.write(filename, 2, 'ascii');
  // Write mode as ascii on offset filename.length + 3 (type + filename null termination)
  buff.write(mode, 2 + filename.length + 1, 'ascii');
  // Make sure the ends of the strings are null
  buff[2 + filename.length] = buff[buffLen - 1] = 0;
  // Return the new buffer
  return buff;
}

/**
 * Creates a buffer for a data packet
   2 bytes     2 bytes      n bytes
   ----------------------------------
  | Opcode |   Block #  |   Data     |
   ----------------------------------
 * @param  {Number} blockNumber Which block of the transaction it is
 * @param  {Buffer} data        The data to send
 * @return {Buffer}             The Buffer
 */
Packet.createData = (blockNumber, data) => {
  const type = Packet.OPCODE.DATA;
  // Type + blocknumber + length of data(max 512)
  const dataLen = Math.min(data.length, 512);
  const buffLen = 4 + dataLen;
  const buff = Buffer.alloc(buffLen);
  buff.writeUInt16BE(type, 0); // Type as UInt16BE on offset: 0
  buff.writeUInt16BE(blockNumber, 2); // BlockNumber as UInt16BE on offset: 2
  // Copy `data` into buff on offset 4. bytes 0 to 512 from `data`.
  data.copy(buff, 4, 0, dataLen); // targetBuffer, targetStart, sourceStart, sourceEnd
  return buff;
}

/**
 * Creates a buffer for a ACK packet
   2 bytes     2 bytes
   ---------------------
  | Opcode |   Block #  |
   ---------------------
 * @param  {Number} blockNumber Which block to ack
 * @return {Buffer}             The Buffer
 */
Packet.createAck = blockNumber => {
  const type = Packet.OPCODE.ACK;
  const buff = Buffer.alloc(4);
  buff.writeUInt16BE(type, 0); // Type as UInt16BE on offset: 0
  buff.writeUInt16BE(blockNumber, 2); // BlockNumber as UInt16BE on offset: 2
  return buff;
}

module.exports = Packet;