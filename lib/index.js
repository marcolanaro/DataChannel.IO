var io
  , clients = []
  , parse = require('url').parse
  , send = require('send');

var Server = function(srv, nameSpace) {
	if (!(this instanceof Server)) return new Server(srv, nameSpace);
	this._nameSpace = nameSpace || 'dataChannel';
	this._path = '/datachannel.io'; 
	this.serve(srv);
	this.socketIO(srv);
}

Server.prototype.socketIO = function(srv) {
	io = require('socket.io').listen(srv);
	var namespace = io.of('/' + this._nameSpace);

	namespace.on('connection', function (socket) {
		var id = socket.id;
		clients[id] = socket;

		var myRoom = [];

		socket.emit('connected', { user_id: id }); // aggiungere function come ack per il join

		socket.on('offer', function (data) {
			if (clients[data.user_id])
				clients[data.user_id].emit('offer', { description: data.description, user_id: id });
		});
		socket.on('answer', function (data) {
			if (clients[data.user_id])
				clients[data.user_id].emit('answer', { description: data.description, user_id: id });
		});
		socket.on('addIceCandidate', function (data) {
			if (clients[data.user_id])
				clients[data.user_id].emit('addIceCandidate', { candidate: data.candidate, user_id: id });
		});
		socket.on('join', function (data) {
			// se c'è già non la devo aggiungere
			if (myRoom.indexOf(data.room) === -1)
				myRoom.push(data.room);
			socket.join(data.room);
			namespace.in(data.room).emit('userJoined', { room: data.room, user_id: id});
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
	});
}

Server.prototype.serve = function(srv) {
	var url = this._path + '/datachannel.io.js';
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