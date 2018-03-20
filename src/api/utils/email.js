'use strict'
const nodemailer = require('nodemailer')

module.exports = {
  sendEmail: (app, message, successCallback, errorCallback) => {
    let senderAccount = app.get('EmailAccount')
    let transporter = nodemailer.createTransport({
      host: senderAccount.server,
      port: 465,
      secure: true,
      auth: {
        user: senderAccount.email,
        pass: senderAccount.password,
      },
    })

    let mailOptions = {
      from: 'Care Platform <noreply@ambler.me>',
      to: message.to,
      subject: message.subject,
      text: message.text,
    }

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        errorCallback(err)
      } else {
        successCallback()
      }
    })
  },
}