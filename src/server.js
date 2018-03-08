'use strict';

const SwaggerExpress = require('swagger-express-mw');
const app = require('express')();
const userContoller = require('./api/controllers/users');
const componentController = require('./api/controllers/components');
const url = require('url');

module.exports = app; // for testing

const config = {
  appRoot: __dirname, // required config
  securityHandlers: {
        userAuth: userContoller.verifyJWT,
        componentAuth: componentController.authenticateComponent
    }
};

const baseURL = process.env.NODE_ENV === 'production'?
    process.env.HOST
    : 'localhost:10010';

//DOCS
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(__dirname + '/api/swagger/swagger.yaml');

swaggerDocument.host = baseURL;

app.use('/spec.json', (req, res) => res.send(swaggerDocument));

app.use('/spec.yaml', (req, res) => res.send("YAML document coming soon."));
//TODO: Impliment YAML spec
//app.use('/spec.yaml', (req, res) => res.send(yaml.dump_all(swaggerDocument)));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => sendHomepage(res));
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
console.log('View Docs at:\t\t' + url.resolve(activeProtocol + baseURL, "/api-docs"));
console.log('Download Spec (JSON):\t' + url.resolve(activeProtocol + baseURL, "/spec.json"));
console.log('Download Spec (YAML):\t' + url.resolve(activeProtocol + baseURL, "/spec.yaml"));
console.log('API endpoint:\t\t' + url.resolve(activeProtocol +baseURL,"/v0"));


function sendHomepage(res) {
    res.send("<h1>Care Platform</h1><h2>View Documentation</h2><a href ="
        + "/api-docs"
        + ">Click here</a><h2>OpenAPI Specification (JSON)</h2><a href ="
        + "/spec.json"
        + ">Click here</a></br>"
        + url.resolve(activeProtocol +baseURL,"/spec.json")
        + "<h2>OpenAPI Specification (YAML) </h2><a href ="
        + "/spec.yaml"
        + ">Click here</a></br>"
        + url.resolve(activeProtocol +baseURL,"/spec.yaml")
        + "<h2>Swagger Editor - Generate SDK using the downloaded specification </h2><a href ="
        + "http://editor.swagger.io"
        + ">Click here</a><h2>API Endpoint </h2>"
        + url.resolve(activeProtocol +baseURL,"/v0"))
}