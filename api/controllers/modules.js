'use strict';

const models = require('../../models');
const randomstring = require("randomstring");

module.exports = {
    newModule: newModule
};



function newModule(req, res) {
    const body = req.swagger.params.body.value;
    const clientId = req.swagger.params.clientID.value;
    const user = req.User;
    console.log(clientId);

    const key = randomstring.generate(100);

    const serverErrror = (err) => {
        console.log("Cannot add: " + err);
        res.status(500).json();
        res.end();
    };

    const notFoundError = () => {
        console.log("Client not found");
        res.status(404).json();
        res.end();
    };

    const moduleData = {
        key: key,
        moduleType: body.type,
        moduleName: body.name,
        apiEndPoint: body.apiEndPoint
    };

    user.getClients({where: { id: clientId}, through: { where: { admin: true}}}).then(clients => {
        if (clients.length < 1) return notFoundError;
        const client = clients[0];

        models.ClientModule.create(moduleData).then((module) => {
            console.log(client);
            module.setClient(client).then(() => {
                moduleData.id = module.id;
                moduleData.client = client.id;
                res.status(201).json(moduleData);
                res.end();
            }, serverErrror);
        }, serverErrror);
    }, serverErrror);





}