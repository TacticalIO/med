var debug = require('debug')('test'),
	translator_t = require('./translator-t'),
	med_t = require('./med-t');

console.log('working directory: ' + __dirname);
translator_t.test();
med_t.test();

process.on('SIGINT', function() {
	med_t.end();
	debug('Test ended');
});


