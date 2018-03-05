'use strict';

const emailValidator = require("email-validator");
const models = require('../models/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

module.exports = {
    createUser: createUser,
    getUser: getUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    loginUser: loginUser,
    sendPasswordResetEmail: sendPasswordResetEmail,
    usePasswordResetCode: usePasswordResetCode,
    verifyJWT: verifyJWT,
    validCredentials: validCredentials
};

const saltRounds = 10;

function createUser(req, res) {
    const body = req.swagger.params.body.value;

    if (!emailValidator.validate(body.email)) {
        res.status(406).json("Invalid email address");
        return;
    }

    if (body.password.length < 8) {
        res.status(406).json("Password must be 8 characters or longer.");
        res.end();
        return;
    }

    const hashPromise = bcrypt.hash(body.password, saltRounds);

    const namePromise = models.Name.create({
        title: body.name.title,
        firstNames: body.name.firstNames,
        surnames: body.name.surnames
    });

    Promise.all([namePromise, hashPromise]).then(([name, hash]) => {
        models.User.create({
            email: body.email,
            passwordHash: hash,
            nameId: name.id
        }).then(() => {
            res.status(201).json();
            res.end();
        }, (reason) => {
            console.log("User insert error: " + reason);
            res.status(406).json("User already exists.");
            res.end();
        });
    }, (reason) => {
        console.log("Name or Password Error: " + reason);
        res.status(406).json("Name or password error.");
        res.end();
    });
}

function getUser(req, res) {
    const error = (reason) => {
        console.log("User could not be found, may have been deleted. Therefore expired token." + reason);
        res.status(401).json();
        res.end();
    };

    models.User.findOne({
        where: {
            id: req.userid
        },
        include: {
            model: models.Name,
            attributes: ['title', 'firstNames', 'surnames'],
            as: 'name'
        },
        attributes: ['email']
    }).then(user => {
        if (user == null){
            return error("Null user");
        }
        res.status(200).json(user);
        res.end();
    }, error );
}

function updateUser(req, res) {
    const body = req.swagger.params.body.value;
    if (body.name) {
        for (let prop in body.name) {
            req.User.name[prop] = body.name[prop];
        }
    }

    if (body.email) {
        if (!emailValidator.validate(body.email)) {
            console.log("Invalid email address");
            res.status(406).json("Invalid email address. No changes made.");
            res.end();
            return;
        }
        req.User.email = body.email;
    }

    if (body.password) {
        if (body.password.length < 8) {
            res.status(406).json("Password must be 8 characters or longer. No changes made.");
            res.end();
            return;
        }
        req.User.passwordHash = bcrypt.hashSync(body.password, saltRounds);
    }

    models.sequelize.transaction((t) => {
        return req.User.name.save({transaction: t}).then(() => {
            return req.User.save({transaction: t});
        });
    }).then(function () {
        res.status(200).json();
        res.end();
    }).catch(function (err) {
        console.log("Cannot update: " + err);
        res.status(500).json();
        res.end();
    });

}

function deleteUser(req, res) {
    const body = req.swagger.params.body.value;

    const userEmail = body.email;
    const userPassword = body.password;

    const serverError = (reason) => {
        console.log("Cannot delete: " + reason);
        res.status(500).json();
        res.end();
    };

    if (req.User.email !== userEmail) {
        console.log("You can only delete your own user account");
        res.status(406).json();
        res.end();
        return
    }

    const valid = (user) => {
        let destroyPromises = [];
        user.getClients({include: [{model: models.User, as: "Users"}]}).then(clients => {
            user.setClients([]).then(() => {
                //delete singleton clients
                for (let i = 0; i < clients.length; i++) {
                    if (clients[i].Users.length === 1) {
                        destroyPromises.push(clients[i].destroy());
                    }
                }
                //Delete left over password reset codes
                destroyPromises.push(models.PasswordResetCode.destroy({where: { userId: user.id}}));

                //Delete user
                Promise.all(destroyPromises).then(() => {
                    user.destroy().then(() => {
                        res.status(200).json();
                        res.end();
                    }, serverError);
                }, serverError);
            }, serverError);
        });
    };

    const invalid = () => {
        console.log("Invalid password supplied");
        res.status(406).json();
        res.end();
    };

    const error = () => {
        res.status(404).json();
        res.end();
    };

    validCredentials(userEmail, userPassword, valid, invalid, error);
}

function loginUser(req, res) {
    const body = req.swagger.params.body.value;

    const userEmail = body.email;
    const userPassword = body.password;

    const valid = (user) => {
        const payload = {
            userid: user.id
        };
        const token = jwt.sign(payload, req.app.get('JWTSecret'), {
            expiresIn: 3 * 60 * 60 //3 Hours
        });
        res.status(200).json({token: token});
        res.end();
    };

    const invalid = () => {
        console.log("Invalid password supplied");
        res.status(401).json();
        res.end();
    };

    const error = () => {
        res.status(404).json();
        res.end();
    };

    validCredentials(userEmail, userPassword, valid, invalid, error);
}

function validCredentials(userEmail, userPassword, validCallback, invalidCallback, errorCallback) {
    models.User.findOne({where: {email: userEmail}}).then(user => {
        if (user == null) {
            errorCallback();
            return;
        }

        bcrypt.compare(userPassword, user.passwordHash).then(valid => {
            if (valid) {
                validCallback(user);
            } else {
                invalidCallback();
            }
        }, reason => {
            console.log("Problem checking password: " + reason);
            errorCallback();
        });
    }, reason => {
        console.log("Problem finding user: " + reason);
        errorCallback();
    });
}

function sendPasswordResetEmail(req, res) {
    let senderAccount = req.app.get('EmailAccount');
    const userEmail = req.swagger.params.body.value.email;

    const randomstring = require("randomstring");

    const serverErrorCallback = (reason) => {
        console.log("Server Error: " + reason);
        res.status(500).json(reason);
        res.end();
    };

    const notFoundErrorCallback = (reason) => {
        console.log("Server Error: " + reason);
        res.status(404).json(reason);
        res.end();
    };

    const successCallback = () => {
        console.log("Email sent");
        res.status(200).json();
        res.end();
    };

    models.User.findOne({where: {email: userEmail}}).then(user => {
        if (user == null) {
            return notFoundErrorCallback();
        }

        let resetCode = randomstring.generate(15);

        addResetCode(user, resetCode, serverErrorCallback);
        sendEmail(senderAccount, user.email, resetCode, successCallback, serverErrorCallback);

    }, notFoundErrorCallback);
}

function addResetCode(user, resetCode, serverErrorCallback) {
    bcrypt.hash(resetCode, saltRounds).then(hash => {
        models.PasswordResetCode.destroy({where: {userId: user.id}}).then(() => {
            models.PasswordResetCode.create({
                userId: user.id,
                expiryTime: new Date(Date.now() + (1000 * 60 * 60)), //expire in one hour
                resetCodeHash: hash
            }).then(() => {
                console.log("Password reset code added");
            }, serverErrorCallback);
        }, serverErrorCallback);
    }, serverErrorCallback);
}

function usePasswordResetCode(req, res) {
    const body = req.swagger.params.body.value;

    const userEmail = body.email;
    const code = body.code;
    const newPassword = body.newPassword;

    const serverErrorCallback = (reason) => {
        console.log("Server Error: " + reason);
        res.status(500).json(reason);
        res.end();
    };

    const notFoundErrorCallback = (reason) => {
        console.log("Server Error: " + reason);
        res.status(404).json(reason);
        res.end();
    };

    const successCallback = () => {
        console.log("Password Reset");
        res.status(200).json();
        res.end();
    };

    const unauthorizedCallback = () => {
        console.log("Invalid or expired code");
        res.status(401).json();
        res.end();
    };

    models.User.findOne({where: {email: userEmail}}).then(user => {
        if (user == null) {
            return notFoundErrorCallback();
        }

        models.PasswordResetCode.findOne({where: {userId: user.id}}).then(resetCode => {
            if (resetCode == null) {
                return unauthorizedCallback();
            }

            if (Date.now() < resetCode.expiryTime && bcrypt.compareSync(code, resetCode.resetCodeHash)) {
                if (newPassword.length < 8) {
                    res.status(406).json("Password must be 8 characters or longer. No changes made.");
                    res.end();
                    return;
                }

                user.passwordHash = bcrypt.hashSync(newPassword, saltRounds);

                models.sequelize.transaction((t) => {
                    return user.save({transaction: t}).then(() => {
                        return resetCode.destroy({transaction: t});
                    });
                }).then(successCallback).catch(serverErrorCallback);

            } else {
                console.log("Expired code");
                unauthorizedCallback();
            }
        }, unauthorizedCallback);
    }, notFoundErrorCallback);
}

function verifyJWT(req, authOrSecDef, scopesOrApiKey, callback) {
    const unauthorizedCallback = (reason) => {
        console.log(reason);
        req.res.status(401).json();
        req.res.end();
    };

    if (!scopesOrApiKey) {
        return unauthorizedCallback("No value supplied");
    }

    const regex = /Bearer (\S+)/;
    const result = scopesOrApiKey.match(regex);
    const token = result[1];

    if (token) {
        jwt.verify(token, req.app.get('JWTSecret'), function (err, decoded_token_body) {
            if (err) {
                return unauthorizedCallback("Error Decoding Token");
            } else {
                if (!decoded_token_body) {
                    return unauthorizedCallback("Invalid Token");
                }

                //check for expiry
                const now = Date.now() / 1000;
                if (decoded_token_body.exp < now) {
                    return unauthorizedCallback("Token has expired");
                }

                req.userid = decoded_token_body.userid;

                //retrieve from database
                models.User.findOne({
                    where: {
                        id: decoded_token_body.userid
                    },
                    include: {
                        model: models.Name,
                        as: 'name'
                    }
                }).then(user => {
                    if (user == null){
                        return unauthorizedCallback("User no longer exists");
                    }
                    req.User = user;
                    callback();
                }, unauthorizedCallback);

            }
        });
    } else {
        req.res.status(401).json();
        req.res.end();
    }
}

function sendEmail(senderAccount, emailAddress, code, successCallback, errorCallback) {
    let transporter = nodemailer.createTransport({
        host: senderAccount.server,
        port: 465,
        secure: true,
        auth: {
            user: senderAccount.email,
            pass: senderAccount.password
        }
    });

    let mailOptions = {
        from: 'Care Platform Account Management <noreply@ambler.me>', // sender address
        to: emailAddress, // list of receivers
        subject: 'Password Reset Code', // Subject line
        text: 'Use the following code to reset your password:\n' + code // plain text body
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            errorCallback(err);
        } else {
            successCallback();
        }
    });
}