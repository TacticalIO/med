var ByteBuffer = require('bytebuffer'),
	types = require('./types');

var Translator = function(name, specs) {
	this.name = name;
	this.specs = specs;
	this.spec = specs[name];
	this.lstypes = Object.keys(types);
	this.buffer = null;
	this.value = null;
}

Translator.prototype.minSizeOf = function() {

}

Translator.prototype.sizeOf = function(value, spec, length) {
	spec = spec || this.spec;
	var size = 0;
	if (Array.isArray(value)) {
		if (length == value.length) {
			for (var i = 0; i < value.length; i++) {
				size += this.sizeOf(value[i], spec);
			}
		} else {
			throw new Error('Message format does not match definition: wrong array length (' +
				+ length + '!=' + value.length + ')');
		}
	} else {
		for (var p in value) {
			var occurs = 1;
			if (spec[p].occurs !== undefined) {
				if (typeof spec[p].occurs == 'string') {
					occurs = value[spec[p].occurs];
				} else {
					occurs = spec[p].occurs;
				}
			}
			if (spec[p].size) {
				size += spec[p].size * occurs;
			} else {
				if (this.lstypes.indexOf(spec[p].type) >= 0) {
					size += types[spec[p].type].size * occurs;
				} else {
					size += this.sizeOf(value[p], this.specs[spec[p].type], occurs);
				}
			}
		}
	}
	return size;
}

Translator.prototype.pack = function(value, spec, buf, length) {
	buf = buf || new ByteBuffer(); 
	spec = spec || this.spec;

	if (Array.isArray(value)) {
		if (length == value.length) {
			for (var i = 0; i < value.length; i++) {
				this.pack(value[i], spec, buf);
			}
		} else {
			throw new Error('Message format does not match definition: wrong array length (' +
				+ length + '!=' + value.length + ')');
		}
	} else {
		for (var p in value) {
			var occurs = 1;
			if (spec[p].occurs !== undefined) {
				if (typeof spec[p].occurs == 'string') {
					occurs = value[spec[p].occurs];
				} else {
					occurs = spec[p].occurs;
				}
			}
			if (this.lstypes.indexOf(spec[p].type) >= 0) {
				for (var i = 0; i < occurs; i++) {
					if (spec[p].endianness == 'littleEndian') {
						buf.LE();
					} else {
						buf.BE();
					}
					if (Array.isArray(value[p])) {
						buf[types[spec[p].type].write](value[p][i]);
					} else {
						buf[types[spec[p].type].write](value[p]);
					}
				}
			} else {
				this.pack(value[p], this.specs[spec[p].type], buf, occurs);
			}
		}
	}
	this.buffer = buf;
	return buf;
}

Translator.prototype.unpack = function(buf, spec, obj, occurs) {
	obj = obj || {}; 
	spec = spec || this.spec;

	if (occurs) {
		if (typeof occurs == 'string') {
			occurs = obj[occurs];
		}
		for (var i = 0; i < occurs; i++) {
			obj[i] = this.unpack(buf, spec, obj[i]);
			if (obj[i].high !== undefined && obj[i].low !== undefined) {
				obj[i] = obj[i].toNumber();
			}
		}		
	} else {
		for (var p in spec) {
			var occurs = 1;
			if (spec[p].occurs !== undefined) {
				if (typeof spec[p].occurs == 'string') {
					occurs = obj[spec[p].occurs];
				} else {
					occurs = spec[p].occurs;
				}
			}
			if (this.lstypes.indexOf(spec[p].type) >= 0) {
				for (var i = 0; i < occurs; i++) {
					if (spec[p].endianness == 'littleEndian') {
						buf.LE();
					} else {
						buf.BE();
					}
					if (spec[p].occurs) {
						obj[p] = obj[p] || []
						obj[p][i] = buf[types[spec[p].type].read](spec[p].size);
						// if long
						if (obj[p][i].high !== undefined && obj[p][i].low !== undefined) {
							obj[p][i] = obj[p].toNumber();
						}
					} else {
						obj[p] = buf[types[spec[p].type].read](spec[p].size);
						// if long
						if (obj[p].high !== undefined && obj[p].low !== undefined) {
							obj[p] = obj[p].toNumber();
						}
					}
				}
			} else {
				if (spec[p].occurs) obj[p] = [];
				this.unpack(buf, this.specs[spec[p].type], obj[p], occurs);
			}
		}
	}
	this.value = obj;
	return obj;
}

exports.Translator = Translator;