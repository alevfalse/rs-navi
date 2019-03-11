const nodemailer = require('nodemailer');

if (!process.env.RSNAVI_GMAIL_PASSWORD) {
    return console.error(`No RSNAVI_GMAIL_PASSWORD found. Check your .env file.`);
}

const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "roomstayin.navigation@gmail.com",
      pass: process.env.RSNAVI_GMAIL_PASSWORD
    }
});

module.exports = gmail;
