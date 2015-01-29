var util = require("util"),
	EventEmitter = require("events").EventEmitter,
	debug = require('debug')('med'),
	net = require('net'),
	datagram = require('datagram'),
	Decoder = require('./decoder').Decoder,
	Encoder = require('./encoder').Encoder;

var MED = function(options) {
	EventEmitter.call(this);

	options = options || {}

	var self = this;
	self.name = options.name || 'anonymous';
	
	var decoder = new Decoder();
	var encoder = new Encoder();
	var specs = options.specs || {};

	if (options.specs) {
		for (var i = 0; i < specs.length; i++) {
			for (var name in specs[i]) {
				if (specs[i][name].type == 'in') {
					decoder.register(specs[i][name]);
				} else if (specs[i][name].type == 'out') {
					encoder.register(specs[i][name]);
				}
			}
		}
	}

	var endpoints = {}, remote = {};

	var addMessageInstance = function(name, klass, type) {
		if (type == 'in') {
			decoder.register(name, specs[klass]);
		} else if (type == 'out') {
			encoder.register(name, specs[klass]);
		}
	}

	var addServerEndpoint = function(name, protocol, host, port) {
		if (protocol == 'tcp') {
			endpoints[name] = { 
				sock: net.createServer(),
				remote: {}
			}

			endpoints[name].sock.listen(port, host);
			debug('[' + self.name '] Server listening on ' 
				+ endpoints[name].sock.address().address + ':' 
				+ endpoints[name].sock.address().port);
			
			endpoints[name].sock.on('connection', function(sock) {
				debug('[' + self.name '] Client connected: ' + sock.remoteAddress +':'+ sock.remotePort);

				for (var rname in endpoints[name].remote) {
					if (sock.remoteAdress == endpoints[name].remote[rname].host) {
						endpoints[name].remote[rname].sock = sock;
					}
				}

    		sock.on('data', function(data) {
    			self.emit('data', decoder.unpack(data));
    		});

    		sock.on('close', function() {
    			debug('[' + self.name '] Client disconnected: ' + sock.remoteAddress +':'+ sock.remotePort);
    			for (var rname in endpoints[name].remote) {
						if (sock == endpoints[name].remote[rname].sock) {
							endpoints[name].remote[rname].sock = undefined;
						}
					}
    		});
			});
		} else if (protocol == 'udp') {

		}
	}

	var registerClient2ServerEndpoint = function(serverName, name, rhost, rport) {
		endpoints[serverName].remote[name] = {
			host: rhost,
			port: rport,
			sock: undefined
		}
		endpoints[name] = endpoints[serverName].remote[name];
	}

	var addClientEndpoint = function(name, type, protocol, host, port) {
		if (protocol == 'tcp') {
			var client = new net.Socket();

			client.connect(port, host, function() {
				debug('[' + self.name '] Connected to server: ' + host + ':' + port);
			});

			client.on('data', function(data) {
    		self.emit('data', decoder.unpack(data));
			});

			client.on('close', function() {
				debug('[' + self.name '] Connection closed at: ' + host + ':' + port);
			});

			endpoints[name] = client;
		} else if (protocol == 'udp') {

		}
	}

	var send = function(name, messageName, data) {
		if (endpoints[name] && endpoints[name].remote && endpoints[name].remote.sock) {
			endpoints[name].remote[name].sock.write(encoder.pack(data));
		} else if (endpoints[name]) {
			endpoints[name].sock.write(encoder.pack(messageName, data));
		}
	}

	var end =  function() {
		for (var name in endpoints) {
			if (endpoints[name].sock) {
				if (endpoints[name].remote) {
					endpoints[name].sock.close();
				} else {
					client.end();
				}
			}
		}
	}
}

util.inherits(Med, EventEmitter);

exports.MED = MED;