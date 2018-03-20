'use strict'
const fetch = require('node-fetch')

const currentEndpoint = require('../server').get('currentEndpoint')

module.exports = {
  requestPermissions: requestPermissions,
  postEvent: postEvent,
}

function requestPermissions (key, eventPermission, callback) {
  const permissions = [
    {
      type: 'alert',
      name: 'Echo',
    },
    eventPermission,
  ]
  callback(permissions)
  const body = {
    permissions: permissions,
    deviceDefinitions: [],
  }
  fetch(currentEndpoint + '/components/requestPermissions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json', 'X-API-Key': key},
  }).then(res => console.log('Permissions requested (' + res.status + ')'))
}

function postEvent (req, res) {
  echoEvent(req.body.key, req.body.event)
  res.status(200).json()
}

function echoEvent (key, event) {
  const body = {
    type: 'Echo',
    details: event.details,
  }

  console.log(body)
  console.log(currentEndpoint + '/components/alerts')
  fetch(currentEndpoint + '/components/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json', 'X-API-Key': key},
  }).
    then(res => console.log('Alert sent (' + res.status + ')'))
}