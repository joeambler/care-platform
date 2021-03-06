'use strict'

const models = require('../models/index')
const randomstring = require('randomstring')

module.exports = {
  newComponent: newComponent,
  authenticateComponent: authenticateComponent,
  getComponents: getComponents,
  getComponentById: getComponentById,
  deleteComponentById: deleteComponentById,
}

function newComponent (req, res) {
  const body = req.swagger.params.body.value
  const clientId = req.swagger.params.clientID.value
  const user = req.User

  const key = randomstring.generate(100)

  const serverError = (err) => {
    console.log('Cannot add: ' + err)
    res.status(500).json()
  }

  const notFoundError = () => {
    console.log('Client not found')
    res.status(404).json()
  }

  const componentData = {
    key: key,
    type: body.type,
    name: body.name,
    apiEndPoint: body.apiEndPoint,
  }

  user.getClients({where: {id: clientId}, through: {where: {admin: true}}}).
    then(clients => {
      if (clients.length < 1) return notFoundError()
      const client = clients[0]

      models.ClientComponent.create(componentData).then((component) => {
        console.log(client)
        component.setClient(client).then(() => {
          componentData.id = component.id
          componentData.client = client.id
          res.status(201).json(componentData)
        }, serverError)
      }, serverError)
    }, serverError)
}

function getComponents (req, res) {
  const clientId = req.swagger.params.clientID.value
  const user = req.User

  const serverError = (err) => {
    console.log('Cannot add: ' + err)
    res.status(500).json()
  }

  const notFoundError = () => {
    console.log('Client not found')
    res.status(404).json()
  }

  user.getClients({where: {id: clientId}, through: {where: {admin: true, tentative:false}}}).
    then(clients => {
      if (clients.length < 1) return notFoundError()
      clients[0].getComponents(
        {attributes: ['id', 'name', 'apiEndPoint', 'key', 'type']}).
        then((components) => {
          const componentObjects = []
          components.forEach(m => {
            componentObjects.push(m.get({plain: true}))
          })
          res.status(200).json(componentObjects)
        }, serverError)
    }, serverError)
}

function getComponentById (req, res) {
  const clientId = req.swagger.params.clientID.value
  const componentID = req.swagger.params.componentID.value
  const user = req.User

  const serverError = (err) => {
    console.log('Cannot add: ' + err)
    res.status(500).json()
  }

  const notFoundError = () => {
    res.status(404).json()
  }

  // noinspection Annotator
  user.getClients({where: {id: clientId}, through: {where: {admin: true, tentative:false}}}).
    then(clients => {
      if (clients.length < 1) return notFoundError()
      clients[0].getComponents({
        attributes: ['id', 'name', 'apiEndPoint', 'key', 'type'],
        where: {id: componentID},
      }).then(components => {
        if (components.length < 1) {
          return notFoundError()
        }
        res.status(200).json(components[0].get({plain: true}))
      }, serverError)
    }, serverError)
}

function deleteComponentById (req, res) {
  const clientId = req.swagger.params.clientID.value
  const componentID = req.swagger.params.componentID.value
  const user = req.User

  const serverError = (err) => {
    console.log('Cannot add: ' + err)
    res.status(500).json()
  }

  const notFoundError = () => {
    res.status(404).json()
  }

  user.getClients({where: {id: clientId}, through: {where: {admin: true, tentative:false}}}).
    then(clients => {
      if (clients.length < 1) return notFoundError()
      clients[0].getComponents({where: {id: componentID}}).then(components => {
        if (components.length < 1) {
          return notFoundError()
        }
        components[0].destroy()
        res.status(200).json()
      }, serverError)
    }, serverError)
}

function authenticateComponent (req, authOrSecDef, scopesOrApiKey, callback) {
  const unauthorizedCallback = (reason) => {
    console.log(reason)
    req.res.status(401).json()
  }

  if (!scopesOrApiKey) {
    return unauthorizedCallback('No value supplied')
  }

  models.ClientComponent.findOne({where: {key: scopesOrApiKey}}).
    then(component => {
      if (component == null) {
        return unauthorizedCallback('Key does not match')
      }
      else {
        req.Component = component
        callback()
      }
    }, unauthorizedCallback)

}