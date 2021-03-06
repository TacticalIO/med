var util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fs = require('fs'),
	debug = require('debug')('med:debug'),
	trace = require('debug')('med:trace'),
	net = require('net'),
	dgram = require('dgram'),
	myIP = require('my-ip'),
	Decoder = require('./decoder').Decoder,
	Encoder = require('./encoder').Encoder;

var Med = function(options) {
	EventEmitter.call(this);

	options = options || {}

	var self = this;
	var specs = options.specs || {},
		decoder = new Decoder(),
		encoder = new Encoder();

	var endpoints = {}

	this.messages = {}

	this.setSpecs = function(newSpecs) {
		specs = newSpecs;
	}

	this.addSpecs = function(newSpecs) {
		for (var s in newSpecs) {
			if (specs[s]) debug('WARNING: existing specs for ' + s + ' will be replaced');
			specs[s] = newSpecs[s];
		}
	}

	this.addMessageInstance = function(endpoint, name, klass, type) {
		if (type == 'in') {
			decoder.register(endpoint, name, klass, specs);
		} else if (type == 'out') {
			encoder.register(name, klass, specs);
		}
		debug('Message registered: ' + endpoint + ', ' + name + ', ' + klass + ', ' + type);
	}

	this.addServerEndpoint = function(name, endpoint) {
		if (endpoint.protocol == 'tcp') {
			endpoints[name] = endpoint;
			endpoints[name].sock = net.createServer();
			endpoints[name].remote = endpoints[name].remote  || {};
			endpoints[name].host = endpoints[name].host || myIP();
			debug('add TCP server endpoint', name, endpoints[name]);

			if (endpoints[name].remote) {
				for (var r in endpoints[name].remote) {
					this.addClientEndpoint(r, endpoints[name].remote[r]);

					for (var m in endpoints[name].remote[r].messages) {
						this.addMessageInstance(r, m, 
							endpoints[name].remote[r].messages[m].klass, 
							endpoints[name].remote[r].messages[m].type);
					}
				}
			}

			endpoints[name].sock.listen(endpoints[name].port, 
				endpoints[name].host, function() {
				debug('Server listening on ' 
					+ endpoints[name].sock.address().address + ':' 
					+ endpoints[name].sock.address().port);				
			});
			
			endpoints[name].sock.on('connection', function(sock) {
				debug('Client connected: ' + sock.remoteAddress +':'+ sock.remotePort);

				for (var rname in endpoints[name].remote) {
					if (sock.remoteAdress == endpoints[name].remote[rname].host) {
						endpoints[name].remote[rname].sock = sock;
					}
				}

    		sock.on('data', function(data) {
    			self.emit('data', decoder.unpack(name, data));
    		});

    		sock.on('close', function() {
    			debug('Server closed');
    		});
			});
		} else if (endpoint.protocol == 'udp') {
			endpoints[name] = endpoint;
			endpoints[name].sock = dgram.createSocket('udp4');
			debug('Server UDP socket created for ' + name);

			if (endpoint.type == 'server') {
				endpoints[name].sock.bind(endpoint.port, endpoint.host, function() {
					debug('UDP server listening on ' 
						+ endpoints[name].sock.address().address + ':' 
						+ endpoints[name].sock.address().port);				
				});

	    	endpoints[name].sock.on('message', function (data, rinfo) { 
	    		self.emit('data', decoder.unpack(name, data));
	    	});
			}
		}
	}

	this.addClientEndpoint = function(name, endpoint) {
		debug('add client endpoint', name, endpoint);
		endpoints[name] = endpoint;
		endpoints[name].host = endpoints[name].host || myIP();
		if (endpoints[name].protocol == 'tcp') {
			var client = new net.Socket();

			client.connect(endpoints[name].port, endpoints[name].host, function() {
				debug('Connected to server: ' + endpoints[name].host 
					+ ':' + endpoints[name].port);
			});

			client.on('error', function() {
    		debug('Connecton refused');
			});

			client.on('data', function(data) {
    		self.emit('data', decoder.unpack(name, data));
			});

			client.on('close', function() {
				debug('Connection closed at: ' + endpoints[name].host 
					+ ':' + endpoints[name].port);
			});

			endpoints[name].sock = client;
		} else if (endpoint.protocol == 'udp') {
			endpoints[name].sock = dgram.createSocket('udp4');
			debug('Client UDP socket created for ' + name);
		}
	}

	this.send = function(name, messageName, data) {
		trace('send', name, messageName);
		if (endpoints[name].protocol == 'tcp') {
			if (endpoints[name] && endpoints[name].remote && endpoints[name].remote.sock) {
				endpoints[name].remote[name].sock.write(encoder.pack(messageName, data).buffer);
			} else if (endpoints[name] && endpoints[name].sock) {
				endpoints[name].sock.write(encoder.pack(messageName, data).buffer);
			} else {
				debug('WARNING: message ' + messageName + ' not send through endpoint ' + name);
			}
		} else {
			var buf = encoder.pack(messageName, data).buffer;
			endpoints[name].sock.send(buf, 0, buf.length, 
				endpoints[name].port, endpoints[name].host);
		}
	}

	this.end =  function() {
		for (var name in endpoints) {
			if (endpoints[name].sock) {
				if (endpoints[name].remote) {
					endpoints[name].sock.close();
				} else {
					endpoints[name].sock.end();
					endpoints[name].sock.destroy()
				}
			}
		}
		debug('Med end');
	}
		
	for (var e in options.endpoints) {
		if (options.endpoints[e].type == 'server') {
			this.addServerEndpoint(e, options.endpoints[e]);
		} else {
			this.addClientEndpoint(e, options.endpoints[e]);
		}
		for (var m in options.endpoints[e].messages) {
			this.addMessageInstance(e, m, 
				options.endpoints[e].messages[m].klass, 
				options.endpoints[e].messages[m].type);
		}
	}

	debug('Med instance created');
}

util.inherits(Med, EventEmitter);

exports.Med = Med;