/* JSON file editing with transactions
 * Copyright 2013 Jaakko-Heikki Heusala <jheusala@iki.fi>
 */

var util = require('util');

/* Deep copy two JS objects */
function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

/* Get random string */
function get_random_string(bytes) {
	bytes = bytes || 4;
	return require('crypto').randomBytes(bytes).toString('hex');
}

/** Read JSON file */
function read_json_file(file) {
	function parse_json(body) {
		return JSON.parse(body);
	}
	return require('nor-fs').path(file).readFile({encoding:"utf8"}).then(parse_json);
}

/** Apply JSON patch into file */
function apply_patch(file, patch) {

	var fs = require('nor-fs');
	var id = get_random_string();

	util.debug('id = ' + util.inspect(id) );

	util.debug('patch = ' + util.inspect(patch) );

	function read_orig() {
		return read_json_file(file+'.'+id+'.orig');
	}

	function patch_data(data) {
		data = clone(data);
		util.debug('before patch = ' + util.inspect(data));
		require('json-patch').apply(data, patch);
		util.debug('after patch = ' + util.inspect(data));
		return data;
	}

	function write_new(data) {
		var buffer = new Buffer(JSON.stringify(data, null, 2)+'\n', "utf8");
		return fs.open(file+'.'+id+'.new', "w").$write(buffer, 0, buffer.length, null).$sync().$close();
	}

	function commit() {
		return fs.rename(file+'.'+id+'.new', file);
	}

	function rollback(err) {
		return fs.rename(file+'.'+id+'.orig', file).then(function() { throw err; });
	}

	function cleanup(err) {
		return fs.unlinkIfExists(file+'.'+id+'.orig');
	}

	return fs.rename(file, file+'.'+id+'.orig').then(read_orig).then(patch_data).then(write_new).then(commit).then(cleanup).fail(rollback);
}

/** Constructor */
function JSONFileTransaction(file, opts) {
	var self = this;

	opts = opts || {};

	self._metadata = {
		'file': file,
		'orig': opts.data || {}
	};

	var copy = clone(self._metadata.orig);
	Object.keys(copy).forEach(function(key) {
		if(key === "_metadata") { return; }
		self[key] = copy[key];
	});
}

/** Open a JSON file */
JSONFileTransaction.open = function(file, opts) {
	function create_transaction(data) {
		util.debug('[create_transaction] data = ' + util.inspect(data));
		return new JSONFileTransaction(file, {'data':data});
	}
	return read_json_file(file).then(create_transaction);
};

/** Get internal data object */
JSONFileTransaction.prototype.valueOf = function() {
	var self = this;
	var copy = clone(self);
	delete copy._metadata;
	util.debug('.valueOf() returns ' + util.inspect(copy) );
	return copy;
};

/** Get diff of changes */
JSONFileTransaction.prototype.diff = function() {
	var self = this;
	var orig_obj = self._metadata.orig;
	var new_obj = self.valueOf();
	util.debug('orig = ' + util.inspect(orig_obj) );
	util.debug('new = ' + util.inspect(new_obj) );
	var patch = require('json-diff-patch').diff(orig_obj, new_obj);
	util.debug('patch = ' + util.inspect(patch));
	return patch;
};

/** Commit changes to file */
JSONFileTransaction.prototype.commit = function() {
	return apply_patch(this._metadata.file, this.diff());
};

// Exports
module.exports = JSONFileTransaction;

/* EOF */
