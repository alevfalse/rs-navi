const mailer = require('../config/mailer');

module.exports = function (user, callback) {

    let url = `${process.env.MODE === 'prod' ? 'https://rsnavigation.com' : `localhost:${process.env.PORT}`}`
            + `/auth/reset/${user._id}/${user.account.hashCode}`;

    const role = user.account.role === 0 ? 'student' : 'placeowner';

    const message = `Good day! We have received a password reset request from your ${role} account.\n\n`
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
    
    console.time('Reset Email');
    mailer.sendMail(mailOptions, (err, info) => {
        console.timeEnd('Reset Email');
        if (err) { return callback(err); }
        console.log(`Reset Email Sent: ${info.response}`);
        callback(null);
    });
}