const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const gmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "roomstayin.navigation@gmail.com",
      pass: process.env.RSNAVI_GMAIL_PASSWORD
    }
});

exports.sendErrorEmail = function(err, recepient='alexanderpaul.marinas@gmail.com', callback) {
    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: recepient,
        subject: `RS Navigation Error: ${err.name}`,
        text: err.stack
    };

    gmail.sendMail(mailOptions, (err, info) => {
        if (err) { return callback(err); }
        logger.info(`Error email sent to [${mailOptions.to}] - [${err.name}] - ${info.response}`);
    });
}

exports.sendVerificationEmail = function(user, callback) {

    let url = `${process.env.MODE === 'prod' ? 'https://rsnavigation.com' : `localhost.com:${process.env.PORT}`}`
            + `/auth/verify/${user.account.hashCode}`;

    const message = `Welcome to RS Navi, ${user.firstName}! You have successfully created an RS Navigation ${user.roleString} account and `
        + `you are just one step away from acessing it. Yay!\n\n`
        + `You can click this link to verify that this is indeed your email address:\n${url}\n\n`
        + `If you do not remember signing up to https://rsnavigation.com, calm down. Don't panic.\n`
        + `Just ignore this email and we will handle the rest.\n\n`
        + `- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: user.account.email,
        subject: "RS Navigation - Email Verification",
        text: message
    };
    
    gmail.sendMail(mailOptions, (err, info) => {
        if (err) { return callback(err); }
        logger.info(`Verification email sent to [${user.account.email}] - ${info.response}`);
        callback(null);
    });
}

exports.sendResetPasswordEmail = function(user, callback) {

    let url = `${process.env.MODE === 'prod' ? 'https://rsnavigation.com' : `localhost.com:${process.env.PORT}`}`
            + `/auth/reset/${user.account.hashCode}`;

    const message = `Good day! We have received a password reset request from your ${user.roleString} account.\n\n`
        + `You can click this link to reset your password:\n${url}\n\n`
        + `If you did not send this request, we suggest you secure your account by clicking this link anyway or requesting a new one\n`
        + `at https://rsnavigation.com/auth and select Forgot Password. You may also update your password on your account's profile page\n`
        + `if you still have access to it (which we hope that you do). \n\n`
        + `Thank you for using RS Navi.\n- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: user.account.email,
        subject: "RS Navigation - Reset Password",
        text: message
    };
    
    gmail.sendMail(mailOptions, (err, info) => {
        if (!err) { logger.info(`Reset password email sent to [${user.account.email}] - ${info.response}`); }
        callback(err);
    });
}