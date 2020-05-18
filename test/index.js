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

const { read, write, close } = tftp('127.0.0.1', '6969');

const readChunk = filename =>
  new Promise(async (resolve, reject) => {
    const buffer = [];
    await read(filename, chunk => buffer.push(chunk), () =>
      resolve(Buffer.concat(buffer)));
  });

const filename = `node-tftp-test-data`;
const a = Buffer.allocUnsafe(0xffffff);

test('tftp#write', async () => {
  await write(filename, a);
});

test('tftp#read', async () => {
  const b = await readChunk(filename);
  assert.equal(a.length, 0xffffff);
  assert.equal(b.length, 0xffffff);
  assert.deepEqual(a, b);
  close();
});
