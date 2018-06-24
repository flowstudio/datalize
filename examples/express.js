const express = require('express');

const datalize = require('../lib');
const field = datalize.field;

const app = express();
app.use(require('body-parser').json());

datalize.set('autoValidate', true);

app.post('/', datalize([
	field('email').required().email()
]), function (req, res) {
	res.send({
		status: 'success',
		data: req.form,
	})
});

app.use(function(err, req, res, next) {
	if (err instanceof datalize.Error) {
		res.status(400).send(Object.assign({
			status: 'error'
		}, err.toJSON()));
	}
});

const port = process.env.EXPRESS_PORT || 3001;

app.listen(port);

console.log(`🚀  App running at http://localhost:${port}/`);