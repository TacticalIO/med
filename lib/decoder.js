var  ByteBuffer = require('bytebuffer'),
	debug = require('debug')('decoder'),
	Translator = require('./translator').Translator;

var Decoder = function() {
	this.endpoints = {}
}

Decoder.prototype.unpack = function(endpoint, buf) {
	var bBuf = ByteBuffer.wrap(buf, 'binary');
	for (var m in this.endpoints[endpoint]) {
		try {
			return { name: m, value: this.endpoints[endpoint][m].unpack(bBuf) };
		} catch(e) {
			debug(e)
		}
	}
}

Decoder.prototype.register = function(endpoint, name, kclass, specs) {
	if (this.endpoints[endpoint] && this.endpoints[endpoint][name]) {
		debug('WARNING: existing definition will be replaced for ' + name);
	}
	this.endpoints[endpoint] = this.endpoints[endpoint] || {}
	this.endpoints[endpoint][name] = new Translator(kclass, specs);
}

Decoder.prototype.unregister = function(endpoint, name) {
	delete this.endpoints[endpoint][name];
}

exports.Decoder = Decoder;