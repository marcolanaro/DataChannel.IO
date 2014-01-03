/**
 * Module dependencies.
 */

var EventEmitter = process.EventEmitter
  , cookie = require('cookie')
  , connect = require('connect');

var clients = [];

/**
 * Export the constructor.
 */

exports = module.exports = NameSpace;

/**
 * Manager constructor.
 */

function NameSpace(manager, nameSpace, options) {
	var sessionOpt = options.session;

	if (sessionOpt) {
		var cookieOpt = sessionOpt.cookie;
		var auth = sessionOpt.auth;

		if (typeof cookieOpt === "object") {
			manager.io.set('authorization', function(data, accept) {
				if (data.headers.cookie) {
					var sessionCookie = cookie.parse(data.headers.cookie);
					var sessionID = connect.utils.parseSignedCookie(sessionCookie[cookieOpt.name], cookieOpt.secret);
					manager.sessionStore.get(sessionID, function(err, session) {
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

	var io_namespace = manager.io.of('/' + nameSpace);


	io_namespace.on('connection', function (socket) {
		var session = socket.handshake.session;

		if (!sessionOpt || auth(session)) {
			var id = socket.id;
			clients[id] = socket;

			var myRoom = [];

			// not elegant, can be better
			var emit2client = function(io_namespace, ids, event, message, room) {
				if (room)
					var clients = io_namespace.clients(room);
				else
					var clients = io_namespace.clients();
				clients.forEach(function(s) {
					if (ids.indexOf(s.id) > -1)
						s.emit(event, message);
				});
			}

			socket.emit('connected', { user_id: id });

			socket.on('offer', function (data) {
				emit2client(io_namespace, [data.user_id], 'offer', { description: data.description, user_id: id });
			});
			socket.on('answer', function (data) {
				emit2client(io_namespace, [data.user_id], 'answer', { description: data.description, user_id: id });
			});
			socket.on('addIceCandidate', function (data) {
				emit2client(io_namespace, [data.user_id], 'addIceCandidate', { candidate: data.candidate, user_id: id });
			});
			socket.on('rely', function (data) {
				if (data.to)
					emit2client(io_namespace, data.to, 'rely', { message: data.message }, data.message.room);
				else
					io_namespace.in(data.message.room).emit('rely', { message: data.message });
			});
			socket.on('join', function (data) {
				if (myRoom.indexOf(data.room) === -1)
					myRoom.push(data.room);
				socket.join(data.room);
				io_namespace.in(data.room).emit('userJoined', { room: data.room, user_id: id});
				var arr = io_namespace.clients(data.room);
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
				io_namespace.in(data.room).emit('userLeaved', { room: data.room, user_id: id});
			});

			socket.on('disconnect', function () {
				delete clients[id];
				for(var i = 0, l = myRoom.length; i < l; i += 1)
					io_namespace.in(myRoom[i]).emit('userLeaved', { room: myRoom[i], user_id: id });
			});
		}
	});
}

/**
 * Inherits from EventEmitter.
 */

NameSpace.prototype.__proto__ = EventEmitter.prototype;

/**
 * Methods.
 */
