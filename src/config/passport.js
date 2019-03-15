const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const mongoose = require('mongoose');

const Student = require('../app/models/student');
const Placeowner = require('../app/models/place-owner');
const Account = require('../app/models/account');

passport.serializeUser(function(user, done) {
    done(null, user.id);  // stores the user's id in session
});

passport.deserializeUser(function(id, done) {
    Student.findById(id, function(err, user) {
        done(err, user);  // getting all the data of the user using its id
    });
});

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {

    console.log(req.body);

    return done(null, false);
}))

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {

    console.log(req.body);

    if (req.body.password !== req.body.confirmPassword) {
        console.log('Password confirm mismatch.');
        return done(null, false);
    }

    return done(null, false);
}))

module.exports = passport;
