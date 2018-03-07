'use strict';
const ClientController = require('../src/api/controllers/clients.js');
const UserController = require('../src/api/controllers/users.js');
const UserManagementActions = require('./userManagementActions');
const TestVariables = require('./testVariables.js');

const client = TestVariables.newClient;
let req = TestVariables.reqSkeleton({
    body: {
        value: client
    }
});

module.exports = {
    getTestclient: () => client,

    getActions: (finalCallback) => [
        UserManagementActions.createUser,
        UserManagementActions.loginUser,
        createClient,
        getClient,
        deleteClient,
        getClient,
        UserManagementActions.deleteUser,
        finalCallback
    ],

    createClient: createClient
};

function createClient(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, () => saveClientID(variables, callback));
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => ClientController.postUsersClients(req, req.res));
}

function saveClientID(variables, callback){
    const json = variables.responseJSON;
    variables.clientID = json[json.length - 1].id;
    callback();
}

function getClient(variables, callback){
    req = TestVariables.reqSkeleton({
        clientID: {
            value: variables.clientID
        }
    });
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => ClientController.getClient(req, req.res));
}

function deleteClient(variables, callback) {
    req = TestVariables.reqSkeleton({
        clientID: {
            value: variables.clientID
        },
        body: {
            value: UserManagementActions.getTestUser()
        }
    });
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => ClientController.deleteClient(req, req.res));
}
