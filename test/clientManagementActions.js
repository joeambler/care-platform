'use strict';
const ClientController = require('../src/api/controllers/clients.js');
const UserController = require('../src/api/controllers/users.js');
const UserManagementActions = require('./userManagementActions');
const TestVariables = require('./testVariables.js');

const SilentAction = TestVariables.SilentAction;
const RecordedAction = TestVariables.RecordedAction;

const client = TestVariables.newClient;
let req = TestVariables.reqSkeleton({
    body: {
        value: client
    }
});

module.exports = {
    getTestClient: () => client,

    executeActions: (variables, callback) =>
        TestVariables.executeActions(variables, getActions(), callback),

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
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.postUsersClients(req, req.res));
}

function saveClientIDJsonHandler (json, variables)  {
    variables.clientID = json.id;
}

function getClient(response, callback) {
    req = TestVariables.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        }
    });
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.getClient(req, req.res));
}

function deleteClient(response, callback) {
    req = TestVariables.reqSkeleton({
        clientID: {
            value: response.variables.clientID
        },
        body: {
            value: UserManagementActions.getTestUser()
        }
    });
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => ClientController.deleteClient(req, req.res));
}
