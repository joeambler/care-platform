'use strict'

const SwaggerExpress = require('swagger-express-mw')
const app = require('express')()
const userController = require('./api/controllers/users')
const componentController = require('./api/controllers/components')
const demoClient = require('./democlient/client')
const pug = require('pug')
const fs = require('fs')
const YAML = require('yamljs')
const bodyParser = require('body-parser')
const activeProtocol = 'http://'
app.use(bodyParser.json())

const baseURL = process.env.NODE_ENV === 'production' ? process.env.HOST
  : 'localhost:10010'

app.set('currentEndpoint', activeProtocol + baseURL + '/v0')

module.exports = app // for testing

const config = {
  appRoot: __dirname, // required config
  securityHandlers: {
    userAuth: userController.verifyJWT,
    componentAuth: componentController.authenticateComponent,
  },
}
const specPath = __dirname + '/api/swagger/swagger.yaml'
const serviceSpecPath = __dirname + '/serviceComponent/swagger/swagger.yaml'

//DOCS
serveUI(specPath, baseURL, '', true)
serveUI(serviceSpecPath, baseURL, '/serviceComponent')
//END DOCS

app.use('/democlient', (req, res) => demoClient.getUI(res))

app.get('/', (req, res) => res.send(
  pug.renderFile('./src/views/index.pug', {url: activeProtocol + baseURL})))

SwaggerExpress.create(config, function (err, swaggerExpress) {
  if (err) {
    throw err
  }

  // install middleware
  swaggerExpress.register(app)

  const port = process.env.PORT || 10010
  app.listen(port)

  if (process.env.SECRET) {
    app.set('JWTSecret', process.env.SECRET)
  } else {
    const secrets = require('./config/appsecrets')
    app.set('JWTSecret', secrets.JWTSecret)
  }

  if (process.env.EMAIL) {
    app.set('EmailAccount', {
      'server': process.env.EMAILSERVER,
      'email': process.env.EMAIL,
      'password': process.env.EMAILPASSWORD,
    })
  } else {
    const secrets = require('./config/appsecrets')
    app.set('EmailAccount', secrets.EmailAccount)
  }

})

app.post('/serviceComponent/v0/events',
  (req, res) => require('./serviceComponent/echo').postEvent(req, res))

console.log(activeProtocol + baseURL)

function serveUI (specPath, baseURL, url, setupUI) {
  let swaggerDocument = YAML.load(specPath)
  swaggerDocument.host = baseURL

  if (setupUI){
    const swaggerUi = require('swagger-ui-express')
    app.use(url + '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  }

  app.use(url + '/spec.json', (req, res) => res.json(swaggerDocument))
  app.use(url + '/spec.yaml', (req, res) => {
    fs.readFile(specPath, 'utf8', function (err, contents) {
      res.type('text/plain')
      res.send(contents.replace('localhost:10010', baseURL))
    })
  })
}