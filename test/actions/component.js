'use strict'

const UserManagementActions = require('./userManagement')
const TestVariables = require('../helpers/testVariables')
const HelperFunctions = require('../helpers/helperFunctions')
const ClientManagementActions = require('./clientManagement')
const UserController = require('../../src/api/controllers/users')
const EventsController = require('../../src/api/controllers/events')
const AlertsController = require('../../src/api/controllers/alerts')
const ComponentController = require('../../src/api/controllers/components')
const PermissionsController = require('../../src/api/controllers/permissions')
const EchoServiceComponent = require('../../src/serviceComponent/echo')
const url = require('url')

const SilentAction = HelperFunctions.SilentAction
const RecordedAction = HelperFunctions.RecordedAction

const event = TestVariables.newEvent
const pillBoxPermissions = TestVariables.pillBoxPermissions

const currentEndpoint = require('../../src/server').get('currentEndpoint')

module.exports = {
  getTestEventComponent: () => eventComponent.object,
  getTestEvent: () => event,
  getTestAlertComponent: () => alertComponent.object,
  getAlertType: 'Echo',
  getPermissionsRequested: () => pillBoxPermissions.permissionsOnly,

  executeActions: (variables, callback) =>
    HelperFunctions.executeActions(variables, getActions(), callback),
}

function getActions () {
  return [
    new SilentAction(UserManagementActions.createUser),
    new SilentAction(UserManagementActions.loginUser,
      UserManagementActions.loginJsonHandler),
    new SilentAction(ClientManagementActions.createClient,
      ClientManagementActions.saveClientIDJsonHandler),
    new RecordedAction(eventComponent.create, eventComponent.jsonHandler),
    new RecordedAction(eventComponent.get),
    new RecordedAction(eventComponent.postEventNoKey),
    new RecordedAction(eventComponent.postEventWithKey),
    new RecordedAction(eventComponent.requestPermissions),
    new RecordedAction(eventComponent.postEventWithKey),
    new RecordedAction(eventComponent.getRequestedPermissions),
    new RecordedAction(eventComponent.acceptPermissions),
    new RecordedAction(alertComponent.create, alertComponent.jsonHandler),
    new SilentAction(alertComponent.triggerPermissionsRequest),
    new SilentAction(pause),
    new RecordedAction(alertComponent.acceptPermissions),
    new RecordedAction(eventComponent.postEventWithKey),
    new SilentAction(pause),
    new RecordedAction(client.getEvents),
    new RecordedAction(client.getAlerts),
    new RecordedAction(
      (response, callback) => client.getEventsFromComponent(response, callback,
        response.variables.eventComponent.id)),
    new RecordedAction(
      (response, callback) => client.getAlertsFromComponent(response, callback,
        response.variables.alertComponent.id)),
    new RecordedAction(eventComponent.revokePermissions),
    new RecordedAction(eventComponent.postEventWithKey),
    new RecordedAction(eventComponent.delete),
    new RecordedAction(alertComponent.delete),
    new SilentAction(ClientManagementActions.deleteClient),
    new SilentAction(UserManagementActions.deleteUser),
  ]
}

function pause (response, callback) {
  console.log('Pausing...')
  setTimeout(callback, 1000)
}

const eventComponent = {
  object: TestVariables.newEventComponent,
  create: (response, callback) => component.create(response, callback,
    eventComponent.object),
  get: (response, callback) => component.get(response, callback,
    response.variables.eventComponent.id),
  delete: (response, callback) => component.delete(response, callback,
    response.variables.eventComponent.id),
  postEventWithKey: (response, callback) => eventComponent.postEvent(response,
    callback, response.variables.eventComponent.key),
  postEventNoKey: (response, callback) => eventComponent.postEvent(response,
    callback, ''),
  postEvent: (response, callback, key) => {
    const req = HelperFunctions.reqSkeleton({
      body: {
        value: event,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    ComponentController.authenticateComponent(req, null, key,
      () => EventsController.postEvent(req, req.res))
  },
  requestPermissions: (response, callback) => {
    const req = HelperFunctions.reqSkeleton({
      body: {
        value: pillBoxPermissions.withDeviceDefinitions,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    ComponentController.authenticateComponent(req, null,
      response.variables.eventComponent.key,
      () => PermissionsController.requestPermissions(req, req.res))
  },
  getRequestedPermissions: (
    response, callback) => component.getRequestedPermissions(response, callback,
    response.variables.eventComponent.id),
  jsonHandler: (json, variables) => {
    variables.eventComponent = {
      id: json.id,
      key: json.key,
    }
  },
  acceptPermissions: (response, callback) => component.acceptPermissions(
    response, callback, response.variables.eventComponent.id,
    pillBoxPermissions.permissionsOnly),
  revokePermissions: (response, callback) => component.revokePermissions(
    response, callback, response.variables.eventComponent.id,
    pillBoxPermissions.permissionsOnly),
}

const alertComponent = {
  object: TestVariables.newAlertComponent(
    url.resolve(currentEndpoint, '../serviceComponent/v0')),
  create: (response, callback) => component.create(response, callback,
    alertComponent.object),
  delete: (response, callback) => component.delete(response, callback,
    response.variables.alertComponent.id),
  get: (response, callback) => component.get(response, callback,
    response.variables.alertComponent.id),
  getRequestedPermissions: (
    response, callback) => component.getRequestedPermissions(response, callback,
    response.variables.alertComponent.id),
  jsonHandler: (json, variables) => {
    variables.alertComponent = {
      id: json.id,
      key: json.key,
    }
  },
  acceptPermissions: (response, callback) => component.acceptPermissions(
    response, callback, response.variables.alertComponent.id,
    response.variables.alertComponent.permissionsRequested),
  revokePermissions: (response, callback) => component.revokePermissions(
    response, callback, response.variables.alertComponent.id,
    response.variables.alertComponent.permissionsRequested),
  triggerPermissionsRequest: (response, callback) => {
    EchoServiceComponent.requestPermissions(
      response.variables.alertComponent.key,
      pillBoxPermissions.pillBoxEventPermission, pr => {
        response.variables.alertComponent.permissionsRequested = pr
        callback()
      })
  },
}

const component = {
  create: (response, callback, component) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      body: {
        value: component,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => ComponentController.newComponent(req, req.res))
  },
  get: (response, callback, componentID) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => ComponentController.getComponentById(req, req.res))
  },
  delete: (response, callback, eventComponentID) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: eventComponentID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => ComponentController.deleteComponentById(req, req.res))
  },
  getRequestedPermissions: (response, callback, componentID) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => PermissionsController.getRequestedPermissions(req, req.res))
  },
  acceptPermissions: (
    response, callback, componentID, permissionsRequested) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
      body: {
        value: permissionsRequested,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => PermissionsController.acceptPermissions(req, req.res))
  },
  revokePermissions: (response, callback, componentID, permissions) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
      body: {
        value: permissions,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => PermissionsController.revokePermissions(req, req.res))
  },
}

const client = {
  getEvents: (response, callback) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => EventsController.getAllEvents(req, req.res))
  },
  getEventsFromComponent: (response, callback, componentID) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => EventsController.getComponentEvents(req, req.res))
  },
  getAlerts: (response, callback) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => AlertsController.getAllAlerts(req, req.res))
  },
  getAlertsFromComponent: (response, callback, componentID) => {
    const req = HelperFunctions.reqSkeleton({
      clientID: {
        value: response.variables.clientID,
      },
      componentID: {
        value: componentID,
      },
    })
    req.res = HelperFunctions.resSkeleton(response, callback)
    UserController.verifyJWT(req, null, 'Bearer ' + response.variables.JWT,
      () => AlertsController.getComponentAlerts(req, req.res))
  },
}