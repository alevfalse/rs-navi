const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;

// Models
const Student = require('../app/models/student');
const Placeowner = require('../app/models/placeowner');
const Admin = require('../app/models/admin');

// ===================================================================================================
// FUNCTIONS =========================================================================================

// additional validation on top of the client-side validation
function validateSignupForm(firstName, lastName, email, password, confirmPassword) {
    
    let errorMessage = '';

    // first name
    if (firstName.startsWith(' ')) {
        errorMessage += 'First name must not start with a space.\n';
    } else if (firstName.match(/[^a-zA-Zñ\s]|\s{2,}/) || firstName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'First name contains an invalid character.\n';
    } else if (firstName.length == 0) {
        errorMessage += 'First name cannot be empty.\n';
    } else if (firstName.length > 50) {
        errorMessage += 'First name must not be more than 50 characters.\n';
    }

    // last name
    if (lastName.startsWith(' ')) {
        errorMessage += 'Last name must not start with a space.\n';
    } else if (lastName.match(/[^a-zA-Zñ\s]|\s{2,}/) || lastName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'Last name contains an invalid character.\n';
    } else if (lastName.length == 0) {
        errorMessage += 'Last name cannot be empty.\n';
    } else if (lastName.length > 50) {
        errorMessage += 'Last name must not be more than 50 characters.\n';
    }
    
    // email
    if (email.startsWith(' ')) {
        errorMessage += 'Email address must not start with space.\n';
    } else if (email.match(/[^a-zA-Z0-9.@_]/)) {
        errorMessage += 'Email address contains an invalid character.\n';
    } else if (email.length == 0) {
        errorMessage += 'Email address cannot be empty.\n';
    } else if (email.length > 50) {
        errorMessage += 'Email address must not be more than 50 characters.\n';
    } // regex: if email starts/ends with @ or period || 2 or more @ || an @ is preceded by a period
    else if (!email.includes('@') || email.match(/[@.]$|^[@.]|@[^@]*@|\.@/)) {
        errorMessage += 'Invalid email address.\n';
    }

    // password
    if (password.length <= 7) {
        errorMessage += 'Password must be at least 8 characters.\n';
    } else if (password !== confirmPassword) {
        errorMessage += 'Passwords do not match.\n';
    }

    // check if an error occurred
    if (errorMessage.length > 0) {
        return new Error(errorMessage);
    } else {
        return null;
    }
}

// stores the user's id in session to be used during deserialization
passport.serializeUser((user, done) => {
    done(null, user.id);  
});

// fetches user's data from the database in every request
// using their id that is stored in session
passport.deserializeUser((id, done) => {

    process.nextTick(() => {
        Student.findById(id, (err, student) => {
            if (err) { return done(err, false); }
    
            if (student) {
                return done(null, student)

            } else {
                process.nextTick(() => {

                    Placeowner.findById(id, (err, placeowner) => {
                        if (err) { return done(err, false); }
        
                        if (placeowner) {
                            return done(null, placeowner);
                            
                        } else {
                            process.nextTick(() => {

                                Admin.findById(id, (err, admin) => {
                                    if (err) { return done(err, false); }

                                    if (!admin) {
                                        return done(null, false)
                                    }

                                    return done(null, admin);
                                });
                            });
                        }
                    });
                });
            }
        });
    });
});


// NOTE: There's no need to call for req.session.save() after every req.flash() in the following code.
// It will be called on the passport.authenticate()'s callback function.

// =====================================================================================================
// STUDENT & PLACEOWNER LOGIN ==========================================================================
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {

    const role = req.body.role;
    if (!email || !password || !role) { return done(null, false); }

    switch (role.toLowerCase())
    {
    case 'student': {
        Student.findOne({ 'account.email': email }, (err, student) => {
            if (err) { return done(err, false); }

            if (!student || password !== student.account.password) {
                req.flash('message', 'Invalid email or password.');
                return done(null, false);
            }

            if (student.account.status === 0) {
                req.flash('message', 'Your email address is still unverified.\n Please check your email for verification link.')
                return done(null, false);
            } else if (student.account.status === 2) {
                req.flash('message', 'Your account has been temporarily suspended.')
                return done(null, false);
            } else if (student.account.status === 3) {
                req.flash('message', 'Your account has been permanently banned.')
                return done(null, false);
            }

            student.account.lastLoggedIn = new Date();
            student.account.hashCode = null;
            student.save((err) => {
                if (err) { return done(err, false); }
                return done(null, student);
            })
            
        })
    } break;

    case 'placeowner': {
        Placeowner.findOne({ 'account.email': email }, (err, placeowner) => {
            if (err) { return done(err, false); }

            if (!placeowner || password !== placeowner.account.password) {
                req.flash('message', 'Invalid email or password.');
                return done(null, false);
            }

            if (placeowner.account.status === 0) {
                req.flash('message', 'Your email address is still unverified. Please check your email for verification link.')
                return done(null, false);
            } else if (placeowner.account.status === 2) {
                req.flash('message', 'Your account has been temporarily suspended.')
                return done(null, false);
            } else if (placeowner.account.status === 3) {
                req.flash('message', 'Your account has been permanently banned.')
                return done(null, false);
            }

            placeowner.account.lastLoggedIn = new Date();
            placeowner.account.hashCode = null;
            placeowner.save((err) => {
                if (err) { return done(err, false); }
                return done(null, placeowner);
            })
        })
    } break;

    default:
        req.flash('message', `Invalid role provided.`);
        return done(null, false);
    }
}));

// =====================================================================================================
// STUDENT & PLACEOWNER SIGNUP =========================================================================
passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {
    console.log('Local Signup Strategy Invoked');
    console.log(req.body);

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const confirmPassword = req.body.confirmPassword;
    const role = req.body.role;
    
    if (!email || !firstName || !lastName || !confirmPassword || !role) {
        req.flash('message', `Missing required signup field(s).`);
        return done(null, false);
    }

    const formError = validateSignupForm(firstName, lastName, email, password, confirmPassword);
    if (formError) {
        req.flash('message', formError.message);
        return done(null, false);
    }

    switch (role.toLowerCase())
    {
    case 'student': {
        const schoolName = req.body.schoolName;

        if (!schoolName) {
            req.flash('message', `Missing school name.`);
            return done(null, false);
        }

        Student.findOne({ 'account.email': email }, { 'id': 1 }, (err, student) => {
            if (err) { return done(err, false); }

            if (student) {
                req.flash('message', 'Student email already exists.');
                return done(null, false);
            }

            const newStudent = new Student({
                firstName: firstName,
                lastName: lastName,
                schoolName: schoolName,
                account: { 
                    email: email,
                    password: password
                }
            })

            newStudent.save((err) => {
                if (err) { return done(err, false); }
                return done(null, newStudent);
            });
        });
    } break;

    case 'placeowner': {
        Placeowner.findOne({ 'account.email': email }, { 'id': 1 }, (err, placeowner) => {
            if (err) { return done(err, null); }

            if (placeowner) {
                req.flash('message', 'Placeowner email already exists.');
                return done(null, false);
            }

            const newPlaceowner = new Placeowner({
                firstName: firstName,
                lastName: lastName,
                account: { 
                    email: email,
                    password: password
                }
            })

            newPlaceowner.save((err) => {
                if (err) { return done(err, false); }
                return done(null, newPlaceowner);
            });
        });
    } break;
    
    default:
        req.flash('message', `Invalid role provided.`);
        return done(null, false);
    }
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
