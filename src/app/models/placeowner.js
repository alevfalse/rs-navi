const mongoose = require('mongoose');

const PlaceownerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    account: { 
        email: String,
        password: String,
        hashCode: { type: String, default: null },
        status:   { type: Number, default: 0 },
        role:     { type: Number, default: 0 },
        created:  { type: Date, default: new Date() },
        lastLoggedIn: { type: Date, default: new Date() }
    },
    license: {
        status: { type: Number, default: 0 },
        type:   { type: Number, default: null },
    },
    subscription: {
        status: { type: Number, default: 0 },
        expiration: { type: Date, defualt: null }
    }
})

/* account status:       license type:                    subscription status:
0 - unverified            0 - Real Estate Appraiser       0 - unsubscribed
1 - verified              1 - Real Estate Broker          1 - subscribed
2 - suspended             2 - Real Estate Accountant      2 - expired
3 - banned              
4 - deleted              license status:                
5 - subscribed            0 - none
                          1 - unverified
                          2 - verified
                          3 - revoked
*/                        

PlaceownerSchema.methods.generateHashCode = function(req, res) {
    console.log(`Generating Hash Code for: ${req.user.firstName}`);

    const unhashedString = inputEmail + 'SALT'  + Date();
    console.log(`Unhashed String: ${unhashedString}`);
    
    const hashCode = Math.abs(getHashCode(unhashedString));
    console.log(`Hash Code: ${hashCode}`);

    req.user.set({ 'account.hashCode ': hashCode });
    req.user.save((err, updatedUser) => {
        if (err) {
            console.error(`An error occurred while saving user ${req.user.firstName} ${req.user.lastName}:\n ${err}`);
            req.flash({'forgotPasswordMessage': 'Failed to send reset email' })
            return res.redirect();
        }
    })

    acc.save((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/auth/forgot');
        }

        Account.find({}, (err, results) => {
            results.forEach(res => {
                console.log(res);
            })
        })

        const mailOptions = {
            from: "roomstayin.navigation@gmail.com",
            to: inputEmail,
            subject: "Reset Password",
            text: `Click this link to reset your password:\nlocalhost:8080/auth/reset/${hashCode}`
        };
        
        mailer.sendMail(mailOptions, (err, info) => {
            if (err) console.error(err);
            else console.log(`Email sent: ${info.response}`);
            res.send('Password reset link has been sent to your email.');
        });
    })
}

module.exports = mongoose.model('Placeowner', PlaceownerSchema);