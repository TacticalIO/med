var fs = require('fs'),
	should = require('should'),
	debug = require('debug')('med-t'),
	Med = require('../lib/med').Med;

var msg2 = {
	head: 0xFDFFA322, 
	source: 0X01, 
	timestamp: 0xF344123111,
	nbPositions: 5,
	positions: [ {
		timestamp: 0xF344123111,
		toto: 45
	}, {
		timestamp: 0xF344123112,
		toto: 46
	}, {
		timestamp: 0xF344123113,
		toto: 47
	}, {
		timestamp: 0xF344123114,
		toto: 48
	}, {
		timestamp: 0xF344123115,
		toto: 49
	}],
	type: 2, 
	someData: [ 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11],
	trainType: 43, 
	carrierFreq: 13, 
	td: 123.33,
	lowFreqName: '12345678901234567890', 
	end: 19
}

var config = JSON.parse(fs.readFileSync('./test/data/config.json'));
for (var i = 0; i < config.specsFiles.length; i++) {
	var specs = JSON.parse(fs.readFileSync(config.specsFiles[i]));
	config.specs = config.specs || {}
	for (var s in specs) {
		config.specs[s] = specs[s];
	}
}

var med = new Med(config);

exports.test = function() {
	debug('Test started');
	med.addMessageInstance('myLittleServer', 'msg1', 'MsgType1', 'in');
	med.addMessageInstance('myLittleClient', 'msg2', 'MsgType1', 'out');
	med.on('data', function(data) {
		console.log(data);
	});
	med.send('myLittleClient', 'msg2', msg2);
}

exports.end = function() {
	med.end();
}