const mailer = require('../config/mailer');

module.exports = function(userId, account, callback) {

    let url = `${process.env.MODE === 'prod' ? 'https://rsnavigation.com' : `localhost:${process.env.PORT}`}`
            + `/auth/verify/${userId}/${account.hashCode}`;

    const roleString = account.role === 0 ? 'student' : 'placeowner';

    const message = `Congratulations! You have successfully created an RS Navigation ${roleString} account and `
        + `you are just one step away from acessing it.\n\n`
        + `You can click this link to verify that this is indeed your email address:\n${url}\n\n`
        + `If you do not remember signing up to https://rsnavigation.com, calm down. Don't panic.\n`
        + `Just ignore this email and we will handle the rest.\n\n`
        + `- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: account.email,
        subject: "RS Navigation - Email Verification",
        text: message
    };
    
    console.time('Verify Email');
    mailer.sendMail(mailOptions, (err, info) => {
        console.timeEnd('Verify Email');
        if (err) { return callback(err); }
        console.log(`Email sent: ${info.response}`);
        callback(null);
    });
}