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
        test.equals(this.responses[0].status, 201, "Event Component should be created successfully");
        test.equals(this.responses[1].status, 200, "Should be able to get component successfully");
        test.equals(this.responses[1].json.type, EventComponentActions.getTestEventComponent().type, "Component type should match");
        test.equals(this.responses[1].json.name, EventComponentActions.getTestEventComponent().name, "Component name should match");
        test.equals(this.responses[2].status, 401, "No key should return unauthorized");
        test.equals(this.responses[3].status, 401, "No permissions should return unauthorized");
        test.equals(this.responses[4].status, 200, "Permissions should be sent successfully");
        test.equals(this.responses[5].status, 401, "Should not be allowed to use permissions until accepted");
        test.equals(this.responses[6].status, 200, "Should be able to get requested permissions");
        requestedPermissionsMatch(this.responses[6].json, EventComponentActions.getPermissionsRequested()).then(
            match => test.ok(match, "Permissions requested should match")
        );
        test.equals(this.responses[7].status, 200, "Should be able to accept requested permissions");
        test.equals(this.responses[8].status, 201, "Event Component should be created successfully");
        test.equals(this.responses[9].status, 200, "Should be able to accept requested permissions");
        test.equals(this.responses[10].status, 200, "Event should now be posted successfully");
        test.equals(this.responses[11].status, 200, "Should be able to get events");
        eventMatches(this.responses[11].json,EventComponentActions.getTestEventComponent() , EventComponentActions.getTestEvent()).then(
            match => test.ok(match, "Event should be visible to client")
        );
        test.equals(this.responses[12].status, 200, "Should be able to get alerts");
        alertMatches(this.responses[12].json,EventComponentActions.getTestAlertComponent() , EventComponentActions.getTestEvent(), EventComponentActions.getAlertType).then(
            match => test.ok(match, "Alert should be visible to client")
        );
        test.equals(this.responses[13].status, 200, "Should be able to get events for single component");
        test.equals(JSON.stringify(this.responses[13].json), JSON.stringify(this.responses[11].json), "Single component response should be the same as all components (Events)");
        test.equals(this.responses[14].status, 200, "Should be able to get alerts for single component");
        test.equals(JSON.stringify(this.responses[14].json), JSON.stringify(this.responses[12].json), "Single component response should be the same as all components (Events)");
        test.equals(this.responses[15].status, 200, "Should be able to revoke accepted permissions");
        test.equals(this.responses[16].status, 401, "Posting an event should now return unauthorized");
        test.equals(this.responses[17].status, 200, "Event component should be deleted successfully");
        test.equals(this.responses[18].status, 200, "Event component should be deleted successfully");
        test.done();
    }
};

function requestedPermissionsMatch(res, requestedPermissions){
    return new Promise((fulfill) => {
        let match = true;
        res.forEach(p => {
            const has = requestedPermissions.filter(r =>
                r.type === p.type && r.name === p.name
            ).length > 0;
            if (!has) match = false;
        });
        fulfill(match);
    });
}

function eventMatches(res, eventComponent, testEvent){
    return new Promise((fulfill) => {
        let match = true;
        const ev = res[0];
        match = eventComponent.name === ev.component ? match : false;
        match = testEvent.type === ev.type ? match : false;
        match = testEvent.details === ev.details ? match : false;
        match = testEvent.deviceInstance.type === ev.deviceInstance.type ? match : false;
        match = testEvent.deviceInstance.properties === ev.deviceInstance.properties ? match : false;
        fulfill(match);
    });
}

function alertMatches(res, alertComponent, testEvent, alertType){
    return new Promise((fulfill) => {
        let match = true;
        const al = res[0];
        match = alertComponent.name === al.component ? match : false;
        match = alertType === al.type ? match : false;
        match = testEvent.details === al.details ? match : false;
        fulfill(match);
    });
}

