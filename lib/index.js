var parse = require('url').parse
  , send = require('send');

var Server = function(srv, options) {
	if (!(this instanceof Server)) return new Server(srv, options);
	if (!options) options = {};
	
	if (options.static !== false)
		this.serve(srv, "/datachannel.io");

	return new exports.Manager(srv, options);
};

Server.prototype.serve = function(srv, path) {
	var url = path + '/datachannel.io.js';
	var evs = srv.listeners('request').slice(0);
	srv.removeAllListeners('request');
	srv.on('request', function(req, res) {
		if (0 == req.url.indexOf(url)) {
			var path = parse(req.url).pathname.split('/').slice(-1)[0].replace('.js','_DEP.js');
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

exports.Manager = require('./manager');
