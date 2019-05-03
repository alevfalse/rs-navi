const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const isEmail = require('validator/lib/isEmail');
const argon = require('argon2');
const audit = require('../bin/auditor');

// models
const User = require('../app/models/user');

// mailer
const mailer = require('../config/mailer');

// additional validation on top of the client-side validation
const validateSignupForm = require('../bin/validate-signup-form');

// stores the user's id in session to be used during deserialization
passport.serializeUser((user, done) => {
    user && user._id ? done(null, user._id) : done(null, false);
});

// fetches user's data from the database in every request using their id that is stored in session
passport.deserializeUser((id, done) => {
    User.findById(id).populate('image').exec(done);
});


// NOTE: There's no need to call for req.session.save() after every req.flash() in the following code.
// It will be called on the passport.authenticate()'s callback function.

// =====================================================================================================
// STUDENT & PLACEOWNER LOGIN ==========================================================================
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, async function(req, email, password, done) {

    const roleString = req.body.role;

    if (!email || !password || !roleString) { return done(null, false); }

    const role = req.body.role === 'student' ? 0 : 1;

    User.findOne({ 'account.email': email, 'account.role': role },
    async (err, user) => {
        if (err) { return done(err, false); }

        if (!user || !await user.verifyPassword(password)) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }

        if (user.account.status === 0) {
            req.flash('message', 'Your email address is still unverified.\n Please check your email for verification link.')
            return done(null, false);
        } else if (user.account.status === 2) {
            req.flash('message', `Your account has been locked due to suspicious activities until ${user.account.unlockedAt}.`)
            return done(null, false);
        } else if (user.account.status === 4) {
            req.flash('message', 'Your account has been banned.')
            return done(null, false);
        }

        user.login(err => err ? done(err, false) : done(null, user));
    });
}));

// =====================================================================================================
// STUDENT & PLACEOWNER SIGNUP =========================================================================
passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, async function(req, email, password, done) {
    
    if (!isEmail(email, { allow_utf8_local_part: false })) {
        req.flash('message', 'Invalid email address.');
        return done(null, false);
    }
    
    const formError = validateSignupForm(req.body);
    if (formError) {
        req.flash('message', formError.message);
        return done(null, false);
    }
    
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const contactNumber = req.body.contactNumber;
    const role = req.body.role === 'student' ? 0 : 1;

    User.findOne({ 'email': email }, '_id', async (err, account) => {
        if (err) { return done(err, false); }

        if (account) {
            req.flash('message', 'Email address is already taken.');
            return done(null, false);
        }

        const hashedPassword = await argon.hash(password, { timeCost: 50 });

        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            contactNumber: contactNumber,
            account: {
                role: role,
                email: email,
                password: hashedPassword
            }
        });

        if (role === 0) { newUser.schoolName = req.body.schoolName; }
        else { newUser.license = { status: 0, type: null } }

        newUser.save(err => {
            if (err) { return done(err, false); }

            mailer.sendVerificationEmail(newUser, (err) => {
                if (err) { return done(err, false); }
                req.flash('message', 'Verification email sent.');
                done(null, newUser);
                audit(newUser._id, 0, 0);
            }); 
        });
    });
}));

// =====================================================================================================
// ADMIN LOGIN =========================================================================================
passport.use('local-login-admin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {

    if (!email || !password) {
        req.flash('message', `Missing required login field(s).`);
        return done(null, false);
    }

    User.findOne({ 'account.email': email, 'account.role': 7 }, 'account', async (err, admin) => {
        if (err) { return done(err, false); }

        if (!admin || !await admin.verifyPassword(password)) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }
        
        admin.login(err => err ? done(err, false) : done(null, admin));
    });
}));

module.exports = passport;
