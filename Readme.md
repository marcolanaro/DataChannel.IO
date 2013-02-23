# DataChannel.IO

Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io is only used to serve signals between clients. You can choose the namespace where socket.io serve his signals.

## Installing
	npm install datachannel.io
## Using with Node HTTP server
#### On the Server
	var app = require('http').createServer(handler)
	  , io = require('datachannel.io').listen(app, 'dataChannel');

	app.listen(80);
	
	function handler (req, res) {
	  fs.readFile(__dirname + '/index.html',
	  function (err, data) {
	    if (err) {
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }
	    res.writeHead(200);
	    res.end(data);
	  });
	}
#### On the Client
	var datachannel = new DataChannel({
		socketServer: 'http://<yourIP>',
		rtcServers: null,
		nameSpace: 'dataChannel'
	});
## Using with the Express 3 web framework
#### On the Server
	var app = require('express')()
	  , server = require('http').createServer(app)
	  , dc = require('datachannel.io').listen(server, 'dataChannel');

	app.listen(80);
	
	function handler (req, res) {
	  fs.readFile(__dirname + '/index.html',
	  function (err, data) {
	    if (err) {
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }
	    res.writeHead(200);
	    res.end(data);
	  });
	}
#### On the Client
	var datachannel = new DataChannel({
		socketServer: 'http://<yourIP>',
		rtcServers: null,
		nameSpace: 'dataChannel'
	});
## Join a Room (from the client)
	datachannel.join("room");
## Leave a Room (from the client)
	datachannel.leave("room");
## Send a Message
	datachannel.in("room").emit("chat", {text: 'Hi!'});

### ToDo

- Test on Firefox
- Implement e relay layer: in case peer-to-peer communication fails, socket.io serve the data message

### Examples
Some examples at:

[https://github.com/marcolanaro/DataChannel.IO-Examples](https://github.com/marcolanaro/DataChannel.IO-Examples)


Tested on Chrome Canary