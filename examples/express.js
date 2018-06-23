const express = require('express');

const datalize = require('../lib');
const field = datalize.field;

const app = express();
app.use(require('body-parser').json());

app.post('/', datalize([
	field('email')
]), function (req, res) {
	res.send({
		status: 'success',
		data: req.form,
	})
});

const port = process.env.EXPRESS_PORT || 3001;

app.listen(port);

console.log(`🚀  App running at http://localhost:${port}/`);