'use strict';

const models = require('../models/index');
const emailManager = require("../utils/email");

module.exports = {
    postAlert: postAlert,
    getComponentAlerts: getComponentAlerts,
    getAllAlerts: getAllAlerts
};

function getComponentAlerts(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const componentID = req.swagger.params.componentID.value;
    const user = req.User;

    getAlerts(res, user, clientId, true, componentID);
}

function getAllAlerts(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const user = req.User;

    getAlerts(res, user, clientId, false);
}

function getAlerts(res, user, clientId, limitComponent, componentID) {
    const serverError = (err) => {
        console.log("Cannot get: " + err);
        res.status(500).json();
    };

    const notFoundError = () => {
        res.status(404).json();
    };

    user.getClients({where: {id: clientId}}).then(clients => {
        if (clients.length < 1) {
            return notFoundError();
        }

        const options = limitComponent ? {where: {id: componentID}} : {};
        clients[0].getComponents(options).then(components => {
            if (components.length < 1) {
                return notFoundError();
            }

            let jsonOutputPromises = [];
            components.forEach(c => {
                jsonOutputPromises.push(getJSONAlertsFromComponent(c));
            });

            Promise.all(jsonOutputPromises).then(jsonOutput => {
                let jsonOutputFlat = [];
                jsonOutput.forEach(o => jsonOutputFlat = jsonOutputFlat.concat(o));

                res.status(200).json(jsonOutputFlat);
            }, serverError)


        }, serverError);
    }, serverError);
}

function getJSONAlertsFromComponent(component) {
    return new Promise((fulfill, reject) => {
        component.getAlerts({
            include: [
                models.AlertType
            ]
        }).then(alerts => {
            let jsonOutput = [];
            alerts.forEach(e => {
                jsonOutput.push({
                    component: component.name,
                    type: e.AlertType.type,
                    details: e.details,
                    date: e.date
                })
            });
            fulfill(jsonOutput);
        }, reject);
    });
}

function postAlert(req, res) {
    const component = req.Component;
    const body = req.swagger.params.body.value;
    const alertDetails = body.details;

    const alertType = getAlertType(component, body.type);
    const emails = getEmails(component);

    const serverError = (error) => {
        console.log(error);
        res.status(500).json();
    };

    const notAuthorizedError = (reason) => {
        console.log(reason);
        res.status(401).json();
    };

    const success = () => {
        res.status(200).json();
    };

    if (component.type !== 'model') return notAuthorizedError();

    Promise.all([alertType, emails])
        .then(([alertType, emails]) =>
            saveNewAlert(component, alertType, alertDetails)
                .then(a =>
                    sendNotification(req.app, component, alertType, a[0], emails)
                        .then(success)
                        .catch(serverError)
                )
                .catch(serverError)
        )
        .catch(notAuthorizedError);
}

function saveNewAlert(component, alertType, alertDetails) {
    // noinspection Annotator
    // noinspection Annotator
    return models.sequelize.transaction(t =>
        models.Alert.create({details: alertDetails, date: new Date()}, {transaction: t}).then(a => Promise.all([
            a.setAlertType(alertType, {transaction: t}),
            a.setComponent(component, {transaction: t})])
        ));
}

function getEmails(component) {
    return new Promise((fulfill, reject) =>
        component.getClient({include: [{model: models.User, as: 'Users'}]}).then(c => {
                const emails = [];
                c.Users.forEach(u => emails.push(u.email));
                fulfill(emails);
            }
        ).catch(reject)
    );
}

function sendNotification(app, component, alertType, alert, email) {
    return new Promise((fulfill, reject) => {
        const message = {
            to: email,
            subject: 'Care Platform Alert: '+ alertType.type ,
            text: "The component " + component.name + " has sent the alert '" +
            alertType.type + "'\n Details are: \n " + alert.details
        };
        emailManager.sendEmail(app, message, fulfill, reject)
    });
}

function getAlertType(component, alertType) {
    return new Promise((fulfill, reject) => {
        component.getPermissions({
            where: {
                type: 'alert',
                tentative: false
            },
            include: [
                {
                    model: models.AlertType,
                    where: {
                        type: alertType
                    }
                }
            ]
        }).then(p => {
            if (p.length > 0) {
                // noinspection Annotator
                // noinspection Annotator
                fulfill(p[0].AlertType);
            } else {
                reject("The component does not have permission to use this alert type.");
            }
        }, reject)
    });
}
