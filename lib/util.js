exports.hasErrors = function(errors) {
	if (Array.isArray(errors)) {
		return errors.length !== 0;
	} else {
		return errors && typeof errors === 'object' && Object.keys(errors).length !== 0;
	}
};