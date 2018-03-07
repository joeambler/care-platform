'use strict';

const randomstring = require("randomstring");
const app = require('../src/server.js');

module.exports = {
    executeActions: function executeActions (variables, actions) {
        const currentAction = actions[0];
        if (actions.length === 1) {
            currentAction();
        } else {
            actions.shift();
            currentAction(variables, () => executeActions(variables, actions));
        }
    },

    reqSkeleton: (params) => {
        return {
            swagger: {
                params: params
            },
            app: app
        }
    },

    resSkeleton: (variables, callback) => {
        return {
            status: (status) => {
                variables.responseStatus.push(status);
                return {
                    json: (json) => {
                        variables.responseJSON.push(json);
                    }
                };
            },
            end: callback
        }
    },

    newUser: {
        name: {
            title: "Dr",
            firstNames: "Grace",
            surnames: "Hopper"
        },
        email: randomstring.generate(50) + "@example.com",
        password: "password"
    },

    newClient: {
        name: {
            title: "Mr",
            firstNames: "Client",
            surnames: "Client"
        }
    }

};
