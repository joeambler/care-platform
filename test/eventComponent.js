'use strict';

const HelperFunctions = require('./helpers/helperFunctions.js');
const EventComponentActions = require("./actions/eventComponent.js");

module.exports = {
    setUp: function (callback) {
        EventComponentActions.executeActions(this, callback);
    },
    tearDown: function (callback) {
        HelperFunctions.printResponses(this.responses);
        callback();
    },
    eventComponentTests: function (test) {
        test.done();
    }
};



