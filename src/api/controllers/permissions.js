'use strict';

const models = require('../models/index');

module.exports = {
    requestPermissions: requestPermissions,
    getPermissions: getPermissions,
    getRequestedPermissions: getRequestedPermissions,
    acceptPermissions: acceptPermissions,
    revokePermissions: revokePermissions
};

function requestPermissions(req, res) {
    const component = req.Component;
    const body = req.swagger.params.body.value;

    console.log(body);

    const serverError = (error) => {
        console.log(error);
        res.status(500).json();
    };

    const success = () => {
        res.status(200).json();
    };

    const devicesError = (deviceDefinitions) => {
        console.log(deviceDefinitions);
        res.status(400).json(deviceDefinitions);
    };

    const deviceDefinitions = body.deviceDefinitions;
    const permissions = body.permissions;

    const checks = [permissionAndDevicesMatch(deviceDefinitions, permissions),
        getDefinitionConflicts(deviceDefinitions),
        getComponentPermissionsFlat(component, null, false)];


    Promise.all(checks).then(([match, devicesComparison, existingPermissions]) => {

        if (!match) {
            console.log("Badly defined device permissions/definitions");
            return devicesError([]);
        }

        if (devicesComparison.conflictDeviceDefinitions.length > 0) {
            return devicesError(devicesComparison.conflictDeviceDefinitions);
        }

        const newPermissions = permissions.filter(p =>
            existingPermissions.filter(ep =>
                ep.type === p.type && ep.name === p.name).length === 0
        );

        if (newPermissions.length < 1) return success();

        console.log(devicesComparison);
        console.log(newPermissions);
        addPermissionsAndDefinitions(newPermissions, devicesComparison, component).then(() => {
            success();
        }, serverError)
    }, serverError);
}

function getComponentPermissionsFlat(component, tentative, includeOriginal) {
    return new Promise((fulfill, reject) => {
        const options = {include: [models.EventType, models.AlertType, models.DeviceType]};
        if (tentative !== null){
            options.where = {tentative: tentative};
        }

        component.getPermissions(options).then((permissions) => {
            const flatPermissions = [];
            permissions.forEach(p => {
                let name;
                switch (p.type) {
                    case 'event':
                        name = p.EventType.type;
                        break;
                    case 'alert':
                        name = p.AlertType.type;
                        break;
                    case 'device':
                        name = p.DeviceType.type;
                        break;
                    default:
                        return reject();
                }

                const flatPermission = {
                    type: p.type,
                    name: name,

                };

                if (includeOriginal){
                    flatPermission.permission =  p
                }

                flatPermissions.push(flatPermission);
            });

            fulfill(flatPermissions);
        }, reject)
    });
}

function permissionAndDevicesMatch(deviceDefinitions, permissions) {
    return new Promise((fulfill) => {
        const devicePermissions = permissions.filter(p => {
            return p.type === 'device';
        });

        if (devicePermissions.length === 0 && typeof deviceDefinitions === 'undefined') return fulfill(true);
        const correctlyDefinedPermissions = devicePermissions.filter(p => {
            return deviceDefinitions.filter(device => {
                console.log([device.type, p.name]);
                return device.type === p.name;
            }).length === 1;
        });

        const allDefined = deviceDefinitions.length === devicePermissions.length;
        const allCorrect = deviceDefinitions.length === correctlyDefinedPermissions.length;

        fulfill(allDefined && allCorrect);
    });
}

function DevicesComparison() {
    this.devicesToCreate = [];
    this.conflictDeviceDefinitions = [];
    this.compatibleDevices = [];
}

function getDefinitionConflicts(deviceDefinitions) {
    return new Promise((fulfill, reject) => {
        const comparison = new DevicesComparison();
        if (typeof deviceDefinitions === 'undefined') return fulfill(comparison);


        const devicesInDb = [];
        deviceDefinitions.forEach(d => devicesInDb.push(models.DeviceType.findOne({where: {type: d.type}})));

        Promise.all(devicesInDb).then((devices) => {
            for (let i = 0; i < devices.length; i++) {
                if (devices[i] == null) {
                    comparison.devicesToCreate.push(JSON.stringify(JSON.parse(deviceDefinitions[i])));
                    continue;
                }
                if (JSON.stringify(JSON.parse(devices[i].prototype)) !== JSON.stringify(JSON.parse(deviceDefinitions[i].prototype))) {
                    comparison.conflictDeviceDefinitions.push(deviceDefinitions[i]);
                    continue;
                }
                comparison.compatibleDevices.push(devices[i]);
            }
            fulfill(comparison);
        }, reject);
    });
}

function addPermissionsAndDefinitions(permissions, devicesComparison, component) {
    return models.sequelize.transaction(function (t) {
        const devicePermissions = permissions.filter(p => {
            return p.type === 'device';
        });

        const promises = [addDeviceDefinitionsAndPermissions(t, devicePermissions, devicesComparison, component),
            addPermissionsByType(t, 'event', permissions, models.EventType, component),
            addPermissionsByType(t, 'alert', permissions, models.AlertType, component)];

        return Promise.all(promises);
    });
}

function addDeviceDefinitionsAndPermissions(t, devicePermissions, devicesComparison, component) {
    return models.DeviceType.bulkCreate(devicesComparison.devicesToCreate, {transaction: t})
        .then((devices) => {
            devices = devices.concat(devicesComparison.compatibleDevices);
            return models.Permission.bulkCreate(devicePermissions, {transaction: t}).then(ps => {
                const promises = [];
                ps.forEach(p => {
                    promises.push(p.setDeviceType(devices.pop(), {transaction: t}));
                    promises.push(component.addPermission(p, {transaction: t}));
                });
                return Promise.all(promises);
            });
        });
}

function addPermissionsByType(t, type, permissions, model, component) {
    const promises = [];
    const permissionsOfType = permissions.filter(p => p.type === type);

    if (permissionsOfType.length < 1) return;

    permissionsOfType.forEach(p => {
        promises.push(model.findOrCreate({where: {type: p.name}, transaction: t}).spread(instance =>
            models.Permission.create({type: type}, {transaction: t}).then(p => {
                const promises = [];

                promises.push(type === 'event' ? p.setEventType(instance, {transaction: t}) :
                    type === 'alert' ? p.setAlertType(instance, {transaction: t}) :
                        null);
                // noinspection Annotator
                promises.push(component.addPermission(p, {transaction: t}));
                return Promise.all(promises);
            })
        ));
    });

    return Promise.all(promises);
}

function getPermissions(req, res) {
    getComponentPermissionsREST(req, res, false)
}

function getRequestedPermissions(req, res) {
    getComponentPermissionsREST(req, res, true)
}

function getComponentPermissionsREST(req, res, tentative) {
    const clientId = req.swagger.params.clientID.value;
    const componentID = req.swagger.params.componentID.value;
    const user = req.User;

    const serverError = (err) => {
        console.log("Cannot get: " + err);
        res.status(500).json();
    };

    const notFoundError = () => {
        res.status(404).json();
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}}).then(clients => {
        if (clients.length < 1) {
            return notFoundError();
        }
        clients[0].getComponents({where: {id: componentID}}).then(components => {
            if (components.length < 1) {
                return notFoundError();
            }

            getComponentPermissionsFlat(components[0], tentative, false).then(permissions => {
                res.status(200).json(permissions);
            }, serverError);
        }, serverError);
    }, serverError);
}

function acceptPermissions(req, res) {
    changePermissionStatusREST(req,res, false);
}

function revokePermissions(req, res) {
    changePermissionStatusREST(req,res, true);
}

function changePermissionStatusREST(req, res, setTentative) {
    const clientId = req.swagger.params.clientID.value;
    const componentID = req.swagger.params.componentID.value;
    const permissionsToChange = req.swagger.params.body.value;
    const user = req.User;

    const serverError = (err) => {
        console.log("Cannot get: " + err);
        res.status(500).json();
    };

    const notFoundError = () => {
        res.status(404).json();
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}}).then(clients => {
        if (clients.length < 1) {
            return notFoundError();
        }
        clients[0].getComponents({where: {id: componentID}}).then(components => {
            if (components.length < 1) {
                return notFoundError();
            }

            getComponentPermissionsFlat(components[0], !setTentative, true).then((flatPermissions) => {
                const nonExistentPermissions = [];
                const permissionsToUpdate = [];
                permissionsToChange.forEach(p => {
                    const matching = flatPermissions.filter(fp => fp.type === p.type && fp.name === p.name);

                    if (matching.length < 1){
                        nonExistentPermissions.push(p);
                    } else {
                        permissionsToUpdate.push(matching[0].permission);
                    }
                });

                if (nonExistentPermissions.length > 0){
                    res.status(400).json(nonExistentPermissions);
                    return;
                }

                const promises = [];
                permissionsToUpdate.forEach(p =>{
                    p.tentative = setTentative;
                    promises.push(p.save());
                });

                Promise.all(promises).then(() => {
                    res.status(200).json();
                }, serverError);
            }, serverError);
        }, serverError);
    }, serverError);
}