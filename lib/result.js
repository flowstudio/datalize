const get = require('lodash/get');
const set = require('lodash/set');
const unset = require('lodash/unset');

const Field = require('./field');

class Result {
	constructor() {
		Object.defineProperties(this, {
			errors: {
				value: {},
				enumerable: false,
			}
		});
	}

	addField(field, value, errors) {
		set(this, field.path, value);

		if (!Field.hasError(errors)) {
			return;
		}

		set(this.errors, field.path, errors);
	}

	removeField(field) {
		unset(this, field.path);
	}

	async getValue(name) {
		let value = get(this, name);

		if (value instanceof Promise) {
			value = (await value).value;
		}

		return value;
	}

	get isValid() {
		return Object.keys(this.errors).length === 0;
	}

	createContainer() {
		return new Result();
	}
}

module.exports = Result;