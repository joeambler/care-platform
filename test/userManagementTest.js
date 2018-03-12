'use strict';

const TestVariables = require('./testVariables.js');
const UserManagementActions = require('./userManagementActions.js');

module.exports = {
    setUp: function (callback) {
        UserManagementActions.executeActions(this, callback);
    },
    tearDown: function (callback) {
        TestVariables.printResponses(this.responses);
        callback();
    },
    UserTests: function (test) {
        test.equals(this.responses[0].status, 201, "User should be created successfully");
        test.equals(this.responses[1].status, 401, "User shouldn't be able to log in with the wrong password");
        test.equals(this.responses[2].status, 200, "Login should succeed with correct password");
        test.equals(this.responses[3].json.email, UserManagementActions.getTestUser().email, "The email of the created user should match what was provided");
        test.equals(this.responses[3].status, 200, "The user should be able to get their details with a valid JWT");
        test.equals(this.responses[4].status, 401, "If using an invalid JWT, it should return 401 - Unauthorized");
        test.equals(this.responses[5].status, 200, "User should be able to change their name");
        test.equals(this.responses[6].status, 200, "The user should be able to get their details with a valid JWT (2)");
        test.equals(this.responses[6].json.name.firstNames, "Jake", "The name update should be reflected in the next call");
        test.equals(this.responses[7].status, 200, "The user should be able to delete their account");
        test.notEqual(this.responses[8].status, 200, "The user should not be able to get account once it has been deleted");
        test.done();
    }
};



