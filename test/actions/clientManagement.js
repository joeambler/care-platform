'use strict';
const ClientController = require('../../src/api/controllers/clients.js');
const UserController = require('../../src/api/controllers/users.js');
const UserManagementActions = require('./userManagement');
const TestVariables = require('../helpers/testVariables');
const HelperFunctions = require('../helpers/helperFunctions.js');

const SilentAction = HelperFunctions.SilentAction;
const RecordedAction = HelperFunctions.RecordedAction;

const client = TestVariables.newClient;
let req = HelperFunctions.reqSkeleton({
    body: {
        value: client
    }
});

module.exports = {
    getTestClient: () => client,

    executeActions: (variables, callback) =>
        HelperFunctions.executeActions(variables, getActions(), callback),

    createClient: createClient,
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
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.postUsersClients(req, req.res));
}

function saveClientIDJsonHandler (json, variables)  {
    variables.clientID = json.id;
}

function getClient(response, callback) {
    req = HelperFunctions.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        }
    });
    req.res = HelperFunctions.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.getClient(req, req.res));
}

function deleteClient(response, callback) {
    req = HelperFunctions.reqSkeleton({
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
