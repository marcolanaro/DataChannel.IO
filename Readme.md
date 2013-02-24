# DataChannel.IO

Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io is only used to serve signals between clients. You can choose the namespace where socket.io serve his signals.

## Installing
	npm install datachannel.io
## On the Server
#### Using with Node HTTP server
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
#### Using with the Express 3 web framework
	var app = require('express')()
	  , server = require('http').createServer(app)
	  , dc = require('datachannel.io').listen(server, 'dataChannel');

	app.use(express.static(__dirname + '/client'));

	server.listen(80);
## On the Client
#### index.html
	<!DOCTYPE html>
	<html>
		<head></head>
		<body>
			<script src="/socket.io/socket.io.js"></script>
			<script src="/datachannel.io/datachannel.io.js"></script>
			<script>
				var datachannel = new DataChannel({
					socketServer: 'http://<yourIP>'
				});
			</script>
		</body>
	</html>
#### Initialization
The parameters passed to the `new DataChannel(object)` initialization is composed by:
* `socketServer` [mandatory]: the address of the socket server used to serve signals between clients
* `nameSpace` [optional, default as `'dataChannel'`]: namespace of the socket.io server
* `rtcServers` [optional, default as `null`]: RTC Servers

#### Join a Room
	datachannel.join("room");
#### Leave a Room
	datachannel.leave("room");
#### Send a Message
	datachannel.in("room").emit("chat", {text: 'Hi!'});
#### Get a Message
	datachannel.in("room").on("chat", function(data) {
		console.log(data);
	});
### ToDo

- Test on Firefox
- Implement e relay layer: in case peer-to-peer communication fails, socket.io serve the data message

### Examples
Some examples at:

[https://github.com/marcolanaro/DataChannel.IO-Examples](https://github.com/marcolanaro/DataChannel.IO-Examples)


Tested on Chrome Canary