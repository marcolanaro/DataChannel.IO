Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io has two purposes:
* Serve signals between clients needed to coordinate the communication.
* In case peer-to-peer communication fails or your browser does not support WebRTC, socket.io serve also the data message.

## Installing
	npm install datachannel.io
## On the Server
	var server = require('http').createServer();
	var dc = require('dataChannel.io').listen(server, options);

	server.listen(8080);
#### Complete Options
If you want to implement sessions management or horizontal scaling you need a redis server.

	var options = {
		nameSpace: [STRING],
		redis: {port: [INTEGER], host: [STRING], options: { pass: [STRING] }},
		session: {
			cookie: {name: [STRING], secret: [STRING]},
			auth: function(session) {
				return true;
			}
		},
		static: [BOOLEAN]
	}

#### Static File
If you do not want to serve the static client file at `/datachannel.io/datachannel.io.js` you need to add the parameter `static: false`.

	var server = require('http').createServer();
	var dc = require('dataChannel.io').listen(server, {
		static: false
	});

	server.listen(8080);

#### Session Support
If you want to add session support you need a Redis server configured. Append the `session` object to the initialization with these parameters:
* `cookie` [mandatory]: object with `name` of the cookie and `secret` key
* `auth` [optional, default as `return true`]: function that return the authorization to use the socket.io server based on the current `session`.

Note: By default, redis-server binds to local only. Edit redis.conf to comment out this option or you will receive an ECONNECTREFUSED error. The line to comment out is:
     bind 127.0.0.1

Redis session store example:


	var server = require('http').createServer();
	var dc = require('dataChannel.io').listen(server, {
		redis: {port: 6380, host: localhost, options: {}},
		session: {
			cookie: {name: "datachannel.io", secret: "thisismysecretkey"},
			auth: function(session) {
				return true;
			}
		}
	});

	server.listen(8080);
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
The parameters of the `new DataChannel(object)` are:
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

- Serve unique client file javascript API
- SSL

Tested on Chrome v25 and Firefox v20.

Some examples at [https://github.com/marcolanaro/DataChannel.IO-Examples](https://github.com/marcolanaro/DataChannel.IO-Examples).


More information at [http://www.datachannel.io](http://www.datachannel.io).

## License

MIT
