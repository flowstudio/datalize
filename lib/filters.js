const isEmpty = function(value) {
	return value === undefined || value === null || value === '';
};

const isTrue = function(value) {
	return value === true || value === 1 || value === '1';
};

const isFalse = function(value) {
	return value === false || value === 0 || value === '0';
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
	value = (value || '').toString();

	if (!(/^[\-0-9a-zA-Z\.\+_]+@[\-0-9a-zA-Z\.\+_]+\.[a-zA-Z]{2,}$/).test(value)) {
		throw new Error('%s is not a valid address.');
	}
};

const uppercase = function(value) {
	return String(value).toUpperCase();
};

const lowercase = function(value) {
	return String(value).toLowerCase();
};

const trim = function(value) {
	return String(value).trim();
};

const truncate = function(length, value) {
	value = String(value);

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
	value = String(value);

	if (value.length < min || value.length > max) {
		throw new Error(`%s must be between ${min} and ${max} characters long.`);
	}
};

module.exports = {
	isEmpty, isTrue, isFalse, required, nullable, number,
	bool, toggle, email, uppercase, lowercase, trim, truncate,
	range, length
};