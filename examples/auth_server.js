const radius = require('../lib/radius');

radius.add_dictionary('./examples/mikrotik.rfc2865');
var dgram = require("dgram");

var secret = 'herma123';
var server = dgram.createSocket("udp4");

server.on("message", async (msg, rinfo) => {
  var code, username, password, packet;
  packet = await readPacket(msg, secret);
  console.log(packet, 'dsadsa');

  if (packet.code == 'Accounting-Request') {

    // console.log('------------------------' + packet.code + '----------------------');
    code = 'Accounting-Response';
    var response = radius.encode_response({
      packet: packet,
      code: code,
      secret: secret
    });
    // console.log('Sending ' + code + ' for user ');
    server.send(response, 0, response.length, rinfo.port, rinfo.address, function(err, bytes) {
      if (err) {
        console.log('Error sending response to ', rinfo);
      }
    });
    return;
  }
  if(packet.code == 'Access-Request') {
    console.log('------------------------' + packet.code + '----------------------');
    code = 'Access-Accept';
    var response = radius.encode_response({
      packet: packet,
      code: code,
      secret: secret
    });


    username = packet.attributes['User-Name'];

    if(username !== '9C:4F:DA:11:56:34') {
    // if(username !== '38:80:DF:13:4C:2E') {
      code = 'Access-Reject';
      response = radius.encode_response({
        packet: packet,
        code: code,
        secret: secret
      });
    }

    console.log('Sending ' + code + ' for user ' + username);
    server.send(response, 0, response.length, rinfo.port, rinfo.address, function(err, bytes) {
      if (err) {
        console.log('Error sending response to ', rinfo);
      }
    });
    return;
  }
  // console.log('------------------------' + packet.code + '----------------------');
  // console.log('cagueeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

});

server.on("listening", function () {
  var address = server.address();
  console.log("radius server listening " +
      address.address + ":" + address.port);
});

server.bind(1812);

function readPacket(msg, secret) {
  return new Promise((resolve, reject) => {
    try {
      return resolve(radius.decode({packet: msg, secret: secret}));
    } catch (e) {
      reject("Failed to decode radius packet, silently dropping:" + e);
    }
  });
}
