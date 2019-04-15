const mailer = require('../config/mailer');

module.exports = function(req, user, hashCode, callback) {

    const role = user.account.role === 0 ? 'student' : 'placeowner';
    let url = `${process.env.MODE === 'prod' ? 'http://rsnavigation.com' : `localhost:${process.env.PORT}`}/auth/verify/${user.account.role}/${hashCode}`;

    const text = `Congratulations! You have successfully created an RS Navigation ${role} account and you are just one step away from acessing it.\n\n`
        + `You can click this link to verify that this is indeed your email address:\n${url}\n\n`
        + `If you do not remember signing up to https://rsnavigation.com, calm down. Don't panic.\n`
        + `Just ignore this email and we will handle the rest.\n\n`
        + `- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: user.account.email,
        subject: "RS Navigation - Email Verification",
        text: text
    };
    
    mailer.sendMail(mailOptions, (err, info) => {
        if (err) { return callback(err); }

        console.log(`Email sent: ${info.response}`);

        req.flash('message', 'Verification link has been sent to your email.');
        req.session.save(callback);
    });
}