/* */

var is = require('nor-is');
var util = require('util');
var JSONFile = require('../src/index.js');

var file = 'samples/test.json';
JSONFile.open(file).then(function(data) {
	if(!(data && is.array(data.messages))) {
		throw new TypeError("data is invalid");
	}
	data.messages.push( {'subject':'Hello', 'body':'This is a test message.'} );
	return data.commit();
}).then(function() {
	util.debug('Successfully edited '+file);
}).fail(function(err) {
	if(err.stack) {
		util.error(err.stack);
	} else {
		util.error(err);
	}
}).done();

/* EOF */
