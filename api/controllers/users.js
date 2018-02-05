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
    usePasswordResetCode: usePasswordResetCode
};


function createUser(req, res) {
    var body = req.swagger.params.body.value;

    if (!emailValidator.validate(body.email)) {
        res.status(406).json("Invalid email address");
        return;
    }

    if (body.password.length < 8) {
        res.status(406).json("Password must be 8 characters or longer.");
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
            res.status(201).json()
        }, (reason) => {
            console.log("User insert error: " + reason);
            res.status(406).json("User already exists.");
        });
    }, (reason) => {
        console.log("Name or Password Error: " + reason);
        res.status(406).json("Name or password error.");
    });
}

function getUser(req, res) {

}

function updateUser(req, res) {

}

function deleteUser(req, res) {

}

function loginUser(req, res) {
    var body = req.swagger.params.body.value;

    models.User.findOne({where: {email: body.email}}).then((user) => {
        if (user == null){
            res.status(404).json();
            return;
        }
        bcrypt.compare(body.password, user.passwordHash).then((valid) => {
            if (valid) {
                const payload = {
                    email: user.email
                };
                var token = jwt.sign(payload, req.app.get('JWTSecret'), {
                    expiresIn: '3 hours'
                });
                res.status(200).json({token: token});
            } else {
                console.log("Invalid password supplied");
                res.status(401).json();
            }
        });
    }, (reason) => {
        console.log("Find user error: " + reason);
        res.status(404).json();
    });
}

function sendPasswordResetEmail(req, res) {

}

function usePasswordResetCode(req, res) {

}