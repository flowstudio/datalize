const Data = require('./data');
const Field = require('./field');

const globalOptions = {};

const datalize = function(fields, options = {}) {
	const data = new Data(fields, Object.assign({}, globalOptions, options));

	return data.validate.bind(data);
};

datalize.params = function(fields, options = {}) {
	return datalize(fields, Object.assign({
		type: Data.Types.params,
	}, options));
};

datalize.query = function(fields, options = {}) {
	return datalize(fields, Object.assign({
		type: Data.Types.query,
	}, options));
};

datalize.field = function(...args) {
	return new Field(...args);
};

datalize.set = function(name, value) {
	globalOptions[name] = value;
};

datalize.Data = Data;
datalize.Field = Field;
datalize.Types = Data.Types;
datalize.Error = Data.Error;

module.exports = datalize;