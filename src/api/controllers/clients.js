'use strict'

const models = require('../models/index')
const userController = require('./users')
const randomstring = require('randomstring')

module.exports = {
  getUsersClients: getUsersClients,
  postUsersClients: postUsersClients,
  deleteUserClient: deleteUserClient,
  getClient: getClient,
  updateClient: updateClient,
  deleteClient: deleteClient,
  shareClient: shareClient,
  acceptClient: acceptClient,
  getUsersClientsTentative: getUsersClientsTentative,
}

function getUsersClients (req, res) {
  return fetchUsersClients(req, res, false)
}

function getUsersClientsTentative (req, res) {
  return fetchUsersClients(req, res, true)
}

function fetchUsersClients (req, res, tentative) {
  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  req.User.getClients({
    through: {where: {tentative: tentative}},
    include: [{model: models.Name, as: 'name'}],
  }).then(clients => {
    let jsonclients = []
    for (let i = 0; i < clients.length; i++) {
      jsonclients[i] = {
        id: clients[i].id,
        name: {
          title: clients[i].name.title,
          firstNames: clients[i].name.firstNames,
          surnames: clients[i].name.surnames,
        },
      }
    }
    res.status(200).json(jsonclients)
  }, serverError)
}

function postUsersClients (req, res) {
  let user = req.User
  const body = req.swagger.params.body.value

  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const success = (client, name) => {
    res.status(201).json({
      id: client.id,
      name: {
        title: name.title,
        firstNames: name.firstNames,
        surnames: name.surnames,
      },
    })
  }

  const createClient = name => {
    return models.Client.create({
      nameId: name.id,
    })
  }

  const linkClient = client => {
    return user.addClient(client, {through: {admin: true, tentative: false}})
  }

  const createName = name => {
    return models.Name.create({
      title: name.title,
      firstNames: name.firstNames,
      surnames: name.surnames,
    })
  }

  createName(body.name).then(name => {
    createClient(name).then(client => {
      linkClient(client).then(() => {
        success(client, name)
      }, serverError)
    }, serverError)
  }, serverError)

}

function deleteUserClient (req, res) {
  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  const unauthorizedError = () => {
    console.log('Invalid password supplied')
    res.status(401).json()
  }

  const payload = () => {
    const clientId = req.swagger.params.clientID.value
    const user = req.User

    user.getClients().then((clients) => {
      let client = clients.find(e => {
        return e.id === clientId
      })
      if (client == null) return notFoundError(
        'User does have a client with this ID')

      client.getUsers().then(users => {
        if (users.length < 2) {
          client.destroy()
        }
        // noinspection Annotator
        user.removeClient(client).then(() => {
          req.res.status(200).json()
        }, notFoundError)
      }, notFoundError)
    }, notFoundError)
  }

  const body = req.swagger.params.body.value
  userController.validCredentials(body.email, body.password, payload,
    unauthorizedError, notFoundError)
}

function getClient (req, res) {
  const clientId = req.swagger.params.clientID.value
  const user = req.User

  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  user.getClients().then((clients) => {
    let client = clients.find(e => {
      return e.id === clientId
    })
    if (client == null) return notFoundError(
      'User does have a client with this ID')
    client.getName().then(name => {
      res.status(200).json({
        id: client.id,
        name: {
          title: name.title,
          firstNames: name.firstNames,
          surnames: name.surnames,
        },
      })
    }, serverError)
  }, notFoundError)

}

function updateClient (req, res) {
  const clientId = req.swagger.params.clientID.value
  const user = req.User
  const body = req.swagger.params.body.value

  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  const notAuthorizedError = () => {
    res.status(401).json()
  }

  user.getClients().then((clients) => {
    let client = clients.find(e => {
      return e.id === clientId
    })

    if (client == null) return notFoundError(
      'User does have a client with this ID')
    if (!client.UserClient.admin) return notAuthorizedError()
    client.getName().then(name => {
      name.firstNames = body.name.firstNames
      name.surnames = body.name.surnames
      name.title = body.name.title
      name.save().then(() => {
        res.status(200).json()
      }, serverError)
    }, serverError)
  }, notFoundError)
}

function deleteClient (req, res) {
  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  const unauthorizedError = () => {
    res.status(401).json()
  }

  const payload = () => {
    const clientId = req.swagger.params.clientID.value
    const user = req.User

    user.getClients().then((clients) => {
      let client = clients.find(e => {
        return e.id === clientId
      })

      if (client == null) return notFoundError(
        'User does have a client with this ID')
      if (!client.UserClient.admin) return unauthorizedError()

      client.setUsers([]).then(() => {
        client.destroy().then(() => {
          res.status(200).json()
        }, serverError)
      }, serverError)
    }, notFoundError)
  }

  const body = req.swagger.params.body.value
  userController.validCredentials(body.email, body.password, payload,
    unauthorizedError, notFoundError)
}

function shareClient (req, res) {
  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  const unauthorizedError = () => {
    res.status(401).json()
  }

  const body = req.swagger.params.body.value
  const emailToShareWith = body.email
  const admin = body.admin
  const clientId = req.swagger.params.clientID.value
  const user = req.User

  user.getClients().then((clients) => {
    let client = clients.find(e => {
      return e.id === clientId
    })

    if (client == null) return notFoundError(
      'User does have a client with this ID')
    if (!client.UserClient.admin) return unauthorizedError()

    models.User.findOne({where: {email: emailToShareWith}}).
      then(userToShareWith => {
        if (userToShareWith == null) return notFoundError()

        userToShareWith.addClient(client,
          {through: {tentative: true, admin: admin}}).then(() => {
          res.status(200).json()
        }, serverError)
      }, notFoundError)
  }, notFoundError)
}

function acceptClient (req, res) {
  const serverError = (reason) => {
    console.log(reason)
    res.status(500).json()
  }

  const notFoundError = (reason) => {
    console.log(reason)
    res.status(404).json()
  }

  const clientId = req.swagger.params.clientID.value
  const user = req.User

  user.getClients().then((clients) => {
    let client = clients.find(e => {
      return e.id === clientId
    })

    if (client == null) return notFoundError(
      'User does have a client with this ID')
    if (!client.UserClient.tentative) return notFoundError(
      'Client is already confirmed')

    client.UserClient.tentative = false
    client.UserClient.save().then(() => res.status(200).json(), serverError)
  }, notFoundError)
}