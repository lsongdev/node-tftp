

const createWriter = client => {
  const BLOCK_SIZE = 512;
  return async data => {
    const blocks = Math.floor(data.length / BLOCK_SIZE) + 1;
    for (var block = 1; block <= blocks; block++) {
      const start = (block - 1) * BLOCK_SIZE;
      const end = Math.min(start + BLOCK_SIZE, data.length);
      await client.sendBlock(block, data.slice(start, end));
      await client.waitAck(block);
    }
  }
};

module.exports = createWriter;