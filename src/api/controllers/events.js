'use strict';

const models = require('../models/index');

module.exports = {
    postEvent: postEvent,
    getComponentEvents: getComponentEvents,
    getAllEvents: getAllEvents
};

function getComponentEvents(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const componentID = req.swagger.params.componentID.value;
    const user = req.User;

    getEvents(res, user, clientId, true, componentID);
}

function getAllEvents(req, res) {
    const clientId = req.swagger.params.clientID.value;
    const user = req.User;

    getEvents(res, user, clientId, false);
}

function getEvents(res, user, clientId, limitComponent, componentID) {
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
                jsonOutputPromises.push(getJSONEventsFromComponent(c));
            });

            Promise.all(jsonOutputPromises).then(jsonOutput => {
                console.log(jsonOutput);
                let jsonOutputFlat = [];
                jsonOutput.forEach(o => jsonOutputFlat = jsonOutputFlat.concat(o));

                res.status(200).json(jsonOutputFlat);
            }, serverError)


        }, serverError);
    }, serverError);
}

function getJSONEventsFromComponent(component) {
    return new Promise((fulfill, reject) => {
        component.getEvents({
            include: [
                {
                    model: models.DeviceInstance,
                    include: [models.DeviceType]
                },
                models.EventType
            ]
        }).then(events => {
            let jsonOutput = [];
            events.forEach(e => {
                jsonOutput.push({
                    component: component.name,
                    type: e.EventType.type,
                    details: e.details,
                    date: e.date,
                    deviceInstance: {
                        type: e.DeviceInstance.DeviceType.type,
                        properties: e.DeviceInstance.properties
                    }
                })
            });
            fulfill(jsonOutput);
        }, reject);
    });
}

function postEvent(req, res) {
    const component = req.Component;
    const body = req.swagger.params.body.value;
    const deviceProperties = body.deviceInstance.properties;
    const eventDetails = body.details;

    const deviceType = getDeviceType(component, body.deviceInstance);
    const eventType = getEventType(component, body.type);

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

    Promise.all([deviceType, eventType])
        .then(([deviceType, eventType]) =>
            saveNewEvent(component, deviceType, eventType, eventDetails, deviceProperties)
                .then((vs) =>
                    success(forwardEvent(vs[0])
                        .then(success)
                        .catch(serverError)
                    )
                )
                .catch(serverError)
        )
        .catch(notAuthorizedError);
}

function saveNewEvent(component, deviceType, eventType, eventDetails, deviceProperties) {
    // noinspection Annotator
    // noinspection Annotator
    return models.sequelize.transaction(t =>
        models.Event.create({details: eventDetails, date: new Date()}, {transaction: t}).then(e => Promise.all([
            e.setEventType(eventType, {transaction: t}),
            e.setComponent(component, {transaction: t}),
            createAndAssociateDeviceInstance(t, e, deviceType, deviceProperties)])
        ));
}

function createAndAssociateDeviceInstance(t, e, deviceType, deviceProperties) {
    return models.DeviceInstance.create({properties: deviceProperties}, {transaction: t})
        .then(di => Promise.all([
            di.setDeviceType(deviceType, {transaction: t}),
            e.setDeviceInstance(di, {transaction: t})]));
}

function forwardEvent(event) {
    return new Promise((fulfill, reject) => {
        fulfill();
        //TODO: Forward event to the relevant modelling components
    });
}

function getEventType(component, eventType) {
    return new Promise((fulfill, reject) => {
        component.getPermissions({
            where: {
                type: 'event',
                tentative: false
            },
            include: [
                {
                    model: models.EventType,
                    where: {
                        type: eventType
                    }
                }
            ]
        }).then(p => {
            if (p.length > 0) {
                // noinspection Annotator
                // noinspection Annotator
                fulfill(p[0].EventType);
            } else {
                reject("The component does not have permission to use this event type.");
            }
        }, reject)
    });
}

function getDeviceType(component, deviceInstance) {
    return new Promise((fulfill, reject) => {
        const deviceType = deviceInstance.type;
        const deviceProperties = deviceInstance.properties;
        component.getPermissions({
            where: {
                type: 'device',
                tentative: false
            },
            include: [
                {
                    model: models.DeviceType,
                    where: {
                        type: deviceType
                    }
                }
            ]
        }).then(p => {
            if (p.length > 0) {
                const pDeviceType = p[0].DeviceType;
                const permittedPrototype = pDeviceType.prototype;
                checkJSONProperties(permittedPrototype, deviceProperties).then((matches) => {
                    if (matches) {
                        fulfill(pDeviceType);
                    } else {
                        reject("The properties do not match the prototype.");
                    }
                }, reject);
            } else {
                reject("The component does not have permission to use this device type.");
            }

        }, reject)
    });
}

function checkJSONProperties(prototype, deviceProperties) {
    return new Promise((fulfill) => {
        prototype = JSON.parse(prototype);
        deviceProperties = JSON.parse(deviceProperties);
        Object.keys(prototype).forEach(p => {
            if (typeof deviceProperties[p] !== prototype[p]) {
                return fulfill(false);
            }
        });
        fulfill(true);
    });
}