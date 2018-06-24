# Datalize

Parameter, query, form data validation and filtering for Koa and Express.


[![npm](https://img.shields.io/npm/v/datalize.svg)
![npm](https://img.shields.io/npm/dm/datalize.svg)](https://www.npmjs.com/package/datalize)
[![license](https://img.shields.io/npm/l/express.svg)]()

## Installation

```bash
npm install --save datalize
```

## Usage

### Koa
```javascript
const Koa = require('koa');
const Router = require('koa-router');
const datalize = require('datalize');
const field = datalize.field;

const app = new Koa();

// add any body parser
app.use(require('koa-body')());

const router = new Router();

router.post('/', datalize([
	field('email', 'E-mail').required().email(),
	field('firstname', 'Firstname').required(),
	field('lastname', 'Lastname').required().trim(),
	field('isTerms').bool(true),
]), (ctx, next) => {
	ctx.body = {
		status: 'success',
		data: ctx.form,
	};
});

app
.use(router.routes())
.use(router.allowedMethods());
```

### Express
```javascript
const express = require('express');
const datalize = require('../lib');
const field = datalize.field;

const app = express();

// add any body parser
app.use(require('body-parser').json());

app.post('/', datalize([
	field('email', 'E-mail').required().email(),
	field('firstname', 'Firstname').required(),
	field('lastname', 'Lastname').required().trim(),
	field('isTerms').bool(true),
]), (req, res) => {
	res.send({
		status: 'success',
		data: req.form,
	});
});
```

## Methods

### datalize(fields, options)
Creates Data object and returns validation middleware, which uses `body` as source. Result is set to `context/request.form` object.

### datalize.params(fields, options)
Same as `datalize()`, but uses `params` as source. Result is set to `context/request.data` object.


### datalize.query(fields, options)
Same as `datalize()`, but uses `query` as source. Result is set to `context/request.data` object.

### datalize.field(name, label)
Returns: `Field`

Creates Field object.

### datalize.set(name, value)
Sets global option for datalize.


```javascript
datalize.set('autoValidate', true);
```


## Options

### type
Type: `String`, Default: `'form'`

### breakOnRequired
Type: `Boolean`, Default: `true`

If required error is returned, no other errors will be collected.

### autoValidate
Type: `Boolean`, Default: `false`

Auto validates form and throws `Data.Error` if there is any error.


## Filters
All filters and chainable.
```javascript
field('rooms').required().int().range(1, 20)
```

- `condition`: can throw error
- `filter`: updates value


### field.required() - `condition`

### field.requiredIf(name, requiredValue) - `condition`
name: `String|function`, requiredValue: `any` (optional)

### field.array() - `filter`
Returned value will be an Array.

### field.container(children) - `filter`
Creates container will children fields, can be combined with `field.array()`.

### field.custom(fn) - `condition`, `filter`

### field.bool(requiredValue) - `condition`, `filter`
Converts to boolean and if `requiredValue` is provided, the field's value must be equal to it.

### field.toggle(requiredValue) - `condition`, `filter`
Converts to number (0, 1) and if `requiredValue` is provided, the field's value must be equal to it.

### field.equal(compare) - `condition`

### field.default(defaultValue) - `filter`

### field.nullable() - `filter`
Converts to null if is empty.

### field.email() - `condition`

### field.number() - `condition`, `filter`

### field.uppercase() - `filter`

### field.lowercase() - `filter`

### field.trim() - `filter`

### field.truncate(length) - `filter`

### field.range(min, max) - `condition`

### field.length(min, max) - `condition`

### field.int() - `condition`, `filter`

### field.float() - `condition`, `filter`

### field.id() - `condition`, `filter`

### field.select(options) - `condition`

## Custom filter
```javascript
field.custom(function(value, result, ctx) {
	if (['optionA', 'optionB'].indexOf(value) === -1) {
		throw new Error('%s has invalid value.');
	}
});

field.custom(function(value, result, ctx) {
	return moment(value).format('YYYY/MM/DD');
});

field.custom(async (value, result, ctx) => {
	const typeValue = await result.getValue('type');

	if (type === 'business') {
		return null;
	}
});
```

## Error handling
```javascript
router.post('/', datalize([
	field('email', 'E-mail').required().email(),
]), (ctx, next) => {
	if (!ctx.form.isValid) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			errors: ctx.form.errors,
		};

		return;
	}

	ctx.body = {
		status: 'success',
		data: ctx.form,
	};
});
```

## Global error handling
### Koa
```javascript
datalize.set('autoValidate', true);

// add to very beginning of koa middlewares
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof datalize.Error) {
			ctx.status = 400;
			ctx.body = Object.assign({
				status: 'error'
			}, err.toJSON());
		}
	}
});
```

### Express
```javascript
datalize.set('autoValidate', true);

// add to very end of express middlewares
app.use(function(err, req, res, next) {
	if (err instanceof datalize.Error) {
		res.status(400).send(Object.assign({
			status: 'error'
		}, err.toJSON()));
	}
});
```