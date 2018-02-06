'use strict';
const secrets = require('./config/appsecrets');
const SwaggerExpress = require('swagger-express-mw');
const app = require('express')();
const userContoller = require('./api/controllers/users')
module.exports = app; // for testing

const config = {
  appRoot: __dirname, // required config
  securityHandlers: {
        userAuth: userContoller.verifyJWT
    }
};

//DOCS
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./api/swagger/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
//END DOCS

SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) {
        throw err;
    }

    // install middleware
    swaggerExpress.register(app);

    const port = process.env.PORT || 10010;
    app.listen(port);
    app.set('JWTSecret', secrets.JWTSecret);
});
console.log('View Docs at:\t\thttp://localhost:10010/api-docs');
console.log('API endpoint:\t\thttp://localhost:10010/v0');
