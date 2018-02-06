'use strict';

var emailValidator = require("email-validator");
var models = require('../../models');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

module.exports = {
    createUser: createUser,
    getUser: getUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    loginUser: loginUser,
    sendPasswordResetEmail: sendPasswordResetEmail,
    usePasswordResetCode: usePasswordResetCode,
    verifyJWT: verifyJWT
};


function createUser(req, res) {
    console.log("Hello");
    var body = req.swagger.params.body.value;

    if (!emailValidator.validate(body.email)) {
        res.status(406).json("Invalid email address");
        return;
    }

    if (body.password.length < 8) {
        res.status(406).json("Password must be 8 characters or longer.");
        res.end();
        return;
    }

    var saltRounds = 10;
    var hashPromise = bcrypt.hash(body.password, saltRounds);

    var namePromise = models.Name.create({
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
        res.status(200).json(user);
        res.end();
    }, (reason) => {
        console.log("Can't get user:" + reason);
        res.status(403).json();
        res.end();
    });
}

function updateUser(req, res) {
    //TODO: need to be implimented as a transaction
    var body = req.swagger.params.body.value;

    if (body.name) {
        for (var prop in body.name) {
            req.User.name[prop] = body.name[prop];
        }

    }

    var nameUpdate = req.User.name.save();

    if (body.email) {
        req.User.email = body.email;
    }

    if (body.password) {
        //TODO: handle password change
    }

    var userUpdate = req.User.save();

    Promise.all([nameUpdate, userUpdate]).then(() => {
        //suc
    }, ()=> {
        //fail
    })
}

function deleteUser(req, res) {
    //TODO: Do users match?!
    var body = req.swagger.params.body.value;

    var userEmail = body.email;
    var userPassword = body.password;

    validCredentials(userEmail, userPassword, (user) => {
        user.destroy().then(() => {
            res.status(200).json();
            res.end();
        }, (reason) => {
            console.log("Cannot delete: " + reason);
            res.status(500).json();
            res.end();
        });
    }, () => {
        //invalid
        console.log("Invalid password supplied");
        res.status(406).json();
        res.end();
    }, () => {
        //error
        res.status(404).json();
        res.end();
    });

    //TODO: delete clients who only belong to this user.

}

function loginUser(req, res) {
    var body = req.swagger.params.body.value;

    var userEmail = body.email;
    var userPassword = body.password;

    validCredentials(userEmail, userPassword, (user) => {
        //valid
        const payload = {
            userid: user.id
        };
        var token = jwt.sign(payload, req.app.get('JWTSecret'), {
            expiresIn: 3 * 60 * 60 //3 Hours
        });
        res.status(200).json({token: token});
        res.end();
    }, () => {
        //invalid
        console.log("Invalid password supplied");
        res.status(401).json();
        res.end();
    }, () => {
        //error
        res.status(404).json();
        res.end();
    });
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

}

function usePasswordResetCode(req, res) {

}

function verifyJWT(req, authOrSecDef, scopesOrApiKey, callback) {
    var regex = /Bearer (\S+)/;
    var result = scopesOrApiKey.match(regex);
    var token = result[1];

    if (token) {
        // verifies secret
        jwt.verify(token, req.app.get('JWTSecret'), function (err, decoded_token_body) {
            if (err) {
                console.log("Error Decoding Token");
                req.res.status(403).json();
                req.res.end();
            } else {
                if (!decoded_token_body) {
                    console.log("Invalid Token");
                    req.res.status(403).json();
                    req.res.end();
                }
                else {
                    //check for expiry
                    var now = Date.now() / 1000;
                    console.log("Token expires in " + (decoded_token_body.exp - now) / 60 + " minutes ");
                    if (decoded_token_body.exp < now) {
                        console.log("Invalid Exired");
                        req.res.status(403).json();
                        req.res.end();
                        return;
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
                        req.User = user;
                        callback();
                    }, (reason) => {
                        console.log("Can't get user:" + reason);
                        req.res.status(403).json();
                        req.res.end();
                    });
                }
            }
        });

    } else {
        req.res.status(403).json();
        req.res.end();
    }
}