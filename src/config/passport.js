const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const argon = require('argon2');
const mailer = require('../config/mailer');
const sanitize = require('../bin/sanitizer');
const validators = require('../bin/validators');

// models
const User = require('../app/models/user');

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
    
    const formError = validators.validateLoginForm(email, password, req.body.role);
    if (formError) {
        req.flash('message', formError);
        return done(null, false);
    }

    email = sanitize(email);
    password = sanitize(password);
    const role = req.body.role === 'student' ? 0 : 1;
    
    User.findOne({ 'account.email': email, 'account.role': role },
    async (err, user) => {
        if (err) { return done(err, false); }

        if (!user || !await user.verifyPassword(password)) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }

        if (user.account.status === 0) {
            req.flash('message', 'Your email address is still unverified.<br>Please check your email for verification link.')
            return done(null, false);
        }
        
        if (user.account.status === 2) {
            req.flash('message', `Your account has been locked until ${user.account.unlockedAtString}.`)
            return done(null, false);
        }
        
        if (user.account.status === 4) {
            req.flash('message', 'Your account has been banned.')
            return done(null, false);
        }

        // User Schema method that sets the hashCode to null and updates lastLoggedIn date
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
    
    const formError = validators.validateSignupForm(req.body);
    if (formError) {
        req.flash('message', formError.message);
        return done(null, false);
    }

    email = sanitize(email);

    User.findOne({ 'email': email }, '_id', async (err, account) => {
        if (err) { return done(err, false); }

        if (account) {
            req.flash('message', 'Email address is already taken.');
            return done(null, false);
        }

        const fn = sanitize(req.body.firstName);
        const ln = sanitize(req.body.lastName);
        const contact = sanitize(req.body.contactNumber);
        const role = req.body.role === 'student' ? 0 : 1;
        const hash = await argon.hash(password, { timeCost: 50 });

        const newUser = new User({
            firstName: fn,
            lastName: ln,
            contactNumber: contact,
            account: {
                role: role,
                email: email,
                password: hash
            }
        });

        if (role === 0) { 
            newUser.schoolName = sanitize(req.body.schoolName); 
        } else if (req.body.licenseType) {
            const licenseType = sanitize(req.body.licenseType);
            
            if (licenseType !== '0' && licenseType !== '1' && licenseType !== '2' && licenseType !== '3') {
                req.flash('message', 'Invalid license type.');
                return done(null, false);
            }
    
            if (licenseType === '0') { newUser.license.status = 0; }
            else { newUser.license.status = 1; }
    
            newUser.license.type = licenseType;
        }

        newUser.save(err => {
            if (err) { return done(err, false); }

            mailer.sendVerificationEmail(newUser, (err) => {
                if (err) { return done(err, false); }
                req.flash(`message', 'Verification email sent to<br>${newUser.account.email}`);
                done(null, newUser);
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

    const formError = validators.validateAdminLoginForm(email, password);
    if (formError) {
        req.flash('message', formError);
        return done(null, false);
    }

    email = sanitize(email);

    User.findOne({ 'account.email': email, 'account.role': 7 }, async (err, admin) => {
        if (err) { return done(err, false); }

        if (!admin || !await admin.verifyPassword(password)) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }
        
        admin.login(err => err ? done(err, false) : done(null, admin));
    });
}));

module.exports = passport;
