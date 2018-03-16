'use strict';

const HelperFunctions = require('./helpers/helperFunctions.js');
const ClientManagementActions = require('./actions/clientManagement.js');

module.exports = {
    setUp: function (callback) {
        ClientManagementActions.executeActions(this, callback);
    },
    tearDown: function (callback) {
        HelperFunctions.printResponses(this.responses);
        callback();
    },
    clientTests: function (test) {
        test.equals(this.responses[0].status, 201, "Client should be created successfully");
        test.equals(this.responses[1].status, 200, "Client be gettable");
        // noinspection Annotator
        test.equals(this.responses[1].json.name.firstNames, ClientManagementActions.getTestClient().name.firstNames,
            "Client return should match what was posted");
        test.equals(this.responses[2].status, 200, "Client should be deleted successfully");
        test.equals(this.responses[3].status, 404, "Deleted client should not be 404-Not found");
        test.done();
    }
};



