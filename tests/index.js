const express = require('express');
const bodyParser = require('body-parser');
const { withAuthentication } = require('@frontegg/client');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/auth', withAuthentication(), () => {
  console.log('In an authenticated route');
});

app.listen(3456, () => {
  console.log('Server running on port 3456');
});
