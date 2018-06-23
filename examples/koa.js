const Koa = require('koa');
const Router = require('koa-router');
const datalize = require('../lib');
const field = datalize.field;

const app = new Koa();
app.use(require('koa-body')());

const router = new Router();

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
	field('email', 'E-mail').required().email(),
	field('firstname', 'Firstname').required(),
	field('lastname', 'Lastname').requiredIf('firstname'),
	field('isTerms').bool(true),
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