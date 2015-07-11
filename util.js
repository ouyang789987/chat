var config = require('./config.js');
var sanitizeHtml = require('sanitize-html');

exports.sanitize = function (message) {
	return sanitizeHtml(message, config.sanitizeOptions);
}

exports.checkName = function (name) {
	return ~name.search(/^(\w)+$/);
}