'use strict';

const models = require('../../models');
const randomstring = require("randomstring");

module.exports = {
    newModule: newModule,
    authenticateModule: authenticateModule,
    getModules: getModules,
    getModuleById: getModuleById,
    deleteModuleById: deleteModuleById
};


function newModule(req, res) {
    const body = req.swagger.params.body.value;
    const clientId = req.swagger.params.clientID.value;
    const user = req.User;

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
        type: body.type,
        name: body.name,
        apiEndPoint: body.apiEndPoint
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}}).then(clients => {
        if (clients.length < 1) return notFoundError();
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

function getModules(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const user = req.User;

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

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}})
        .then(clients => {
            if (clients.length < 1) return notFoundError();
            clients[0].getModules({attributes: ['id', 'name', 'apiEndPoint', 'key']}).then((modules) => {
                const moduleObjects = [];
                modules.forEach(m => {
                    moduleObjects.push(m.get({plain: true}));
                });
                res.status(200).json(moduleObjects);
                res.end();
            }, serverErrror);
        }, serverErrror);
}

function getModuleById(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const moduleID = req.swagger.params.moduleID.value;
    const user = req.User;

    const serverErrror = (err) => {
        console.log("Cannot add: " + err);
        res.status(500).json();
        res.end();
    };

    const notFoundError = () => {
        res.status(404).json();
        res.end();
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}})
        .then(clients => {
            if (clients.length < 1) return notFoundError();
            clients[0].getModules({attributes: ['id', 'name', 'apiEndPoint', 'key'], where: {id: moduleID}})
                .then(modules => {
                    if (modules.length < 1) {
                        return notFoundError()
                    }
                    res.status(200).json(modules[0].get({plain: true}));
                    res.end();
                }, serverErrror);
        }, serverErrror);
}

function deleteModuleById(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const moduleID = req.swagger.params.moduleID.value;
    const user = req.User;

    const serverErrror = (err) => {
        console.log("Cannot add: " + err);
        res.status(500).json();
        res.end();
    };

    const notFoundError = () => {
        res.status(404).json();
        res.end();
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}})
        .then(clients => {
            if (clients.length < 1) return notFoundError();
            clients[0].getModules({where: {id: moduleID}})
                .then(modules => {
                    if (modules.length < 1) {
                        return notFoundError()
                    }
                    modules[0].destroy();
                    res.status(200).json();
                    res.end();
                }, serverErrror);
        }, serverErrror);
}

function authenticateModule(req, authOrSecDef, scopesOrApiKey, callback) {
    const unauthorizedCallback = (reason) => {
        console.log(reason);
        req.res.status(401).json();
        req.res.end();
    };

    if (!scopesOrApiKey) {
        return unauthorizedCallback("No value supplied");
    }

    models.ClientModule.findOne({where: {key: scopesOrApiKey}}).then(module => {
        if (module == null) {
            return unauthorizedCallback("Key does not match");
        }
        else {
            req.Module = module;
            callback();
        }
    }, unauthorizedCallback);


}