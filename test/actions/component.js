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
const EchoServiceComponent = require('../../src/serviceComponent/echo');
const url = require('url');

const SilentAction = HelperFunctions.SilentAction;
const RecordedAction = HelperFunctions.RecordedAction;

const eventComponent = TestVariables.newEventComponent;
const event = TestVariables.newEvent;
const pillBoxPermissions = TestVariables.pillBoxPermissions;
const eventPermissionsRequested = TestVariables.eventPermissionsRequested;
const pillBoxEventPermission = TestVariables.pillBoxEventPermission;

const currentEndpoint = require('../../src/server').get('currentEndpoint');
const alertComponent = TestVariables.newAlertComponent(url.resolve(currentEndpoint, '../serviceComponent/v0'));

module.exports = {
    getTestEventComponent: () => eventComponent,
    getTestEvent: () => event,
    getPermissionsRequested: () => eventPermissionsRequested,

    executeActions: (variables, callback) =>
        HelperFunctions.executeActions(variables, getActions(), callback),
};

function getActions() {
    return [
        new SilentAction(UserManagementActions.createUser),
        new SilentAction(UserManagementActions.loginUser, UserManagementActions.loginJsonHandler),
        new SilentAction(ClientManagementActions.createClient, ClientManagementActions.saveClientIDJsonHandler),
        new RecordedAction(createEventComponent, eventComponentJsonHandler),
        new RecordedAction(getComponent),
        new RecordedAction(postEventNoKey),
        new RecordedAction(postEvent),
        new RecordedAction(requestEventPermissions),
        new RecordedAction(postEvent),
        new RecordedAction(getRequestedEventPermissions),
        new RecordedAction(acceptEventPermissions),
        //BEGIN ADDED
        new RecordedAction(createAlertComponent, alertComponentJsonHandler),
        new SilentAction(triggerServiceClientPermissionsRequest),
        new RecordedAction(acceptAlertPermissions),
        //END ADDED
        new RecordedAction(postEvent),
        new SilentAction(pause),
        //GET EVENT
        //GET ECHO
        new RecordedAction(revokeEventPermissions),
        new RecordedAction(postEvent),
        new RecordedAction(deleteEventComponent),
        new SilentAction(ClientManagementActions.deleteClient),
        new SilentAction(UserManagementActions.deleteUser)
    ]
}

function pause(response, callback){
    console.log("Pausing");
    setTimeout(callback,3000);
}

function createEventComponent(response, callback){
    createComponent(response, callback, eventComponent)
}

function createAlertComponent(response, callback){
    createComponent(response, callback, alertComponent)
}

function createComponent(response, callback, component) {
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
            value: response.variables.eventComponentID
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
    ComponentController.authenticateComponent(req, null, response.variables.eventComponentKey, () => EventsController.postEvent(req, req.res));
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

function requestEventPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        body: {
            value: pillBoxPermissions
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    ComponentController.authenticateComponent(req, null, response.variables.eventComponentKey, () => PermissionsController.requestPermissions(req, req.res));
}

function deleteEventComponent(response, callback) {
    deleteComponent(response, callback, response.variables.eventComponentID);
}

function deleteAlertComponent(response, callback) {
    deleteComponent(response, callback, response.variables.alertComponentID);
}

function deleteComponent(response, callback, eventComponentID) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: eventComponentID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ComponentController.deleteComponentById(req, req.res));
}

function eventComponentJsonHandler (json, variables)  {
    variables.eventComponentID = json.id;
    variables.eventComponentKey = json.key;
}

function alertComponentJsonHandler (json, variables)  {
    variables.alertComponentID = json.id;
    variables.alertComponentKey = json.key;
}

function getRequestedEventPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.eventComponentID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.getRequestedPermissions(req, req.res));
}

function acceptEventPermissions(response, callback) {
    acceptPermissions(response, callback, response.variables.eventComponentID, eventPermissionsRequested)
}

function acceptAlertPermissions(response, callback) {
    acceptPermissions(response, callback, response.variables.alertComponentID, response.variables.alertPermissionsRequested)
}

function acceptPermissions(response, callback, componentID, permissionsRequested) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: componentID
        },
        body: {
            value: permissionsRequested
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.acceptPermissions(req, req.res));
}

function revokeEventPermissions(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        componentID: {
            value: response.variables.eventComponentID
        },
        body: {
            value: eventPermissionsRequested
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => PermissionsController.revokePermissions(req, req.res));
}

function triggerServiceClientPermissionsRequest(response, callback){
    EchoServiceComponent.requestPermissions(response.variables.alertComponentKey, pillBoxEventPermission, pr => {
        response.variables.alertPermissionsRequested = pr;
        setTimeout(callback, 3000);
    });
}