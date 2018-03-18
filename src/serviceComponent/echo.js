'use strict';

module.exports = {
    requestPermissions: requestPermissions,
    postEvent: postEvent
};

function requestPermissions(key){
    //TODO: Request Operational Permissions to Active Server
}

function postEvent(req, res){
    echoEvent(req.body.key, req.body.event.type);
    res.status(200);
}

function echoEvent(key, event){
    //TODO: Call back to active server
}