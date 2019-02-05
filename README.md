# Datalize

Parameter, query, form data validation and filtering for Koa and Express.

See also [this post about it on the Toptal Engineering Blog](https://www.toptal.com/nodejs/smart-node-js-form-validation).


[![npm](https://img.shields.io/npm/v/datalize.svg)
![npm](https://img.shields.io/npm/dm/datalize.svg)](https://www.npmjs.com/package/datalize)
[![license](https://img.shields.io/npm/l/express.svg)]()
[![vulnerabilities](https://snyk.io/test/github/flowstudio/datalize/badge.svg?targetFile=package.json)]()
[![dependencies](https://david-dm.org/flowstudio/datalize/status.svg)]()


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
const datalize = require('datalize');
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

### autoConvertToArray
Type: `Boolean`, Default: `false`

Auto converts `field.array()` fields to array.

### error
Type: `Error`, Default: `DataError`

Error object thrown on autoValidate.


## Filters
All filters and chainable.
```javascript
field('rooms').required().int().range(1, 20)
```

- `condition`: can throw error
- `filter`: updates value


### field.required()
- `condition`

### field.requiredIf(nameOrFn, requiredValue)
- `condition`
- nameOrFn: `String|function`
- requiredValue: `any` (optional) used only if nameOrFn is string 

### field.optional()
- `filter`
- The field is removed if value is undefined.

### field.optionalIf(nameOrFn, requiredValue)
- `filter`
- nameOrFn: `String|function`
- requiredValue: `any` (optional) used only if nameOrFn is string
- The field is removed if value is undefined and conditions are passed.

### field.patch()
- `filter`
- The same as optional but only if request's method is PATCH.

### field.array()
- `filter`
- Returned value will be an Array.

### field.container(children)
- `filter`
- children: `Array`
- Creates container will children fields, can be combined with `field.array()`.

### field.split(separator = ',')
- `filter`
- Converts value to array via splitting by separator.

### field.custom(fn)
- `condition`, `filter`

### field.bool(requiredValue)
- `condition`, `filter`
- requiredValue: `Boolean` (optional)
- Converts to boolean and if `requiredValue` is provided, the field's value must be equal to it.

### field.toggle(requiredValue)
- `condition`, `filter`
- requiredValue: `Number` (optional)
- Converts to number (0, 1) and if `requiredValue` is provided, the field's value must be equal to it.

### field.equal(compare)
- `condition`
- compare: `any`

### field.default(defaultValue)
- `filter`
- defaultValue: `any`

### field.nullable()
- `filter`
- Converts to null if is empty.

### field.email()
- `condition`

### field.number()
- `condition`, `filter`

### field.uppercase()
- `filter`

### field.lowercase()
- `filter`

### field.trim()
- `filter`

### field.truncate(length)
- `filter`
- length: `Number`

### field.range(min, max)
- `condition`, `filter`
- min: `Number|String|Function` (can be a number or name of a field or function that returns number)
- max: `Number|String|Function` (can be a number or name of a field or function that returns number)

### field.min(min)
- `condition`, `filter`
- min: `Number|String|Function` (can be a number or name of a field or function that returns number)

### field.max(max)
- `condition`, `filter`
- max: `Number|String|Function` (can be a number or name of a field or function that returns number)

### field.length(min, max)
- `condition`
- min: `Number`
- max: `Number`

### field.minLength(min)
- `condition`
- min: `Number`

### field.maxLength(max)
- `condition`
- max: `Number`

### field.int()
- `condition`, `filter`

### field.float()
- `condition`, `filter`

### field.id()
- `condition`, `filter`

### field.select(options)
- `condition`
- options: `Array`

## File filters

### field.file()
- `filter`
- Gets file from `req.files` object.

### field.mime(types)
- `condition`
- types: `Array`

### field.size(limit)
- `condition`
- limit: `Number` in Bytes


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

## Using custom filter globally
```javascript
const datalize = require('datalize');
const field = datalize.field;

datalize.Field.prototype.isSlug = function(chars = 'a-z-') {
	const regexp = new RegExp(`^([${chars}]+)$`);

	// make sure to return this.add() or this object to allow chaining
	return this.add(function(value, result, ctx) {
		if (!regexp.test(String(value))) {
			throw new Error('%s contains invalid characters.');
		}
	});
};

// then the filter can be used anywhere
datalize([
	field('slug').required().isSlug()
]);
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

---

## License
MIT

Copyright (c) 2018 Andrej Adamcik
