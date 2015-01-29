var fs = require('fs'),
	should = require('should'),
	Translator = require('../lib/translator').Translator;

var specs = JSON.parse(fs.readFileSync('./test/data/abaretest.specs'));

var tMsgType1 = new Translator('MsgType1', specs);

var msg1 = {
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

exports.test = function() {
	tMsgType1.sizeOf(msg1).should.be.exactly(110);
	var buf = tMsgType1.pack(msg1);
	console.log(buf.toHex(0, 110));
	tMsgType1.pack(msg1).toHex(0, 110).should.be.exactly('22a3fffd000000000100000000f3441231110511311244f30000002d12311244f30000002e13311244f30000002f14311244f30000003015311244f30000003102111111111111111111112b0000000d405ed51eb851eb8531323334353637383930313233343536373839300013');
	buf.compact(0, 110);
	console.log('limit= ', buf.limit);
	console.log('capacity= ', buf.capacity());
	var msg2 = tMsgType1.unpack(buf);
	console.log(msg2);

	/*
	01 02 03 04 05 06 07 08
	-----------------------
	22 a3 ff fd 00 00 00 00
	01 00
	00 00 00 f3 44 12 31 11
	05
	11 31 12 44 f3 00 00 00
	2d
	12 31 12 44 f3 00 00 00
	2e
	13 31 12 44 f3 00 00 00
	2f
	14 31 12 44 f3 00 00 00
	30
	15 31 12 44 f3 00 00 00
	31
	02
	11 11 11 11 11 11 11 11 11 11
	2b 00 00 00
	0d
	40 5e d5 1e b8 51 eb 85
	31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 
	00 13
	-----------------------------------------------------------
	01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20
	*/

}

