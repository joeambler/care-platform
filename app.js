'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

var port = process.env.PORT || 10010;

//DOCS
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./api/swagger/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
console.log('View Docs at:\t\t http://localhost:' + port + '/api-docs');
//END DOCS

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  app.listen(port);
  console.log('API endpoint:\t\t http://localhost:' + port + '/v0');

});
