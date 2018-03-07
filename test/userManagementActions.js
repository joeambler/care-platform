'use strict';
const UserController = require('../src/api/controllers/users.js');
const TestVariables = require('./testVariables.js');

const user = TestVariables.newUser;
const req = TestVariables.reqSkeleton({
    body: {
        value: user
    }
});

module.exports = {
    getTestUser: () => user,

    executeActions: (variables, callback) =>
        TestVariables.executeActions(variables, getActions(callback)),

    createUser: createUser,
    loginUser: loginUser,
    deleteUser: deleteUser
};

function  getActions (finalCallback) {
    return [
        createUser,
        loginUserBadPassword,
        loginUser,
        getUser,
        getUserBadToken,
        changeUserName,
        getUser,
        deleteUser,
        getUser,
        finalCallback
    ];
}

function createUser(variables, callback) {
    UserController.createUser(req, TestVariables.resSkeleton(variables, callback));
}

function loginUserBadPassword(variables, callback) {
    req.swagger.params.body.value.password = "notthepassword";
    UserController.loginUser(req, TestVariables.resSkeleton(variables, callback));
}

function loginUser(variables, callback) {
    req.swagger.params.body.value.password = "password";
    UserController.loginUser(req, TestVariables.resSkeleton(variables, () =>
        saveJWT(variables, callback)
    ));
}

function getUser(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => UserController.getUser(req, req.res));
}

function getUserBadToken(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + "zzaz", () => UserController.getUser(req, req.res));
}

function changeUserName(variables, callback) {
    req.swagger.params.body.value.name.firstNames = "Jake";
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => UserController.updateUser(req, req.res));
}

function deleteUser(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.JWT, () => UserController.deleteUser(req, req.res));
}

function saveJWT(variables, callback) {
    const json = variables.responseJSON;
    variables.JWT = json[json.length - 1].token;
    callback();
}