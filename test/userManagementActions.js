'use strict';
const UserController = require('../src/api/controllers/users.js');
const TestVariables = require('./testVariables.js');

const SilentAction = TestVariables.SilentAction;
const RecordedAction = TestVariables.RecordedAction;

const user = TestVariables.newUser;
const req = TestVariables.reqSkeleton({
    body: {
        value: user
    }
});

module.exports = {
    getTestUser: () => user,

    executeActions: (variables, callback) =>
        TestVariables.executeActions(variables, getActions(callback), callback),

    createUser: createUser,
    loginUser: loginUser,
    deleteUser: deleteUser,
    loginJsonHandler: loginJsonHandler
};

function getActions() {
    return [
        new RecordedAction(createUser),
        new RecordedAction(loginUserBadPassword),
        new RecordedAction(loginUser, loginJsonHandler),
        new RecordedAction(getUser),
        new RecordedAction(getUserBadToken),
        new RecordedAction(changeUserName),
        new RecordedAction(getUser),
        new RecordedAction(deleteUser),
        new RecordedAction(getUser)
    ];
}

function createUser(response, callback) {
    UserController.createUser(req, TestVariables.resSkeleton(response, callback));
}

function loginUserBadPassword(response, callback) {
    req.swagger.params.body.value.password = "notthepassword";
    UserController.loginUser(req, TestVariables.resSkeleton(response, callback));
}

function loginUser(response, callback) {
    req.swagger.params.body.value.password = "password";
    UserController.loginUser(req, TestVariables.resSkeleton(response, callback));
}

function getUser(response, callback) {
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => UserController.getUser(req, req.res));
}

function getUserBadToken(response, callback) {
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + "zzaz", () => UserController.getUser(req, req.res));
}

function changeUserName(response, callback) {
    req.swagger.params.body.value.name.firstNames = "Jake";
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => UserController.updateUser(req, req.res));
}

function deleteUser(response, callback) {
    req.res = TestVariables.resSkeleton(response, callback);
    UserController.verifyJWT(req, null, "Bearer " + response.variables.JWT, () => UserController.deleteUser(req, req.res));
}

function loginJsonHandler (json, variables)  {
    variables.JWT = json.token;
}