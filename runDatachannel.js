var server = require('http').createServer();
var connect = require('connect');
var RedisStore = require("connect-redis")(connect);
var redis = require("redis");

var dc = require('datachannel.io').listen(server, {
        redis: {port: 6379, host: "localhost", options: { }},
});

dc.addNameSpace("dataChannel", {});

server.listen(8080, "0.0.0.0");
