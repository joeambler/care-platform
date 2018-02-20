'use strict';

const models = require('../../models');

module.exports = {
    requestPermissions: requestPermissions,
    getPermissions: getPermissions,
    getRequestedPermissions: getRequestedPermissions
};

function requestPermissions(req, res) {
    const module = req.Module;
    const body = req.swagger.params.body.value;

    const serverError = () => {
        res.status(500).json();
        res.end();
    };

    const success = () => {
        res.status(200).json();
        res.end();
    };

    const devicesError = (deviceDefinitions) => {
        console.log(deviceDefinitions);
        res.status(400).json(deviceDefinitions);
        res.end();
    };

    const deviceDefinitions = body.deviceDefinitions;
    const permissions = body.permissions;

    const checks = [permissionAndDevicesMatch(deviceDefinitions, permissions),
        getDefinitionConflicts(deviceDefinitions),
        getModulePermissionsPlain(module, null)];


    Promise.all(checks).then(([match, devicesComparison, existingPermissions]) => {
        console.log(existingPermissions);

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
        addPermissionsAndDefinitions(newPermissions, devicesComparison, module).then(() => {
            success();
        }, serverError)
    }, serverError);
}

function getModulePermissionsPlain(module, tentative) {
    return new Promise((fulfill, reject) => {
        const options = {include: [models.EventType, models.AlertType, models.DeviceType]};
        if (tentative !== null){
            options.where = {tentative: tentative};
        }

        module.getPermissions(options).then((permissions) => {
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

                flatPermissions.push({
                    type: p.type,
                    name: name
                })
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

        const devicesInDb = [];
        deviceDefinitions.forEach(d => devicesInDb.push(models.DeviceType.findOne({where: {type: d.type}})));

        Promise.all(devicesInDb).then((devices) => {
            for (let i = 0; i < devices.length; i++) {
                if (devices[i] == null) {
                    comparison.devicesToCreate.push(deviceDefinitions[i]);
                    continue;
                }
                if (devices[i].prototype !== deviceDefinitions[i].prototype) {
                    comparison.conflictDeviceDefinitions.push(deviceDefinitions[i]);
                    continue;
                }
                comparison.compatibleDevices.push(devices[i]);
            }
            fulfill(comparison);
        }, reject);
    });
}

function addPermissionsAndDefinitions(permissions, devicesComparison, module) {
    return models.sequelize.transaction(function (t) {
        const devicePermissions = permissions.filter(p => {
            return p.type === 'device';
        });

        const promises = [addDeviceDefinitionsAndPermissions(t, devicePermissions, devicesComparison, module),
            addPermissionsByType(t, 'event', permissions, models.EventType, module),
            addPermissionsByType(t, 'alert', permissions, models.AlertType, module)];

        return Promise.all(promises);
    });
}

function addDeviceDefinitionsAndPermissions(t, devicePermissions, devicesComparison, module) {
    return models.DeviceType.bulkCreate(devicesComparison.devicesToCreate, {transaction: t})
        .then((devices) => {
            devices = devices.concat(devicesComparison.compatibleDevices);
            return models.Permission.bulkCreate(devicePermissions, {transaction: t}).then(ps => {
                const promises = [];
                ps.forEach(p => {
                    promises.push(p.setDeviceType(devices.pop(), {transaction: t}));
                    promises.push(module.addPermission(p, {transaction: t}));
                });
                return Promise.all(promises);
            });
        });
}

function addPermissionsByType(t, type, permissions, model, module) {
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
                promises.push(module.addPermission(p, {transaction: t}));
                return Promise.all(promises);
            })
        ));
    });

    return Promise.all(promises);
}

function getPermissions(req, res) {
    getModulePermissionsREST(req, res, false)
}

function getRequestedPermissions(req, res) {
    getModulePermissionsREST(req, res, true)
}

function getModulePermissionsREST(req, res, tentative) {
    const clientId = req.swagger.params.clientID.value;
    const moduleID = req.swagger.params.moduleID.value;
    const user = req.User;

    const serverErrror = (err) => {
        console.log("Cannot get: " + err);
        res.status(500).json();
        res.end();
    };

    const notFoundError = () => {
        res.status(404).json();
        res.end();
    };

    user.getClients({where: {id: clientId}, through: {where: {admin: true}}}).then(clients => {
        if (clients.length < 1) {
            return notFoundError();
        }
        clients[0].getModules({where: {id: moduleID}}).then(modules => {
            if (modules.length < 1) {
                return notFoundError();
            }

            getModulePermissionsPlain(modules[0], tentative).then(permissions => {
                res.status(200).json(permissions);
                res.end();
            }, serverErrror);
        }, serverErrror);
    }, serverErrror);
}