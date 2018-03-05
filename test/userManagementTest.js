const UserController = require('../src/api/controllers/users.js')
const randomstring = require("randomstring");
const app = require('../src/server.js');

module.exports = {
    setUp: function (callback) {
        this.responseStatus = [];
        this.responseJSON = [];

        createUser(this, () =>
            loginUserBadPassword(this, () =>
                loginUser(this, () =>
                    getUser(this, () =>
                        callback()
                    )
                )
            )
        );
    },
    tearDown: function (callback) {
        for (let i = 0; i < this.responseJSON.length; i++) {
            console.log("----Test Output " + i + "-----");
            console.log("Status: " + this.responseStatus[i]);
            console.log("Status: " + this.responseJSON[i]);
        }
        callback();
    },
    UserTests: function (test) {
        test.equals(this.responseStatus[0], 201);
        test.equals(this.responseStatus[1], 401);
        test.equals(this.responseStatus[2], 200);
        test.equals(this.responseJSON[3].email, newUser.email);
        test.equals(this.responseStatus[3], 200);
        test.done();
    }
};

const newUser = {
    name: {
        title: "Dr",
        firstNames: "Grace",
        surnames: "Hopper"
    },
    email: randomstring.generate(50) + "@example.com",
    password: "password"
};

const req = {
    swagger: {
        params: {
            body: {
                value: newUser
            }
        }
    },
    app: app
};

function createUser(variables, callback) {
    UserController.createUser(req, {
        status: (status) => {
            variables.responseStatus.push(status);
            return {
                json: (json) => {
                    variables.responseJSON.push(json);
                }
            };
        },
        end: callback
    });
}

function loginUserBadPassword(variables, callback) {
    req.swagger.params.body.value.password = "notthepassword";
    UserController.loginUser(req, {
        status: (status) => {
            variables.responseStatus.push(status);
            return {
                json: (json) => {
                    variables.responseJSON.push(json);
                }
            };
        },
        end: callback
    });
}

function loginUser(variables, callback) {
    req.swagger.params.body.value.password = "password";
    UserController.loginUser(req, {
        status: (status) => {
            variables.responseStatus.push(status);
            return {
                json: (json) => {
                    variables.responseJSON.push(json);
                }
            };
        },
        end: callback
    });
}

function getUser(variables, callback) {
    req.res = {
        status: (status) => {
            variables.responseStatus.push(status);
            return {
                json: (json) => {
                    variables.responseJSON.push(json);
                    console.log(json);
                }
            };
        },
        end: callback
    };
    UserController.verifyJWT(req, null, "Bearer " + variables.responseJSON[2].token, () => UserController.getUser(req, req.res));
}