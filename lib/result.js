const {hasErrors} = require('./util');

class Result {
	constructor() {
		Object.defineProperties(this, {
			errors: {
				value: {},
				enumerable: false,
			}
		});
	}

	get isValid() {
		return Object.keys(this.errors).length === 0;
	}

	addField(field, value, errors) {
		this[field.name] = value;

		if (hasErrors(errors)) {
			this.errors[field.name] = errors;
		}
	}

	removeField(field) {
		delete this[field.name];
	}

	async getValue(name) {
		let value = this[name];

		if (value instanceof Promise) {
			value = (await value).value;
		}

		return value;
	}

	createContainer() {
		return new Result();
	}
}

module.exports = Result;