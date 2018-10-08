const isEmpty = function(value) {
	return value === undefined || value === null || value === '';
};

const isTrue = function(value) {
	return value === true || value === 1 || value === '1' || value === 'true';
};

const isFalse = function(value) {
	return value === false || value === 0 || value === '0' || value === 'false';
};

const toString = function(value) {
	return isEmpty(value) ? '' : String(value);
};

const normalizeParam = async function(param, value, result, ctx) {
	if (typeof param === 'function') {
		return await param(value, result, ctx);
	}
	
	if (typeof param === 'string') {
		return await result.getValue(param);
	}

	return param;
};

const required = function(value) {
	if (isEmpty(value)) {
		throw new Error('%s is required.');
	}
};

const nullable = function(value) {
	if (isEmpty(value)) {
		return null;
	}

	return value;
};

const number = function(value) {
	const newValue = Number(value);

	if (isEmpty(value) || isNaN(newValue)) {
		throw new Error('%s is not a number.');
	}

	return newValue;
};

const bool = function(value) {
	if (isTrue(value)) {
		return true;
	} else if (isFalse(value) || isEmpty(value)) {
		return false;
	} else {
		throw new Error('%s is not valid.');
	}
};

const toggle = function(value) {
	if (isTrue(value)) {
		return 1;
	} else if (isFalse(value) || isEmpty(value)) {
		return 0;
	} else {
		throw new Error('%s is not valid.');
	}
};

const email = function(value) {
	value = toString(value);

	if (!(/^[\-0-9a-zA-Z\.\+_]+@[\-0-9a-zA-Z\.\+_]+\.[a-zA-Z]{2,}$/).test(value)) {
		throw new Error('%s is not a valid address.');
	}
};

const uppercase = function(value) {
	return toString(value).toUpperCase();
};

const lowercase = function(value) {
	return toString(value).toLowerCase();
};

const trim = function(value) {
	return toString(value).trim();
};

const truncate = function(length, value) {
	value = toString(value);

	if (value.length <= length) {
		return value;
	}

	return value.substr(0, length);
};

const range = async function(min, max, value, result, ctx) {
	value = number(value);

	min = await normalizeParam(min, value, result, ctx);
	max = await normalizeParam(max, value, result, ctx);

	if (typeof min !== 'number' || typeof max !== 'number') {
		return;
	}

	if (value < min || value > max) {
		throw new Error(`%s must be between ${min} and ${max}.`);
	}

	return value;
};

const min = async function(min, value, result, ctx) {
	value = number(value);

	min = await normalizeParam(min, value, result, ctx);

	if (typeof min !== 'number') {
		return;
	}

	if (value < min) {
		throw new Error(`%s must at least ${min}.`);
	}

	return value;
};

const max = async function(max, value, result) {
	value = number(value);

	max = await normalizeParam(max, value, result, ctx);

	if (typeof max !== 'number') {
		return;
	}

	if (value < max) {
		throw new Error(`%s must at most ${max}.`);
	}

	return value;
};

const length = function(min, max, value) {
	value = toString(value);

	if (value.length < min || value.length > max) {
		throw new Error(`%s must be between ${min} and ${max} characters long.`);
	}
};

const minLength = function(min, value) {
	value = toString(value);

	if (value.length < min) {
		throw new Error(`%s must be at least ${min} characters long.`);
	}
};

const maxLength = function(max, value) {
	value = toString(value);

	if (value.length > max) {
		throw new Error(`%s must be at most ${max} characters long.`);
	}
};

const int = function(value) {
	value = number(value);

	if (value % 1 !== 0) {
		throw new Error(`%s is not an integer.`);
	}

	return value;
};

const float = function(value) {
	return number(value);
};

const id = function(value) {
	value = int(value);

	if (value < 1) {
		throw new Error(`%s is not valid.`);
	}

	return value;
};

const select = function(options, value) {
	if (Array.isArray(value)) {
		const filtered = value.filter(item => {
			return options.indexOf(item) !== -1;
		}).length;
		
		if (filtered !== value.length) {
			throw new Error('%s contains invalid options.');
		}
	} else if (options.indexOf(value) === -1) {
		throw new Error('%s is not valid.');
	}
};

const files = {
	mime(types, value) {
		const mime = value ? value.type || value.mimetype : null;

		if (types.indexOf(mime) === -1) {
			throw new Error('%s has invalid file format.');
		}
	},
	size(limit, value) {
		const size = value ? value.size : null;

		if (typeof size !== 'number' || size > limit) {
			throw new Error('%s is too large.');
		}
	}
};

module.exports = {
	isEmpty, isTrue, isFalse, required, nullable, number,
	bool, toggle, email, uppercase, lowercase, trim, truncate,
	range, length, minLength, maxLength, int, float, id, select,
	min, max, files,
};