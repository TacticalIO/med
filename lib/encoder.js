var  ByteBuffer = require('bytebuffer'),
	debug = require('debug')('encoder'),
	Translator = require('./translator').Translator;

var Encoder = function() {
	this.messages = {}
}

Encoder.prototype.pack = function(name, msg) {
	return this.messages[name].pack(msg);
}

Encoder.prototype.register = function(name, klass, specs) {
	if (this.messages[name]) {
		debug('WARNING: existing definition will be replaced for ' + name);
	}
	this.messages[name] = new Translator(klass, specs);
}

Encoder.prototype.unregister = function(name, specs) {
	delete this.messages[name];
}

exports.Encoder = Encoder;