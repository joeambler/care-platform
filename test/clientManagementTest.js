'use strict';

const TestVariables = require('./testVariables.js');
const ClientManagementActions = require('./clientManagementActions.js');

module.exports = {
    setUp: function (callback) {
        this.responseStatus = [];
        this.responseJSON = [];

        TestVariables.executeActions(this, ClientManagementActions.getActions(callback));
    },
    tearDown: function (callback) {
        for (let i = 0; i < this.responseJSON.length; i++) {
            console.log("----Action Output " + i + "-----");
            console.log("Status: " + this.responseStatus[i]);
            console.log("Status: " + this.responseJSON[i]);
        }
        callback();
    },
    clientTests: function (test) {
        test.equals(this.responseStatus[2], 201, "Client should be created successfully");
        test.equals(this.responseStatus[3], 200, "Client be gettable");
        test.equals(this.responseJSON[3].name.firstNames, ClientManagementActions.getTestclient().name.firstNames,
            "Client return should match what was posted");
        test.equals(this.responseStatus[4], 200, "Client should be deleted successfully");
        test.equals(this.responseStatus[5], 404, "Deleted client should not be 404-Not found");
        test.done();
    }
};



