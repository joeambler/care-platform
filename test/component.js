'use strict';

const HelperFunctions = require('./helpers/helperFunctions.js');
const EventComponentActions = require("./actions/component.js");

module.exports = {
    setUp: function (callback) {
        EventComponentActions.executeActions(this, callback);
    },
    tearDown: function (callback) {
        HelperFunctions.printResponses(this.responses);
        callback();
    },
    componentTests: function (test) {
        test.equals(this.responses[0].status, 201, "Component should be created successfully");
        test.equals(this.responses[1].status, 200, "Should be able to get component successfully");
        test.equals(this.responses[1].json.type, EventComponentActions.getTestEventComponent().type, "Component type should match");
        test.equals(this.responses[1].json.name, EventComponentActions.getTestEventComponent().name, "Component name should match");
        test.equals(this.responses[2].status, 401, "No key should return unauthorized");
        test.equals(this.responses[3].status, 401, "No permissions should return unauthorized");
        test.equals(this.responses[4].status, 200, "Permissions should be sent successfully");
        test.equals(this.responses[5].status, 401, "Should not be allowed to use permissions until accepted");
        test.equals(this.responses[6].status, 200, "Should be able to get requested permissions");
        let match = true;
        const rp = EventComponentActions.getPermissionsRequested();
        console.log(rp);
        this.responses[6].json.forEach(p => {
            let has = false;
            rp.forEach(r => {
                if (r.type === p.type && r.name === p.name) has = true;
            });
            if (!has) match = false;
        });
        test.ok(match, "Permissions requested should match");
        test.equals(this.responses[7].status, 200, "Should be able to accept requested permissions");

        test.equals(this.responses[10].status, 200, "Event should now be posted successfully");
        test.equals(this.responses[11].status, 200, "Should be able to revoke accepted permissions");
        test.equals(this.responses[12].status, 401, "Posting an event should now return unauthorized");
        test.equals(this.responses[13].status, 200, "Event component should be deleted successfully");
        test.equals(this.responses[14].status, 200, "Event component should be deleted successfully");
        test.done();
    }
};



