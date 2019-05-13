const get = require('lodash/get');
const filters = require('./filters');

const RequiredSymbol = Symbol();
const NotRequiredSymbol = Symbol();
const OptionalSymbol = Symbol();

class Field {
	constructor(name, label, prefix = '') {
		this.name = name;
		this.label = label;
		this.prefix = prefix;
		this.isArray = false;
		this.isContainer = false;
		this.isRequired = false;
		this.isOptional = false;
		this.isFile = false;
		this.splitSeparator = null;

		this.stack = [];
		this.children = [];
	}

	get path() {
		return this.prefix ? this.prefix + '.' + this.name : this.name;
	}

	add(fn) {
		// remove duplicate required filters (caused by chaining)
		if (fn === filters.required) {
			const index = this.stack.indexOf(filters.required);

			index !== -1 && (this.stack.splice(index, 1));
		}

		this.stack.push(fn);

		return this;
	}

	addError(stack, e) {
		stack.push(e.message.replace('%s', this.label || this.name));

		return stack;
	}

	array() {
		this.isArray = true;

		return this;
	}

	container(children) {
		this.isContainer = true;
		this.children = children;

		return this;
	}

	split(separator = ',') {
		this.isArray = true;
		this.splitSeparator = separator;

		return this;
	}

	file() {
		this.isFile = true;

		return this;
	}

	async validateArray(value, result, ctx, options) {
		const errors = [];

		if (this.isRequired && !value.length) {
			return {value, errors: this.addError([], new Error('%s is required.'))};
		}

		value = await Promise.all(value.map(async (value, i) => {
			const validateFn = this.isContainer ? 'validateContainer' : 'validateField';

			const { value: itemValue, errors:  itemErrors } = await this[validateFn](value, result, ctx, options);

			if (Field.hasError(itemErrors)) {
				errors[i] = itemErrors;
			}

			return itemValue;
		}));

		return {value, errors};
	}

	async validateContainer(value, result, ctx, options) {
		const errors = {};
		const newValue = {};
		// create custom result object container so all value lookups are related to this container
		const containerResult = result.createContainer();

		await Promise.all(this.children.map(async (item) => {
			const validation = item.validate(value, containerResult, ctx, options);
			
			// store validation promise so other fields can get the value
			containerResult.addField(item, validation);
			const { value: itemValue, errors: itemErrors } = await validation;

			if (itemValue !== undefined) {
				newValue[item.name] = itemValue;
				containerResult.addField(item, itemValue, itemErrors);
			} else {
				containerResult.removeField(item);
			}

			if (Field.hasError(itemErrors)) {
				errors[item.name] = itemErrors;
			}
		}));

		return {value: newValue, errors};
	}

	async validateField(value, result, ctx, options) {
		const errors = [];

		let isRequired = this.isRequired;
		let notRequired = false;

		// return undefined if is optional and value not defined
		if (this.isOptional && value === undefined) {
			return {value, errors};
		}

		for (const fn of this.stack) {
			try {
				const ret = await fn(value, result, ctx, this);

				if (ret === RequiredSymbol) {
					if (!notRequired) {
						isRequired = true;
					}
				} else if (ret === NotRequiredSymbol) {
					isRequired = false;
					notRequired = true;
				// return undefined if is optionalIf() and value not defined
				} else if (ret === OptionalSymbol && value === undefined) {
					return {value, errors};
				} else if (ret !== undefined) {
					value = ret;
				}
			} catch (e) {
				(isRequired || !filters.isEmpty(value)) && this.addError(errors, e);

				if (options.breakOnRequired && fn === filters.required) {
					break;
				}
			}
		}

		// return empty string or null if value is undefined, otherwise the field would be
		// removed from object
		if (value === undefined) {
			value = this.isFile ? null : '';
		}

		return {value, errors};
	}

	async validate(source, result, ctx, options) {
		const errors = [];
		let value = get(this.isFile ? source.__files : source, this.path);

		if (this.isArray && !value) {
			// try to load data from name[] key
			value = get(this.isFile ? source.__files : source, this.path + '[]');
		}

		if (this.splitSeparator !== null) {
			value = filters.isEmpty(value) ? [] : String(value).split(this.splitSeparator);
		}

		// validate source value type
		if (Array.isArray(value) && !this.isArray) {
			this.addError(errors, new Error('%s is not valid.'));

			return {value, errors};
		} else if (this.isArray && !Array.isArray(value)) {
			if (options.autoConvertToArray) {
				value = filters.isEmpty(value) ? [] : [value];
			} else {
				this.addError(errors, new Error('%s is not valid.'));

				return {value, errors};
			}
		}

		if (this.isArray) {
			return await this.validateArray(value, result, ctx, options);
		} else if (this.isContainer) {
			return await this.validateContainer(value, result, ctx, options);
		} else {
			return await this.validateField(value, result, ctx, options);
		}
	}

	required() {
		this.isRequired = true;

		return this.add(filters.required);
	}

	requiredIf(name, requiredValue) {
		return this.add(async (value, result, ctx) => {
			if (typeof name === 'string') {
				const compareValue = await result.getValue(this.prefix ? this.prefix + '.' + name : name);

				let isRequired = false;

				if (requiredValue === undefined) {
					isRequired = !filters.isEmpty(compareValue);
				} else if (Array.isArray(requiredValue)) {
					isRequired = requiredValue.indexOf(compareValue) !== -1;
				} else {
					isRequired = compareValue === requiredValue;
				}

				if (isRequired) {
					return RequiredSymbol;
				}
			} else if (typeof name === 'function') {
				if (await name(value, result, ctx, this)) {
					return RequiredSymbol;
				}
			}

			return NotRequiredSymbol;
		}).add(filters.required);
	}

	optional() {
		this.isOptional = true;

		return this;
	}

	optionalIf(name, requiredValue) {
		return this.add(async (value, result, ctx) => {
			if (typeof name === 'string') {
				const compareValue = await result.getValue(this.prefix ? this.prefix + '.' + name : name);

				let isOptional = false;

				if (isOptional === undefined) {
					isOptional = !filters.isEmpty(compareValue);
				} else if (Array.isArray(requiredValue)) {
					isOptional = requiredValue.indexOf(compareValue) !== -1;
				} else {
					isOptional = compareValue === requiredValue;
				}

				if (isOptional) {
					return OptionalSymbol;
				}
			} else if (typeof name === 'function') {
				if (await name(value, result, ctx, this)) {
					return OptionalSymbol;
				}
			}
		});
	}

	patch() {
		return this.add(async (value, result, ctx) => {
			if (ctx.method === 'PATCH') {
				return OptionalSymbol;
			}
		});
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

	custom(fn) {
		return this.add(fn);
	}
}

const extend = [
	'nullable', 'email', 'number', 'uppercase', 'lowercase', 'trim', 
	'truncate', 'range', 'length', 'minLength', 'maxLength',
	'int', 'float', 'id', 'select', 'min', 'max',

];

extend.forEach(name => {
	Field.prototype[name] = function(...args) {
		return args.length ? this.add(filters[name].bind(null, ...args)) : this.add(filters[name]);
	};
});

const fileExtend = [
	'mime', 'size',
];

fileExtend.forEach(name => {
	Field.prototype[name] = function(...args) {
		if (!this.isFile) {
			throw new Error('This filter can be used only for file field.');
		}

		return args.length ? this.add(filters.files[name].bind(null, ...args)) : this.add(filters.files[name]);
	};
});

Field.hasError = function(errors) {
	if (Array.isArray(errors)) {
		return errors.length !== 0;
	} else {
		return errors && typeof errors === 'object' && Object.keys(errors).length !== 0;
	}
};

module.exports = Field;