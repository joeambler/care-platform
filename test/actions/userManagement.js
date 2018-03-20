'use strict'
const UserController = require('../../src/api/controllers/users')
const TestVariables = require('../helpers/testVariables')
const HelperFunctions = require('../helpers/helperFunctions')

const RecordedAction = HelperFunctions.RecordedAction

const user = TestVariables.newUser

module.exports = {
  getTestUser: () => user,

  executeActions: (variables, callback) =>
    HelperFunctions.executeActions(variables, getActions(callback), callback),

  createUser: createUser,
  loginUser: loginUser,
  deleteUser: deleteUser,
  loginJsonHandler: loginJsonHandler,
}

function getActions () {
  return [
    new RecordedAction(createUser),
    new RecordedAction(loginUserBadPassword),
    new RecordedAction(loginUser, loginJsonHandler),
    new RecordedAction(getUser),
    new RecordedAction(getUserBadToken),
    new RecordedAction(changeUserName),
    new RecordedAction(getUser),
    new RecordedAction(deleteUser),
    new RecordedAction(getUser),
  ]
}

function createUser (response, callback) {
  const req = HelperFunctions.reqSkeleton({
    body: {
      value: user,
    },
  })
  UserController.createUser(req,
    HelperFunctions.resSkeleton(response, callback))
}

function loginUserBadPassword (response, callback) {
  const req = HelperFunctions.reqSkeleton({
    body: {
      value: user,
    },
  })
  req.swagger.params.body.value.password = 'notthepassword'
  UserController.loginUser(req,
    HelperFunctions.resSkeleton(response, callback))
}

function loginUser (response, callback) {
  const req = HelperFunctions.reqSkeleton({
    body: {
      value: user,
    },
  })
  req.swagger.params.body.value.password = 'password'
  UserController.loginUser(req,
    HelperFunctions.resSkeleton(response, callback))
}

function getUser (response, callback) {
  const req = HelperFunctions.reqSkeleton({})
  req.res = HelperFunctions.resSkeleton(response, callback)
  UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
    () => UserController.getUser(req, req.res))
}

function getUserBadToken (response, callback) {
  const req = HelperFunctions.reqSkeleton({})
  req.res = HelperFunctions.resSkeleton(response, callback)
  UserController.verifyJWT(req, null, 'Bearer ' + 'zzaz',
    () => UserController.getUser(req, req.res))
}

function changeUserName (response, callback) {
  const req = HelperFunctions.reqSkeleton({
    body: {
      value: user,
    },
  })
  req.swagger.params.body.value.name.firstNames = 'Jake'
  req.res = HelperFunctions.resSkeleton(response, callback)
  UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
    () => UserController.updateUser(req, req.res))
}

function deleteUser (response, callback) {
  const req = HelperFunctions.reqSkeleton({
    body: {
      value: user,
    },
  })
  req.res = HelperFunctions.resSkeleton(response, callback)
  UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
    () => UserController.deleteUser(req, req.res))
}

function loginJsonHandler (json, variables) {
  variables.JWT = json.token
}