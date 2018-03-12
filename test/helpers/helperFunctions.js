'use strict';

const app = require('../../src/server.js');

module.exports = {
    executeActions: function executeActions(variables, actions, finalCallback) {
        variables.responses = variables.responses === undefined ? [] : variables.responses;

        const currentAction = actions[0];
        if (actions.length === 0) {
            finalCallback();
        } else {
            actions.shift();
            const response = new Response(variables, currentAction.jsonHandler);
            if (currentAction.record) {
                variables.responses.push(response)
            }
            currentAction.action(response, () => executeActions(variables, actions, finalCallback));
        }
    },

    RecordedAction: function (func, jsonHandler) {
        this.action = func;
        this.record = true;
        this.jsonHandler = jsonHandler === undefined ? (json) => {} : jsonHandler;
    },

    SilentAction: function (func, jsonHandler) {
        this.action = func;
        this.record = false;
        this.jsonHandler = jsonHandler === undefined ? (json) => {} : jsonHandler;
    },

    printResponses: (responses) => {
        for (let i = 0; i < responses.length; i++) {
            console.log("----Action Output " + i + "-----");
            console.log("Status: " + responses[i].status);
            console.log("Status: " + responses[i].json);
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

    resSkeleton: (response, callback) => {
        return {
            status: (status) => {
                response.status = status;
                return {
                    json: (json) => {
                        response.setJson(json);
                    }
                };
            },
            end: callback
        }
    },


};

function Response(variables, jsonHandler) {
    this.setJson = (json) => {
        this.json = json;
        jsonHandler(json, variables);
    };

    this.variables = variables;
}

