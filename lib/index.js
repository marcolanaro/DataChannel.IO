var io
  , clients = []
  , parse = require('url').parse
  , send = require('send')
  , cookie = require('cookie')
  , connect = require('connect')
  , RedisStore = require("connect-redis")(connect);


var sioRedisStore = require('socket.io/lib/stores/redis')
  , redis  = require('socket.io/node_modules/redis')
  , pub , sub , client;

// Redi Authentication
// pub.auth(password, function (err) { if (err) throw err; });
// sub.auth(password, function (err) { if (err) throw err; });
// client.auth(password, function (err) { if (err) throw err; });



var Server = function(srv, options) {
	if (!(this instanceof Server)) return new Server(srv, options);
	if (!options) options = {};
	this._nameSpace = options.nameSpace || 'dataChannel';
	
	if (options.static !== false)
		this.serve(srv, "/datachannel.io");

	pub = redis.createClient(options.redis.port, options.redis.host)
	sub = redis.createClient(options.redis.port, options.redis.host)
	client = redis.createClient(options.redis.port, options.redis.host);

	this.socketIO(srv, options.session, options.redis);
}

Server.prototype.socketIO = function(srv, sessionOpt, redisOpt) {
	io = require('socket.io').listen(srv);

	io.set('store', new sioRedisStore({
		redis    : redis ,
		redisPub : pub ,
		redisSub : sub ,
		redisClient : client ,
	}));

	if (sessionOpt) {
		var cookieOpt = sessionOpt.cookie;
		var auth = sessionOpt.auth;
		var sessionStore = new RedisStore({
			host: redisOpt.host,
			port: redisOpt.port
		});


		if (typeof cookieOpt === "object") {
			io.set('authorization', function(data, accept) {
				if (data.headers.cookie) {
					var sessionCookie = cookie.parse(data.headers.cookie);
					var sessionID = connect.utils.parseSignedCookie(sessionCookie[cookieOpt.name], cookieOpt.secret);
					sessionStore.get(sessionID, function(err, session) {
						if (err || !session) {
							accept('Error', false);
						} else {
							data.session = session;
							data.sessionID = sessionID;
							accept(null, true);
						}
					});
				} else {
					accept('No cookie', false);
				}
			});
		}
	}

	var name_space = this._nameSpace;
	var namespace = io.of('/' + name_space);

	namespace.on('connection', function (socket) {
		var session = socket.handshake.session;

		if (!sessionOpt || auth(session)) {
			var id = socket.id;
			clients[id] = socket;

			var myRoom = [];

			var emit2client = function(namespace, ids, event, message, room) { ///DEVO MIGLIORARLO!!!!
				if (room)
					var clients = namespace.clients(room);
				else
					var clients = namespace.clients();
				clients.forEach(function(s) {
					if (ids.indexOf(s.id) > -1)
						s.emit(event, message);
				});
			}

			socket.emit('connected', { user_id: id });

			socket.on('offer', function (data) {
				emit2client(namespace, [data.user_id], 'offer', { description: data.description, user_id: id });
				//if (clients[data.user_id])
				//	clients[data.user_id].emit('offer', { description: data.description, user_id: id });
			});
			socket.on('answer', function (data) {
				emit2client(namespace, [data.user_id], 'answer', { description: data.description, user_id: id });
				//if (clients[data.user_id])
				//	clients[data.user_id].emit('answer', { description: data.description, user_id: id });
			});
			socket.on('addIceCandidate', function (data) {
				emit2client(namespace, [data.user_id], 'addIceCandidate', { candidate: data.candidate, user_id: id });
				//if (clients[data.user_id])
				//	clients[data.user_id].emit('addIceCandidate', { candidate: data.candidate, user_id: id });
			});
			socket.on('rely', function (data) {
				if (data.to)
					emit2client(namespace, data.to, 'rely', data.message, data.message.room);
				else
					namespace.in(data.message.room).emit('rely', { message: data.message });
			});
			socket.on('join', function (data) {
				// se c'è già non la devo aggiungere
				if (myRoom.indexOf(data.room) === -1)
					myRoom.push(data.room);
				socket.join(data.room);
				socket.broadcast.to(data.room).emit('userJoined', { room: data.room, user_id: id});  //verificare che non faccia il broadcast anche ad altri namespace
				var arr = namespace.clients(data.room);
				var newArr = [];
				for (var i = 0, l = arr.length; i < l; i += 1)
					if (socket.id !== arr[i].id)
						newArr.push(arr[i].id);
				socket.emit('usersInRoom', { room: data.room, users: newArr });
			});
			socket.on('leave', function (data) {
				var idx = myRoom.indexOf(data.room);
				if (idx != -1) myRoom.splice(idx, 1);
				socket.leave(data.room);
				namespace.in(data.room).emit('userLeaved', { room: data.room, user_id: id});
			});

			socket.on('disconnect', function () {
				delete clients[id];
				for(var i = 0, l = myRoom.length; i < l; i += 1)
					namespace.in(myRoom[i]).emit('userLeaved', { room: myRoom[i], user_id: id });
			});
		}
	});
}

Server.prototype.serve = function(srv, path) {
	var url = path + '/datachannel.io.js';
	var evs = srv.listeners('request').slice(0);
	srv.removeAllListeners('request');
	srv.on('request', function(req, res) {
		if (0 == req.url.indexOf(url)) {
			var path = parse(req.url).pathname.split('/').slice(-1);
			send(req, path)
				.root(__dirname + '/../client')
				.index(false)
				.pipe(res);
			} else {
			for (var i = 0; i < evs.length; i++) {
				evs[i].call(srv, req, res);
			}
		}
	});
};

exports.listen = Server;