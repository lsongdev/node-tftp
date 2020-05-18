const tftp = require('..');
const assert = require('assert');

const { read, write } = tftp('127.0.0.1', '6969');

const readChunk = filename =>
  new Promise(async (resolve, reject) => {
    const buffer = [];
    await read(filename, chunk => buffer.push(chunk), () =>
      resolve(Buffer.concat(buffer)));
  });

(async () => {

  const filename = `node-tftp-test-data`;
  const a = Buffer.allocUnsafe(0xffffff);
  await write(filename, a);

  console.log('write done');
  const b = await readChunk(filename);

  console.log('read done');
  assert.equal(a.length, 0xffffff);
  assert.equal(b.length, 0xffffff);
  assert.deepEqual(a, b);

  console.log('All Tests PASS');

})();