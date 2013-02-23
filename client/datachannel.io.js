var DataChannel = (function(window){

	var User_Id;
	var channels = [];
	var socket;
	var options;
	var onCallbacks = [];
	var rooms = [];


	var Extend = function(destination, source){
		for(var property in source)
			if (source.hasOwnProperty(property)) {
				if (typeof source[property]==="object") {
					destination[property] = destination[property] || ((Object.prototype.toString.call(source[property])==="[object Array]") ? [] : {});
					Extend(destination[property],source[property]);
				} else
					destination[property] = source[property];
			}
		return destination;
	};

	var _channel = {
		onmessage: function(event) {
			var message = JSON.parse(event.data);
			for (var i = 0, l = onCallbacks[message.room][message.event].length; i < l; i += 1) {
				onCallbacks[message.room][message.event][i](message.data);
			}
		},
		onopen: function(event) {
			var readyState = this.readyState;
		},
		onclose: function(event) {
			var readyState = this.readyState;
		}
	};

	function newChannel() {
		return {
			pc: new RTCPeerConnection(options.rtcServers, {optional: [{RtpDataChannels: true}]})
		};
	}

	function setDescription(type, description, id) {
		channels[id].pc.setLocalDescription(description);
		socket.emit(type, { description: description, user_id: id });
	}

	function onIceCandidate(event, id) {
		if (event.candidate) {
			socket.emit('addIceCandidate', { candidate: event.candidate, user_id: id });
		}
	}

	function receiveOffer(data) {
		var id = data.user_id;

		// Create Peer Connection
		channels[id] = newChannel();

		// Remote ICE candidate
		channels[id].pc.onicecandidate = function(event) {
			onIceCandidate(event, id);
		};

		// Receive Channel Callback
		channels[id].pc.ondatachannel = function(event) {
			Extend(event.channel, _channel);
			channels[id].dc = event.channel;
		};

		channels[id].pc.setRemoteDescription(new RTCSessionDescription(data.description));

		channels[id].pc.createAnswer(function(description) {
			setDescription('answer', description, id);
		});
	}

	function createConnection(id) {
		// Create Peer Connection
		channels[id] = newChannel();

		try {
			// Reliable Data Channels not yet supported in Chrome
			// Data Channel api supported from Chrome M25.
			// You need to start chrome with  --enable-data-channels flag.
			channels[id].dc = channels[id].pc.createDataChannel("sendDataChannel", {reliable: false});
		} catch (e) {
		}

		channels[id].pc.onicecandidate = function(event) {
			onIceCandidate(event, id);
		};

		Extend(channels[id].dc, _channel);

		channels[id].pc.createOffer(function(description) {
			setDescription('offer', description, id);
		});
	}

	var socketInit = function(socketServer, nameSpace) {
		socket = io.connect(socketServer + "/" + nameSpace);
		socket.on('connected', function(data) {
			User_Id = data.user_id;
		});

		socket.on('offer', function(data) {
			receiveOffer(data);
		});

		socket.on('answer', function(data) {
			channels[data.user_id].pc.setRemoteDescription(new RTCSessionDescription(data.description));
		});

		socket.on('addIceCandidate', function(data) {
			channels[data.user_id].pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		});

		socket.on('userJoined', function(data) {
			if (!rooms[data.room])
				rooms[data.room] = [];
			if (rooms[data.room].indexOf(data.user_id) === -1)
				rooms[data.room].push(data.user_id);
			if (channels[data.user_id]) {

			} else
				createConnection(data.user_id);
		});

		socket.on('userLeaved', function(data) {
			var idx = rooms[data.room].indexOf(data.user_id);
			if (idx != -1) rooms[data.room].splice(idx, 1);
			// if unused client, close RTC connection
			var found = false;
			for (var i = 0, l = rooms.length; i < l; i += 1) {
				if (rooms[i].indexOf(data.user_id) !== -1)
					found = true;	
			}
			if (!found) {
				channels[data.user_id].pc.close();
				delete channels[data.user_id];
			}
		});

		socket.on('usersInRoom', function(data) {
			rooms[data.room] = data.users;
		});
	}

	var C = function(o){
		options = {
			socketServer: o.socketServer || null,
			rtcServers: o.rtcServers || null,
			nameSpace: o.nameSpace || 'dataChannel'
		};
		socketInit(options.socketServer, options.nameSpace);
	};

	C.prototype = {
		join: function(room) {
			socket.emit('join', { room: room });
		},
		leave: function(room) {
			socket.emit('leave', { room: room });
		},
		in: function(room) {
			if (!rooms[room])
				rooms[room] = [];
			return  {
				emit:  function(event, data) {
					var message = JSON.stringify({
						event: event,
						room: room,
						data: data
					});
					for (var i = 0, l = rooms[room].length; i < l; i += 1) {
						var id = rooms[room][i];
						if (channels[id])
							channels[id].dc.send(message);
					}
				},
				on: function(event, callback) {
					if (!onCallbacks[room])
						onCallbacks[room] = [];
					if (!onCallbacks[room][event])
						onCallbacks[room][event] = [];
					onCallbacks[room][event].push(callback);
				}
			}
		}
	};


	return C;

}(window));