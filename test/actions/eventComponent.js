'use strict';

const UserManagementActions = require('./userManagement');
const TestVariables = require('../helpers/testVariables');
const HelperFunctions = require('../helpers/helperFunctions.js');
const ClientManagementActions = require("./clientManagement");
const ClientController = require('../../src/api/controllers/clients.js');
const UserController = require('../../src/api/controllers/users.js');
const EventsController = require('../../src/api/controllers/events.js');
const ComponentController = require('../../src/api/controllers/components');
const PermissionsController = require('../../src/api/controllers/permissions');

const SilentAction = HelperFunctions.SilentAction;
const RecordedAction = HelperFunctions.RecordedAction;

const component = TestVariables.newEventComponent;
const event = TestVariables.newEvent;
const pillBoxPermissions = TestVariables.pillBoxPermissions;
const permissionsRequested = TestVariables.permissionsRequested;
module.exports = {
    getTestComponent: () => component,
    getTestEvent: () => event,
    getPermissionsRequested: () => permissionsRequested,

    executeActions: (variables, callback) =>
        HelperFunctions.executeActions(variables, getActions(), callback),

};

function getActions() {
    return [
        new SilentAction(UserManagementActions.createUser),
        new SilentAction(UserManagementActions.loginUser, UserManagementActions.loginJsonHandler),
        new SilentAction(ClientManagementActions.createClient, ClientManagementActions.saveClientIDJsonHandler),
        new RecordedAction(createComponent, componentJsonHandler),
        new RecordedAction(getComponent),
        new RecordedAction(postEventNoKey),
        new RecordedAction(postEvent),
        new RecordedAction(requestPermissions),
        new RecordedAction(postEvent),
        new RecordedAction(getRequestedPermissions),
        new RecordedAction(acceptPermissions),
        new RecordedAction(postEvent),
        new RecordedAction(revokePermissions),
        new RecordedAction(postEvent),
        new RecordedAction(deleteComponent),
        new SilentAction(ClientManagementActions.deleteClient),
        new SilentAction(UserManagementActions.deleteUser)
    ]
}

function createComponent(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        body: {
            value: component
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ComponentController.newComponent(req, req.res));
}

function getComponent(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.componentID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ComponentController.getComponentById(req, req.res));
}

function postEvent(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        body: {
            value: event
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    ComponentController.authenticateComponent(req, null, response.variables.componentKey, () => EventsController.postEvent(req, req.res));
}

function postEventNoKey(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        body: {
            value: event
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    ComponentController.authenticateComponent(req, null, "   ", () => EventsController.postEvent(req, req.res));
}

function requestPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        body: {
            value: pillBoxPermissions
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    ComponentController.authenticateComponent(req, null, response.variables.componentKey, () => PermissionsController.requestPermissions(req, req.res));
}

function deleteComponent(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.componentID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ComponentController.deleteComponentById(req, req.res));
}

function componentJsonHandler (json, variables)  {
    variables.componentID = json.id;
    variables.componentKey = json.key;
}

function getRequestedPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.componentID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.getRequestedPermissions(req, req.res));
}

function acceptPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.componentID
        },
        body: {
            value: permissionsRequested
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.acceptPermissions(req, req.res));
}

function revokePermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.componentID
        },
        body: {
            value: permissionsRequested
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.revokePermissions(req, req.res));
}