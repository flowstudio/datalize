const get = require('lodash/get');
const filters = require('./filters');

class Field {
	constructor(name, label, prefix = '') {
		this.name = name;
		this.label = label;
		this.prefix = prefix;
		this.isArray = false;
		this.isContainer = false;
		this.isRequired = false;

		this.stack = [];
		this.children = [];
	}

	get path() {
		return this.prefix ? this.prefix + '.' + this.name : this.name;
	}

	add(fn) {
		this.stack.push(fn);

		return this;
	}

	addError(stack, e) {
		stack.push(e.message.replace('%s', this.label || this.name));
	}

	// TODO
	array() {
		this.isArray = true;

		return this;
	}

	// TODO
	container(children) {
		this.isContainer = true;

		this.children = children;
	}

	async validate(source, result, ctx, options) {
		const errors = [];
		let value = get(source, this.path);

		for (const fn of this.stack) {
			try {
				const ret = await fn(value, result, ctx);

				if (ret !== undefined) {
					value = ret;
				}
			} catch (e) {
				this.isRequired && this.addError(errors, e);

				if (options.breakOnRequired && fn === filters.required) {
					break;
				}
			}
		}

		if (value === undefined) {
			value = '';
		}

		return {value, errors};
	}

	required() {
		this.isRequired = true;

		return this.add(filters.required);
	}

	requiredIf(name, requiredValue) {
		return this.add(async (value, result) => {
			if (typeof name === 'string') {
				const compareValue = await result.getValue(this.prefix ? this.prefix + '.' + name : name);
				const isRequired = requiredValue === undefined ? !filters.isEmpty(compareValue) : compareValue === requiredValue;

				if (isRequired) {
					this.isRequired = true;
				}
			} else if (typeof name === 'function') {
				if (await name()) {
					this.isRequired = true;
				}
			}
		}).add(filters.required);
	}

	bool(value) {
		this.isRequired = true;

		this.add(filters.bool);

		if (value === true || value === false) {
			this.equal(value);
		}

		return this;
	}

	toggle(value) {
		this.isRequired = true;

		this.add(filters.toggle);

		if (value === 1 || value === 0) {
			this.equal(value);
		}

		return this;
	}

	equal(compare) {
		return this.add(function(value) {
			if (value !== compare) {
				throw new Error('%s is incorrect.');
			}
		});
	}

	default(defaultValue) {
		return this.add(function(value) {
			if (filters.isEmpty(value)) {
				return defaultValue;
			}
		});
	}
}

const extend = ['nullable', 'email', 'number', 'uppercase', 'lowercase', 'trim', 'truncate', 'range'];

extend.forEach(name => {
	Field.prototype[name] = function(...args) {
		return args.length ? this.add(filters[name].bind(null, ...args)) : this.add(filters[name]);
	};
});

module.exports = Field;