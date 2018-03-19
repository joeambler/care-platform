'use strict';
const randomString = require("randomstring");

const pillBoxDevicePermission = {
    type: "device",
    name: "Pill Box"
};

const pillBoxEventPermission = {
    type: "event",
    name: "Opened"
};

const pillBoxDeviceDefinition = {
    type: "Pill Box",
    prototype: JSON.stringify({
        location: "string"
    })
};

module.exports = {
    newUser: {
        name: {
            title: "Dr",
            firstNames: "Grace",
            surnames: "Hopper"
        },
        email: randomString.generate(50) + "@example.com",
        password: "password"
    },

    newClient: {
        name: {
            title: "Mr",
            firstNames: "Client",
            surnames: "Client"
        }
    },

    newEventComponent: {
        type: "event",
        name: "Pill Box"
    },

    newAlertComponent: (endpoint) => {
        return {
            type: "model",
            name: "Echo Component",
            apiEndPoint: endpoint
        }
    },

    newEvent: {
        type: "Opened",
        details: "The pill box was opened",
        deviceInstance: {
            type: "Pill Box",
            properties: JSON.stringify({
                location: "Kitchen"
            })
        }
    },

    pillBoxPermissions: {
        permissions: [
            pillBoxDevicePermission,
            pillBoxEventPermission
        ],
        deviceDefinitions: [
            pillBoxDeviceDefinition
        ]
    },

    eventPermissionsRequested: [
        pillBoxDevicePermission,
        pillBoxEventPermission
    ],

    pillBoxEventPermission: pillBoxEventPermission

};

