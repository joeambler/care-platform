'use strict';

const UserManagementActions = require('./userManagement');
const TestVariables = require('../helpers/testVariables');
const HelperFunctions = require('../helpers/helperFunctions.js');
const ClientManagementActions = require("./clientManagement");

const SilentAction = HelperFunctions.SilentAction;
const RecordedAction = HelperFunctions.RecordedAction;

const component = TestVariables.newEventComponent;
let req = HelperFunctions.reqSkeleton({
    body: {
        value: component
    }
});

module.exports = {
    getTestComponent: () => component,

    executeActions: (variables, callback) =>
        HelperFunctions.executeActions(variables, getActions(), callback),

};

function getActions() {
    return [
        new SilentAction(UserManagementActions.createUser),
        new SilentAction(UserManagementActions.loginUser, UserManagementActions.loginJsonHandler),
        new SilentAction(ClientManagementActions.createClient, ClientManagementActions.saveClientIDJsonHandler),
        new SilentAction(ClientManagementActions.deleteClient),
        new SilentAction(UserManagementActions.deleteUser)
    ]
}
