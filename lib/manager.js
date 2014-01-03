/**
 * Module dependencies.
 */

var EventEmitter = process.EventEmitter
  , redis  = require('socket.io/node_modules/redis')
  , sioRedisStore = require('socket.io/lib/stores/redis')
  , connect = require('connect')
  , RedisStore = require("connect-redis")(connect);

/**
 * Export the constructor.
 */

exports = module.exports = Manager;

/**
 * Manager constructor.
 */

function Manager(srv, options) {
	this.namespaces = {};

	this.srv = srv;
	this.redis = options.redis;

	var sessionStoreObj = {
		host: this.redis.host,
		port: this.redis.port
	};
	if (this.redis.options.pass)
		sessionStoreObj.pass = this.redis.options.pass;
	this.sessionStore = new RedisStore(sessionStoreObj);

	this.io = require('socket.io').listen(srv);

	if (this.redis) {
		this.pub = redis.createClient(this.redis.port, this.redis.host)
		this.sub = redis.createClient(this.redis.port, this.redis.host)
		this.client = redis.createClient(this.redis.port, this.redis.host);

		if (!this.redis.options || !this.redis.options.pass || typeof this.redis.options.pass !== "string")
			this.redis.options = { pass: false };
		var pass = this.redis.options.pass;
		if (pass) {
			this.pub.auth(pass, function (err) { if (err) throw err; });
			this.sub.auth(pass, function (err) { if (err) throw err; });
			this.client.auth(pass, function (err) { if (err) throw err; });
		}

		this.io.set('store', new sioRedisStore({
			redis    : redis ,
			redisPub : this.pub ,
			redisSub : this.sub ,
			redisClient : this.client ,
		}));
	}
};

/**
 * Inherits from EventEmitter.
 */

Manager.prototype.__proto__ = EventEmitter.prototype;

/**
 * Methods.
 */

Manager.prototype.addNameSpace = function (nameSpace, options) {
	if (this.namespaces[nameSpace]) {
		return this.namespaces[nameSpace];
	}
	return this.namespaces[nameSpace] = new require('./namespace')(this, nameSpace, options);
}

Manager.prototype.removeNameSpace = function (nameSpace) {
	delete this.namespaces[nameSpace];
	return true;
}