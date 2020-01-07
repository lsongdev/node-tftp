const { Readable } = require('stream');

class PutStream extends Readable {
  constructor(client) {
    super();
    client.read(chunk => this.push(chunk));
  }
  _read() {

  }
}

module.exports = PutStream;