nor-json-file
=============

Prototype of JSON file editing with JSON diff based transactions.

```javascript
var file = 'samples/test.json';
var JSONFile = require('nor-json-file');
JSONFile.open(file).then(function(data) {
	data.messages.push( {'subject':'Hello', 'body':'This is a test message.'} );
	return data.commit();
}).then(function() {
	util.debug('Successfully edited '+file);
}).fail(function(err) {
	/* ... */
}).done();

/* EOF */
