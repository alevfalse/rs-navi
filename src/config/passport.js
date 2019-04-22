const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;
const argon = require('argon2');

const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Models
const Student = require('../app/models/student');
const Placeowner = require('../app/models/placeowner');
const Admin = require('../app/models/admin');
const Account = require('../app/models/account');

// mailer
const sendVerificationLinkEmail = require('../bin/verification-link-email');

// additional validation on top of the client-side validation
const validateSignupForm = require('../bin/validate-signup-form');

// stores the user's id in session to be used during deserialization
passport.serializeUser((user, done) => {
    done(null, user.id);  
});

// fetches user's data from the database in every request
// using their id that is stored in session
passport.deserializeUser((id, done) => {
    let query;
    switch (id[0])
    {
        case '0': query = Student.findById(id);    break;
        case '1': query = Placeowner.findById(id); break;
        case '7': query = Admin.findById(id);      break;
        default : return done(null, false);
    }
    query.populate('image account').exec((err, user) => done(err, user));
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

    let role;

    switch(roleString)
    {
        case 'student': role = 0; break;
        case 'placeowner': role = 1; break;

        default: 
            req.flash('message', 'Invalid role.');
            return done(null, false);
    }
    Account.findOne({ 'email': email, 'role': role },
    async (err, account) => {
        if (err) { return done(err, false); }

        console.log(account);

        if (!account || !await account.verifyPassword(password)) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }

        if (account.status === 0) {
            req.flash('message', 'Your email address is still unverified.\n Please check your email for verification link.')
            return done(null, false);
        } else if (account.status === 2) {
            req.flash('message', 'Your account has been temporarily suspended.')
            return done(null, false);
        } else if (account.status === 3) {
            req.flash('message', 'Your account has been permanently banned.')
            return done(null, false);
        }

        account.login(err => err ? done(err, false) : done(null, account));
    });
}));

// =====================================================================================================
// STUDENT & PLACEOWNER SIGNUP =========================================================================
passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, async function(req, email, password, done) {
    console.log('--- Local Signup Strategy ---');
    console.log(req.body);

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const confirmPassword = req.body.confirmPassword;
    const roleString = req.body.role;
    
    if (!email || !firstName || !lastName || !confirmPassword || !roleString) {
        req.flash('message', `Missing required signup field(s).`);
        return done(null, false);
    }

    const formError = validateSignupForm(firstName, lastName, email, password, confirmPassword);
    if (formError) {
        req.flash('message', formError.message);
        return done(null, false);
    }

    let role = roleString === 'student' ? 0 : 'placeowner' ? 1 : null;
    if (role === null) { 
        req.flash('message', 'Invalid role.');
        return done(null, false);
    }

    Account.findOne({ 'email': email, 'role': role }, '_id', async (err, account) => {
        if (err) { return done(err, false); }

        if (account) { 
            req.flash('message', 'Email already exists.');
            return done(null, false);
        }

        const data = {
            firstName: firstName,
            lastName: lastName,
            schoolName: req.body.schoolName
        }

        const newUser = role === 0 ? new Student(data) : new Placeowner(data);
        newUser.account = newUser._id;

        const hashedPassword = await argon.hash(password, { timeCost: 50 });

        const newAccount = new Account({
            role: role,
            _id: newUser._id,
            email: email,
            password: hashedPassword,
            hashCode: generate(alpha, 6)
        });

        newAccount.save(err => { if (err) { return done(err, false); }

        newUser.save(err => { if (err) { return done(err, false); }

        sendVerificationLinkEmail(newUser._id, newAccount, err => {
            if (err) { return done(err, false); }

            req.flash('message', 'Verification email sent.');
            return done(null, newUser);
        }); }); });
    });
}))

// =====================================================================================================
// ADMIN LOGIN =========================================================================================
passport.use('local-login-admin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {
    console.log('Local Login Strategy Invoked');
    console.log(req.body);

    if (!email || !password) {
        req.flash('message', `Missing required login field(s).`);
        return done(null, false);
    }

    Admin.findOne({ 'account.email' : email}, (err, admin) => {
        if (err) { return done(err, false); }

        if (!admin || password !== admin.account.password) {
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }
        
        admin.account.lastLoggedIn = new Date();
        admin.save((err) => {
            if (err) { return done(err, false); }
            return done(null, admin);
        })
    })
}))

module.exports = passport;

