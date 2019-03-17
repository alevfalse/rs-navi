const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;

const Student = require('../app/models/student');
const Placeowner = require('../app/models/placeowner');

passport.serializeUser(function(user, done) {
    console.log(`Serializing User:`);
    console.log(user);
    done(null, user.id);  // stores the user's id in session
});

// getting all the data of the user using its id
passport.deserializeUser(function(id, done) {
    console.log(`Deserializing User: ${id}`);
    console.time('Deserialized')
    Student.findById(id, function(err, user) {
        console.timeEnd('Deserialized')
        if (err) return done(err);
        if (user) {
            return done(null, user) // bind user to request
        } else {
            Placeowner.findById(id, function(err, user) {
                if (err) return done(err);
                if (user) return done(null, user);
                else return done(null, null); // bind user to request
            })
        }
    });
});

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {
    console.log('Local Login Strategy Invoked');
    console.log(req.body);

    const role = req.body.role;

    done(null, null);
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
