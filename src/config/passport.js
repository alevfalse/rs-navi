const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const mongoose = require('mongoose');

const Student = require('../app/models/student');
const Account = require('../app/models/account');

passport.use('local-student-signup', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
}, (req, email, password, done) => {
    process.nextTick(() => {
        if (req.body.password != req.body.confirmPassword) {
            console.log('Password confirm mismatch.');
            return done(null, false);
        }

        Student.findOne({ 'email': email }, (err, user) => {
            if (err) return done(err);

            if (user) {
                return done(null, false, req.flash('signupMessage', 'Email address is already taken.'));
            } else {
                const firstName = req.body.firstName;
                const lastName = req.body.lastName;

                const newAccount = new Account({
                    _id: new mongoose.Types
                })
                const newStudent = new Student({
                    _id: new mongoose.Types.ObjectId(),

                })
            }
        })

    })
}))
