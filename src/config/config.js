const fs = require('fs')

module.exports = {
  development: {
    username: 'root',
    password: null,
    database: 'test',
    host: 'localhost',
    dialect: 'mysql',
    operatorsAliases: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'platform',
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    operatorsAliases: false,
    // dialectOptions: {
    //     ssl: {
    //         ca: fs.readFileSync(__dirname + '/mysql-ca-master.crt')
    //     }
    // }
  },
}