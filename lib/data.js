const Result = require('./result');

const Types = {
	form: 'form',
	params: 'params',
	query: 'query',
};

class DataError extends Error {
	constructor(errors) {
		super();
		this.errors = errors;
	}

	toJSON() {
		return {errors: this.errors};
	}
}

class Data {
	constructor(fields, options = {}) {
		if (!Array.isArray(fields)) {
			throw new Error('Fields must be an array.');
		}

		if (!options || typeof options !== 'object') {
			throw new Error('Options must be an object.');
		}

		this.fields = fields;
		this.options = Object.assign({
			type: Types.form,
			breakOnRequired: true,
			autoValidate: false,
			autoConvertToArray: true,
		}, options);
	}

	getSource(req, ctx) {
		switch (this.options.type) {
			case Types.form: {
				return req.body;
			}

			case Types.params: {
				return req.params || ctx.params;
			}

			case Types.query: {
				return req.query;
			}
		}
	}

	get name() {
		if (this.options.type === Types.form) {
			return 'form';
		} else {
			return 'data';
		}
	}

	async validate(req, res, next) {
		let ctx = req;
		let isExpress = true;
		// koa
		if (req.req && req.res) {
			next = res;
			req = ctx.request;
			res = ctx.response;
			isExpress = false;
		}

		const source = this.getSource(req, ctx);

		const result = new Result();

		await Promise.all(this.fields.map(async (field) => {
			const validation = field.validate(source, result, ctx, this.options);
			
			// store validation promise so other fields can get the value
			result.addField(field, validation);
			const {value, errors} = await validation;

			result.addField(field, value, errors);
		}));

		ctx[this.name] = result;

		if (this.options.autoValidate && !result.isValid) {
			if (isExpress) {
				return next(new DataError(result.errors));
			} else {
				throw new DataError(result.errors);
			}
		}

		await next();
	}
}

Data.Types = Types;
Data.Error = DataError;

module.exports = Data;