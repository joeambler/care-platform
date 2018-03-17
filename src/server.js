'use strict';

const SwaggerExpress = require('swagger-express-mw');
const app = require('express')();
const userController = require('./api/controllers/users');
const componentController = require('./api/controllers/components');
const demoClient = require('./democlient/client');
const url = require('url');
const fs = require('fs');

module.exports = app; // for testing

const config = {
  appRoot: __dirname, // required config
  securityHandlers: {
        userAuth: userController.verifyJWT,
        componentAuth: componentController.authenticateComponent
    }
};

const baseURL = process.env.NODE_ENV === 'production'?
    process.env.HOST
    : 'localhost:10010';

const specPath = __dirname + '/api/swagger/swagger.yaml';

//DOCS
// noinspection NpmUsedModulesInstalled
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const pug = require("pug");
const swaggerDocument = YAML.load(specPath);

swaggerDocument.host = baseURL;

app.use('/spec.json', (req, res) => res.json(swaggerDocument));
app.use('/spec.yaml', (req, res) => {
    fs.readFile(specPath, 'utf8', function(err, contents) {
        res.type('text/plain');
        res.send(contents.replace('localhost:10010', baseURL));
    });
});
app.use('/democlient', (req, res) =>  demoClient.getUI(res));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.send(pug.renderFile('./src/views/index.pug', {url: activeProtocol +baseURL})));
//END DOCS

SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) {
        throw err;
    }

    // install middleware
    swaggerExpress.register(app);

    const port = process.env.PORT || 10010;
    app.listen(port);

    if (process.env.SECRET){
        app.set('JWTSecret', process.env.SECRET);
    } else{
        const secrets = require('./config/appsecrets');
        app.set('JWTSecret', secrets.JWTSecret);
    }

    if (process.env.EMAIL){
        app.set('EmailAccount', {
            'server': process.env.EMAILSERVER,
            'email': process.env.EMAIL,
            'password': process.env.EMAILPASSWORD
        });
    } else{
        const secrets = require('./config/appsecrets');
        app.set('EmailAccount', secrets.EmailAccount);
    }

});

const activeProtocol = "http://";
console.log(activeProtocol + baseURL);
