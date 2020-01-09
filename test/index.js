const tftp = require('..');
const test = require('./test');
const assert = require('assert');

const { Packet } = tftp;

test('Packet#RRQ', () => {
  const packet = new Packet(Packet.OPCODE.RRQ);
  packet.filename = 'test.txt';
  const data = packet.toBuffer();
  assert.equal(data.readUInt16BE(0), Packet.OPCODE.RRQ);
});

test('Packet#WRQ', () => {
  const packet = new Packet(Packet.OPCODE.WRQ);
  packet.filename = 'test.txt';
  const data = packet.toBuffer();
  assert.equal(data.readUInt16BE(0), Packet.OPCODE.WRQ);
});

test('Packet#Data', () => {
  const data = Packet.createData(1, Buffer.allocUnsafe(0xff));
  assert.equal(data.readUInt16BE(0), Packet.OPCODE.DATA);
  assert.equal(data.length, 2 + 2 + 0xff);
});

test('Packet#Ack', () => {
  const data = Packet.createAck(1);
  assert.equal(data.readUInt16BE(0), Packet.OPCODE.ACK);
  assert.equal(data.length, 2 + 2);
});

test('Packet#decode', () => {
  const a = new Packet(Packet.OPCODE.WRQ);
  a.filename = 'test.txt';
  const b = Packet.parse(a.toBuffer());
  assert.equal(a.opcode, b.opcode);
  assert.equal(a.filename, b.filename);
  assert.equal(b.mode, 'octet');
});