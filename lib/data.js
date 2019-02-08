const Result = require('./result');

const Types = {
	form: 'form',
	params: 'params',
	query: 'query',
};

const Provider = {
	express: Symbol(),
	koa: Symbol(),
	raw: Symbol(),
	other: Symbol(),
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
			error: DataError,
		}, options);
	}

	getSource(req, ctx) {
		switch (this.options.type) {
			case Types.form: {
				const source = req.body || {};
				source.__files = typeof req.files === 'object' && req.files ? req.files : {};

				return source;
			}

			case Types.params: {
				return req.params || ctx.params || {};
			}

			case Types.query: {
				return req.query || {};
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
		let provider;

		// detect data provider
		if (!res && !next) {
			provider = Provider.raw;
		} else if (req.req && req.res) {
			provider = Provider.koa;

			next = res;
			req = ctx.request;
			res = ctx.response;
		} else if (res && next) {
			provider = Provider.express;
		} else if (typeof res === 'function') {
			provider = Provider.other;
			next = res;
			res = null;
		} else {
			throw Error('Invalid data provider.');
		}

		const source = provider === Provider.raw ? req : this.getSource(req, ctx);

		const result = new Result();

		await Promise.all(this.fields.map(async (field) => {
			const validation = field.validate(source, result, ctx, this.options);
			
			// store validation promise so other fields can get the value
			result.addField(field, validation);
			const {value, errors} = await validation;

			if (value !== undefined) {
				result.addField(field, value, errors);
			} else {
				result.removeField(field);
			}
		}));

		if (provider !== Provider.raw) {
			ctx[this.name] = result;
		}

		if (this.options.autoValidate && !result.isValid) {
			if (provider === Provider.express) {
				return next(new this.options.error(result.errors));
			} else {
				throw new this.options.error(result.errors);
			}
		}

		if (provider === Provider.raw) {
			return result;
		}

		await next();
	}
}

Data.Types = Types;
Data.Error = DataError;

module.exports = Data;