const tftp = require('..');
const assert = require('assert');

const { read, write, close } = tftp('127.0.0.1', '6969');

(async () => {
  const filename = 'node-tftp-test-data';

  const a = Buffer.allocUnsafe(0xffffff);
  await write(filename, a);

  const b = await read(filename);

  assert.equal(a.length, 0xffffff);
  assert.equal(b.length, 0xffffff);
  assert.deepEqual(a, b);

  console.log('All Tests PASS');

  await close();

})();