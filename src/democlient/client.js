'use strict'

module.exports = {
  getUI: res => {
    res.sendFile(__dirname + '/index.html')
  },
}