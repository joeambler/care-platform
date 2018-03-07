'use strict';

const randomstring = require("randomstring");
const app = require('../src/server.js');

module.exports = {
     newUser : {
        name: {
            title: "Dr",
            firstNames: "Grace",
            surnames: "Hopper"
        },
        email: randomstring.generate(50) + "@example.com",
        password: "password"
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
    }
};
