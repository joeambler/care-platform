'use strict';

module.exports = {
    getUI : function (req, res) {
        res.sendFile(__dirname + '/index.html');
    }
};