const express = require('express');
const bodyParser = require('body-parser');
const datalize = require('../lib');
const field = datalize.field;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

datalize.set('autoValidate', true);

app.post('/', datalize([
	field('email').required().email()
]), function (req, res) {
	res.send({
		status: 'success',
		data: req.form,
	})
});

app.post('/customMessage', datalize([
	field('email').required('请输入email').email({message:'email格式错误'}),
	field('age').required('请输入年龄').range(10, 100, {message:'超过限制范围'}),
	field('title').trim().minLength(2, {message:'字数超过限制范围'}),
	field('type').select(['a', 'b'], {message:'请输入规定值'})
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