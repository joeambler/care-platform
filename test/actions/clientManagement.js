'use strict';
const ClientController = require('../../src/api/controllers/clients.js');
const UserController = require('../../src/api/controllers/users.js');
const UserManagementActions = require('./userManagement');
const TestVariables = require('../helpers/testVariables');
const HelperFunctions = require('../helpers/helperFunctions.js');

const SilentAction = HelperFunctions.SilentAction;
const RecordedAction = HelperFunctions.RecordedAction;

const client = TestVariables.newClient;

module.exports = {
    getTestClient: () => client,

    executeActions: (variables, callback) =>
        HelperFunctions.executeActions(variables, getActions(), callback),

    createClient: createClient,
    deleteClient: deleteClient,
    saveClientIDJsonHandler: saveClientIDJsonHandler
};

function getActions() {
    return [
        new SilentAction(UserManagementActions.createUser),
        new SilentAction(UserManagementActions.loginUser, UserManagementActions.loginJsonHandler),
        new RecordedAction(createClient, saveClientIDJsonHandler),
        new RecordedAction(getClient),
        new RecordedAction(deleteClient),
        new RecordedAction(getClient),
        new SilentAction(UserManagementActions.deleteUser)
    ]
}

function createClient(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        body: {
            value: client
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.postUsersClients(req, req.res));
}

function saveClientIDJsonHandler (json, variables)  {
    variables.clientID = json.id;
}

function getClient(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.getClient(req, req.res));
}

function deleteClient(response, callback) {
    const req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        body: {
            value: UserManagementActions.getTestUser()
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.deleteClient(req, req.res));
}
