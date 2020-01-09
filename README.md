## tftp2

> simple tftp server and client in node.js

![tftp@1.0.0](https://img.shields.io/npm/v/tftp2.svg)
[![Build Status](https://travis-ci.org/song940/node-tftp.svg?branch=master)](https://travis-ci.org/song940/node-tftp)

### Installation

```bash
$ npm i tftp2
```

### Example

```js
const tftp = require('tftp2');

const { read, write } = tftp('127.0.0.1', 6969);

read('remote.txt').pipe(fs.createWriteStream('/tmp/demo.txt'));

```

```js
const fs = require('fs');
const tftp = require('tftp2');

const server = tftp.createServer();

server.on('get', async (req, send) => {
  const { filename, mode, address, port } = req;
  console.log('get', filename, mode, address, port);
  await send(fs.readFileSync(filename));
});

server.on('put', async (req, read) => {
  const { filename, mode, address, port } = req;
  console.log('put', filename, mode, address, port);
  const buffer = [];
  read(chunk => buffer.push(chunk), () => {
    fs.writeFileSync(filename, Buffer.concat(buffer));
  });
});

```

### Contributing
- Fork this Repo first
- Clone your Repo
- Install dependencies by `$ npm install`
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Publish your local branch, Open a pull request
- Enjoy hacking <3

### MIT

Copyright (c) 2016 Lsong &lt;song940@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


---