const UserController = require('../src/api/controllers/users.js');
const TestVariables = require('./testVariables.js');

module.exports = {
    setUp: function (callback) {
        this.responseStatus = [];
        this.responseJSON = [];

        const actions = [
            createUser,
            loginUserBadPassword,
            loginUser,
            getUser,
            getUserBadToken,
            changeUserName,
            getUser,
            deleteUser,
            getUser,
            callback
        ];

        executeActions(this, actions);
    },
    tearDown: function (callback) {
        for (let i = 0; i < this.responseJSON.length; i++) {
            console.log("----Action Output " + i + "-----");
            console.log("Status: " + this.responseStatus[i]);
            console.log("Status: " + this.responseJSON[i]);
        }
        callback();
    },
    UserTests: function (test) {
        test.equals(this.responseStatus[0], 201, "User should be created successfully");
        test.equals(this.responseStatus[1], 401, "User shouldn't be able to log in with the wrong password");
        test.equals(this.responseStatus[2], 200, "Login should succeed with correct password");
        test.equals(this.responseJSON[3].email, newUser.email, "The email of the created user should match what was provided");
        test.equals(this.responseStatus[3], 200, "The user should be able to get their details with a valid JWT");
        test.equals(this.responseStatus[4], 401, "If using an invalid JWT, it should return 401 - Unauthorized");
        test.equals(this.responseStatus[5], 200, "User should be able to change their name");
        test.equals(this.responseStatus[6], 200, "The user should be able to get their details with a valid JWT (2)");
        test.equals(this.responseJSON[6].name.firstNames, "Jake", "The name update should be reflected in the next call");
        test.equals(this.responseStatus[7], 200, "The user should be able to delete their account");
        test.notEqual(this.responseStatus[8], 200, "The user should not be able to get account once it has been deleted");
        test.done();
    },
    createUser: createUser,
    loginUser: loginUser,
    deleteUser: deleteUser
};

const newUser = TestVariables.newUser;

const req = TestVariables.reqSkeleton({
    body: {
        value: newUser
    }
});

function executeActions(variables, actions) {
    const currentAction = actions[0];
    if (actions.length === 1) {
        currentAction();
    } else {
        actions.shift();
        currentAction(variables, () => executeActions(variables, actions));
    }
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
    UserController.loginUser(req, TestVariables.resSkeleton(variables, callback));
}

function getUser(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.responseJSON[2].token, () => UserController.getUser(req, req.res));
}

function getUserBadToken(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + "zzaz", () => UserController.getUser(req, req.res));
}

function changeUserName(variables, callback) {
    req.swagger.params.body.value.name.firstNames = "Jake";
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.responseJSON[2].token, () => UserController.updateUser(req, req.res));
}

function deleteUser(variables, callback) {
    req.res = TestVariables.resSkeleton(variables, callback);
    UserController.verifyJWT(req, null, "Bearer " + variables.responseJSON[2].token, () => UserController.deleteUser(req, req.res));
}

