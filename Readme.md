Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io is only used to serve signals between clients. You can choose the namespace where socket.io serve his signals.
In case peer-to-peer communication fails or your browser does not support WebRTC, socket.io serve also the data message.

## Installing
	npm install datachannel.io
## On the Server
#### Using with Node HTTP server
	var server = require('http').createServer();
	var dc = require('dataChannel.io').listen(server);

	server.listen(8080);
#### Without serving static files
If you do not want to serve the static client file at `/datachannel.io/datachannel.io.js` you need to add the parameter `static: false`.

	var server = require('http').createServer();
	var dc = require('dataChannel.io').listen(server, {
		static: false
	});

	server.listen(8080);
#### Session support
If you want to add session support you need to append the `session` object to the initialization with these parameters:
* `cookie` [mandatory]: object with `name` of the cookie and `secret` key
* `store` [mandatory]: the sessionStore object
* `auth` [optional, default as `return true`]: function that return the authorization to use the socket.io server based on the current `session`.

Redis session store example:


	var server = require('http').createServer()
	  , connect = require('connect')
	  , RedisStore = require("connect-redis")(connect)
	  , redis = require("redis");

	var dc = require('dataChannel.io').listen(server, {
		session: {
			cookie: {name: "datachannel.io", secret: "thisismysecretkey"},
			store: new RedisStore({
				host: "localhost",
				port: 6379,
				client: redis.createClient()
			}),
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

- Scaling with Redis Pub/Sub
- SSL

Tested on Chrome v25 and Firefox v20.