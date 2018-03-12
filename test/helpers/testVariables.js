'use strict';
const randomstring = require("randomstring");

module.exports = {
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