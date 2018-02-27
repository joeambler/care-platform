'use strict';

const models = require('../../models');

module.exports = {
    postEvent: postEvent,
    getEvents: getEvents

};

function getEvents(req, res) {

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
        res.end();
    };

    const notAuthorizedError = (reason) => {
        console.log(reason);
        res.status(401).json();
        res.end();
    };

    const success = () => {
        res.status(200).json();
        res.end();
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