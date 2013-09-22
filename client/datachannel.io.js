var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

var DataChannel = (function(window){

	var User_Id
	  , socket
	  , options
	  , channels = []
	  , onCallbacks = []
	  , rooms = [];

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

	var _onMessage = function(message) {
		for (var i = 0, l = onCallbacks[message.room][message.event].length; i < l; i += 1) {
			onCallbacks[message.room][message.event][i](message.data);
		}
	}

	var _channel = {
		onmessage: function(event) {
			_onMessage(JSON.parse(event.data));
		},
		onopen: function(event) {
			var readyState = this.readyState;
		},
		onclose: function(event) {
			var readyState = this.readyState;
		}
	};

	function _newChannel(id) {
		try {
			var pc = new RTCPeerConnection(options.rtcServers, {optional: [{DtlsSrtpKeyAgreement: true}, {RtpDataChannels: true}]});
			pc.onicecandidate = function(event) {
				if (event.candidate) {
					socket.emit('addIceCandidate', { candidate: event.candidate, user_id: id });
				}
			};
			return {pc: pc};
		} catch(e) {
			return false;
		}
	}

	function _setDescription(description, id, type) {
		channels[id].pc.setLocalDescription(description);
		socket.emit(type, { description: description, user_id: id });
	}

	function _create(type, id) {
		switch (type) { 
			case 'answer': {
				channels[id].pc.createAnswer(function(description) {
					_setDescription(description, id, type);
				}, function(err) { alert("Error " + err); });
			}
			break;
			case 'offer': {
				channels[id].pc.createOffer(function(description) {
					_setDescription(description, id, type);
				}, function(err) { alert("Error " + err); });
			}
			break;
		}
	}

	function _noWebRTC(id) {
		channels = false;
	}

	function receiveOffer(data) {
		var id = data.user_id;
		try {
			channels[id] = _newChannel(id);
			channels[id].pc.ondatachannel = function(event) {
				Extend(event.channel, _channel);
				channels[id].dc = event.channel;
			};
			channels[id].pc.setRemoteDescription(new RTCSessionDescription(data.description));
			_create('answer', id);
		} catch (e) {_noWebRTC(id)}
	}

	function createConnection(id) {
		try {
			channels[id] = _newChannel(id);
			channels[id].dc = channels[id].pc.createDataChannel("sendDataChannel");
			Extend(channels[id].dc, _channel);
			_create('offer', id);
		} catch (e) {_noWebRTC(id)}
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
			try {
				channels[data.user_id].pc.setRemoteDescription(new RTCSessionDescription(data.description));
			} catch (e) {_noWebRTC(data.user_id)}
		});

		socket.on('addIceCandidate', function(data) {
			try {
				channels[data.user_id].pc.addIceCandidate(new RTCIceCandidate(data.candidate));
			} catch (e) {_noWebRTC(data.user_id)}
		});

		socket.on('rely', function(data) {
			_onMessage(JSON.parse(data.message));
		});

		socket.on('userJoined', function(data) {
			if (!rooms[data.room])
				rooms[data.room] = [];
			if (rooms[data.room].indexOf(data.user_id) === -1)
				rooms[data.room].push(data.user_id);
			if (!channels[data.user_id])
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
				try {
					channels[data.user_id].dc.close();
					channels[data.user_id].pc.close();
				} catch (e) {}
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
			rtcServers: o.rtcServers || {
				iceServers: [
					{url: "stun:23.21.150.121"},
					{url: "stun:stun.l.google.com:19302"}
				]
			},
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
			if (!rooms[room]) rooms[room] = [];
			return  {
				emit:  function(event, data) {
					var message = JSON.stringify({
						event: event,
						room: room,
						data: data
					});
					if (!channels) {
						socket.emit('rely', { message: message , room: room});
					} else {
						for (var i = 0, l = rooms[room].length; i < l; i += 1) {
							var id = rooms[room][i];
							try {
								channels[id].dc.send(message);
							} catch (e) {
								socket.emit('rely', { message: message, to: id });
							}
						}
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