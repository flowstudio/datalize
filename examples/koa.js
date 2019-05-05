const Koa = require('koa');
const Router = require('koa-router');
const datalize = require('../lib');
const field = datalize.field;

const app = new Koa();
app.use(require('koa-body')({
	nableTypes: ['json', 'form'],
	multipart: true,
	formidable: {
		maxFileSize: 32 * 1024 * 1024,
	}
}));

const router = new Router();

datalize.set('autoValidate', true);

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof datalize.Error) {
			ctx.body = Object.assign({
				status: 'error'
			}, err.toJSON());
		}
	}
});

router.post('/', datalize([
	field('email').required().isEmail(),
	field('firstname').required(),
	field('lastname', 'Lastname').requiredIf('firstname'),
	field('isTerms').bool(true),
	field('from').required().range(0, 30),
	field('to').range(0, 30).min('from'),
	field('items').array().container([
		field('name').required()
	]),
	field('billing').container([
		field('firstname').required(),
		field('lastname').requiredIf('firstname')
	]),
	field('photo').file().mime(['image/png']),
	field('types').split(',').int()
]), (ctx, next) => {
	ctx.body = {
		status: "success",
		data: ctx.form,
	};
});

app
.use(router.routes())
.use(router.allowedMethods());

const port = process.env.PORT || 3000;

app.listen(port);

console.log(`🚀  App running at http://localhost:${port}/`);