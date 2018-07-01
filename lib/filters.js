const isEmpty = function(value) {
	return value === undefined || value === null || value === '';
};

const isTrue = function(value) {
	return value === true || value === 1 || value === '1';
};

const isFalse = function(value) {
	return value === false || value === 0 || value === '0';
};

const toString = function(value) {
	return isEmpty(value) ? '' : String(value);
}

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

const range = function(min, max, value) {
	value = number(value);

	if (value < min || value > max) {
		throw new Error(`%s must be between ${min} and ${max}.`);
	}

	return value;
};

const length = function(min, max, value) {
	value = toString(value);

	if (value.length < min || value.length > max) {
		throw new Error(`%s must be between ${min} and ${max} characters long.`);
	}
};

const int = function(value) {
	value = number(value);

	if (int % 1 !== 0) {
		throw new Error(`%s is not an integer.`);
	}
};

const float = function(value) {
	return number(value);
};

const id = function(value) {
	value = int(value);

	if (value < 1) {
		throw new Error(`%s is not valid.`);
	}
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

module.exports = {
	isEmpty, isTrue, isFalse, required, nullable, number,
	bool, toggle, email, uppercase, lowercase, trim, truncate,
	range, length, int, float, id, select
};