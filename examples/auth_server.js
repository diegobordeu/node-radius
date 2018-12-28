const radius = require('../lib/radius');
const dgram = require('dgram');

radius.add_dictionary('./examples/mikrotik.rfc2865');

const db = ['9C:4F:DA:11:56:34', '38:80:DF:13:4C:2E', '80:AD:16:E4:DA:DD', 'B8:5A:73:8A:CE:28'];


const secret = process.env.RADIUS_SECRET;
const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
  const packet = await readPacket(msg, secret);
  const username = packet.attributes['User-Name'];
  // console.log(packet, 'dsadsa');

  if (packet.code === 'Access-Request') {
    checkAuth(username, packet, rinfo);
    console.log(`${packet.code  } of user ${  username}`);
  }
  if (packet.code === 'Accounting-Request') {
    console.log(packet);
    console.log(packet.code + 'Acct-Status-Type:' + ' : ' + packet.attributes['Acct-Status-Type'] + 'user: ' + username);
    sendResponde(packet, rinfo);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`radius server listening ${
    address.address}:${address.port}`);
});

server.bind(1812);

function readPacket(msg, secret) {
  return new Promise((resolve, reject) => {
    try {
      return resolve(radius.decode({
        packet: msg,
        secret,
      }));
    } catch (e) {
      reject(`Failed to decode radius packet, silently dropping:${e}`);
    }
  });
}

function checkAuth(username, packet, rinfo) {
  // if (db.includes(username)) {
  if (true) {
    sendAuth(true, username, packet, rinfo);
  } else {
    sendAuth(false, username, packet, rinfo);
  }
}


function sendAuth(auth, username, packet, rinfo) {
  // console.log(buildResponse(auth, packet), 'responseeeeeeeeeeeeee');
  const response = radius.encode_response(buildResponse(auth, packet));
  // console.log(response.code);

  // console.log(`Sending ${response.code} for user ${username}`);
  server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.log('Error sending response to ', rinfo);
    }
  });
}

function buildResponse(auth, packet) {
  return auth ? { packet, code: 'Access-Accept', secret } : { packet, code: 'Access-Reject', secret };
}

function sendResponde(packet, rinfo) {
  const response = radius.encode_response({ packet, code: 'Accounting-Response', secret });
  server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.log('Error sending response to ', rinfo);
    }
  });
}
