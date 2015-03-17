var types = {
	'bool': {
		read: 'readUint8',
		write: 'writeUint8',
		size: 1
	},
	'uint8': {
		read: 'readUint8',
		write: 'writeUint8',
		size: 1
	},
	'int8': {
		read: 'readInt8',
		write: 'writeInt8',
		size: 1
	},
	'uint16': {
		read: 'readUint16',
		write: 'writeUint16', 
		size: 2
	},
	'int16': {
		read: 'readInt16',
		write: 'writeInt16', 
		size: 2
	},
	'uint32': {
		read: 'readUint32',
		write: 'writeUint32', 
		size: 4
	},
	'int32': {
		read: 'readInt32',
		write: 'writeInt32', 
		size: 4
	},
	'uint64': {
		read: 'readUint64',
		write: 'writeUint64', 
		size: 8
	},
	'int64': {
		read: 'readInt64',
		write: 'writeInt64', 
		size: 8
	},
	'float': {
		read: 'readFloat',
		write: 'writeFloat', 
		size: 4
	},
	'double': {
		read: 'readDouble',
		write: 'writeDouble', 
		size: 8
	},
	'cstring': {
		read: 'readCString',
		write: 'writeCString'
	},
	'istring': {
		read: 'readIString',
		write: 'writeIString'
	},
	'string': {
		read: 'readUTF8String',
		write: 'writeUTF8String'
	}
}

module.exports = types;