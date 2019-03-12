const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const mongoose = require('mongoose');

const Student = require('../app/models/student');
const Account = require('../app/models/account');

passport.serializeUser(function(user, done) {
    done(null, user.id);  // stores the user's id in session
});

passport.deserializeUser(function(id, done) {
    Student.findById(id, function(err, user) {
        done(err, user);  // getting all the data of the user using its id
    });
});

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
                const schoolName = req.body.schoolName;

                const newAccount = new Account({
                    _id: new mongoose.Types.ObjectId,
                    role: 1,
                    email: email,
                    password: password,
                    verified: false,
                    hashCode: null
                })

                newAccount.save((err, savedAccount) => {
                    if (err) return console.error(err);

                    console.error(`Saved ${savedAccount.email} account to database.`);

                    const newStudent = new Student({
                        _id: new mongoose.Types.ObjectId(),
                        firstName: firstName,
                        lastName: lastName,
                        schoolName: schoolName,
                        account: newAccount._id,
                    })

                    newStudent.save((err) => {
                        if (err) return console.error(err);

                        Student.find({}, (err, results) => {
                            results.forEach((res) => {
                                console.log(res);
                            })
                        })
                        return done(null, newStudent); // return the new student user
                    })
                })
            }
        })
    })
}))

passport.use('local-student-login', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true

}, (req, email, password, done) => {
    process.nextTick(() => {

        Account.findOne({ 'email': email }, (err, acc) => {
            console.log(acc);
            if (err) return done(err, false);

            if (!acc) {
                console.log(`Email does not exist.`);
                return done(null, false, req.flash('loginMessage', 'Email address does not exist.'));
            } else {
                console.log('Found email: ');
                console.log(acc);

                if (password === acc.password) {
                    console.log('Correct password.');
                    return done(null, acc);
                }
            }
        })
    })
}))

module.exports = passport;
