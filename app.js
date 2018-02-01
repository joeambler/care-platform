var models = require('./models');
var bcrypt = require('bcrypt');

var pwd = "password";
var date = new Date();
var email = "email" + date.getMilliseconds();
var saltRounds = 10;


var namePromise = models.Name.create({
    title: "Mr",
    firstNames: "Test",
    surnames: "User"
});

var hashPromise = bcrypt.hash(pwd, saltRounds);
var keyPromise = bcrypt.hash(email + date.getMilliseconds(), saltRounds);

Promise.all([namePromise, hashPromise, keyPromise]).then(([name, hash, key]) => {
    var userPromise = models.User.create({
        email: email,
        passwordHash: hash,
        nameId: name.id
    });
    var clientPromise = models.Client.create({
        nameId: name.id,
        key: key
    });

    Promise.all([userPromise, clientPromise]).then(function ([user, client]) {
        passwordResetTest(user);
        user.addClient(client, { through: {admin: true, tentative: false}}).then(() => {
            user.getClients().then(clients => clients[0].getName().then(name => console.log(name.firstNames)));
        });
    });
});

function passwordResetTest (user){
    var now = new Date();
    var expiry = now.setDate(now.getHours() + 2);

    models.PasswordResetCode.destroy({
        where: {
            userId: user.id
        }
    });

    var randomstring = require("randomstring");
    var code = randomstring.generate();

    bcrypt.hash(code, saltRounds).then((hash) => {
        models.PasswordResetCode.create({
            expiryTime: expiry,
            resetCodeHash: hash,
            userId: user.id
        });
    });
}
