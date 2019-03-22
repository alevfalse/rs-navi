const nodemailer = require('nodemailer');

const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "roomstayin.navigation@gmail.com",
      pass: process.env.RSNAVI_GMAIL_PASSWORD
    }
});

module.exports = gmail;
