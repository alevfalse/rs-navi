const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;

// Models
const Student = require('../app/models/student');
const Placeowner = require('../app/models/placeowner');
const Admin = require('../app/models/admin');

// stores the user's id in session to be used during deserialization
passport.serializeUser((user, done) => {
    console.log(`Serializing User: ${user.id}`);
    console.log(user);
    done(null, user.id);  
});

// fetches user's data from the database in every request
// using their id that is stored in session
passport.deserializeUser((id, done) => {

    console.log(`Deserializing User: ${id}`);

    process.nextTick(() => {
        Student.findById(id, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for student ID [${id}] in Deserialize User:\n${err}`)
                return done(err, false);
            }
    
            if (student) {
                console.log(`Deserialized Student: ${id}`);
                return done(null, student) // bind user to request
    
            } else {
                process.nextTick(() => {
                    Placeowner.findById(id, (err, placeowner) => {
                        if (err) {
                            console.error(`An error occurred while querying for placeowner ID [${id}] in Deserialize User:\n${err}`)
                            return done(err, false);
                        }
        
                        if (placeowner) {
                            console.log(`Deserialized Placeowner: ${id}`);
                            return done(null, placeowner);
                            
                        } else {
                            process.nextTick(() => {
                                Admin.findById(id, (err, admin) => {
                                    if (err) {
                                        console.error(`An error occurred while querying for Admin ID [${id}] in Deserialize User:\n${err}`)
                                        return done(err, false);
                                    }

                                    if (!admin) {
                                        return done(null, false)
                                    }

                                    console.log(`Deserialized Admin: ${id}`);
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

// NOTE: No need to call for req.session.save() after every req.flash() in the following code.
// It will be called on the passport.authenticate()'s callback function.

// =====================================================================================================
// STUDENT & PLACEOWNER LOGIN ==========================================================================
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

}, function(req, email, password, done) {
    console.log('Local Login Strategy Invoked');
    console.log(req.body);

    const role = req.body.role;

    if (!email || !password || !role) {
        const err = new Error(`Missing required field(s) for Local Login.`);
        console.error(err.message);
        req.flash('message', `Missing required field(s)`)
        return done(err, null);
    }

    switch (role.toLowerCase())
    {
    case 'student':
        Student.findOne({ 'account.email': email }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for student email [${email}] in Local Login:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, false);
            }

            if (!student) {
                console.log(`Email does not exist: ${email}`);
                req.flash('message', 'Invalid email or password.');
                return done(null, false);
            }

            if (password !== student.account.password) {
                console.log(`Invalid student password for ${email}`);
                req.flash('message', 'Invalid email or password.')
                return done(null, false);
            }

            student.account.lastLoggedIn = new Date();
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while updating ${student.account.email}'s Last Logged In date:\n${err}`);
                    req.flash('message', 'An error ocurred.');
                    return done(err, false);
                }
                console.log(`Student [${student.firstName} ${student.lastName}] logged in.`);
                return done(null, student);
            })
            
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for placeowner email [${email}] in Local Login:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, false);
            }

            if (!placeowner) {
                console.log(`Placeowner email does not exist: ${email}`);
                req.flash('message', 'Invalid email or password.');
                return done(null, false);
            }

            if (password !== placeowner.account.password) {
                console.log(`Invalid placeowner password for ${email}`);
                req.flash('message', 'Invalid email or password.');
                return done(null, false);
            }

            placeowner.account.lastLoggedIn = new Date();
            placeowner.save((err) => {
                if (err) {
                    console.error(`An error occurred while updating ${placeowner.account.email}'s Last Logged In date:\n${err}`);
                    req.flash('message', 'An error ocurred.');
                    return done(err, false);
                }
                console.log(`Placeowner ${placeowner.firstName} ${placeowner.lastName} logged in.`);
                return done(null, placeowner);
            })
        })
        break;

    default:
        const err = new Error(`Invalid role provided for Local Login.`);
        console.error(err.message);
        req.flash('message', `Invalid role provided.`);
        return done(err, false);
    }
}))

// additional validation on top of the client-side validation
function validateForm(firstName, lastName, email, password, confirmPassword) {
    
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

    console.log(`Form Error Message:\n${errorMessage}`);

    // check if an error occurred
    if (errorMessage.length > 0) {
        return new Error(errorMessage);
    } else {
        return null;
    }
}

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
        const err = new Error(`Missing required field(s) for Local Login.`)
        console.error(err.message);
        req.flash('message', `Missing required signup field(s).`);
        return done(err, false);
    }

    const formError = validateForm(firstName, lastName, email, password, confirmPassword);
    if (formError) {
        req.flash('message', formError.message);
        return done(formError, false);
    }

    switch (role.toLowerCase())
    {
    case 'student':
        const schoolName = req.body.schoolName;

        if (!schoolName) {
            const err = new Error(`Missing school name for Local Login.`)
            console.error(err.message);
            req.flash('message', `Missing school name.`);
            return done(err, false);
        }

        Student.findOne({ 'account.email': email }, { 'id': 1 }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for student email [${email}] in Local Signup:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, false);
            }

            if (student) {
                const err = new Error('Student email already exists.');
                console.error(err.message);
                req.flash('message', err.message);
                return done(err, false);
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
                if (err) {
                    console.error(`An error occurred while saving new student [${email}] to the database.`);
                    req.flash('message', 'An error occurred.');
                    return done(err, false);
                }

                console.log(`Student Successfully Signed Up:\n${newStudent}`);
                req.flash('message', 'Sign up successful!');
                return done(null, newStudent);
            })
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email }, { 'id': 1 }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for placeowner email [${email}] in Local Signup:\n${err}`);
                req.flash('message', 'An error occurred.');
                return done(err, null, );
            }

            if (placeowner) {
                const err = new Error('Placeowner email already exists.');
                console.error(err.message);
                req.flash('message', err.message);
                return done(err, false);
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
                if (err) {
                    console.error(`An error occurred while saving new placeowner [${email}] to the database.`);
                    req.flash('message', 'An error occurred.');
                    return done(err, false);
                }

                console.log(`Placeowner Successfully Signed Up:\n${newPlaceowner}`);
                req.flash('message', 'Sign up successful!');
                return done(null, newPlaceowner);
            })
        })
        break;
    
    default:
        const err = new Error(`Invalid role provided for Local Signup.`);
        console.error(err.message);
        req.flash('message', `Invalid role provided.`);
        return done(err, false);
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
        const err = new Error(`Missing required field(s) for Local ADMIN Login.`)
        console.error(err.message);
        req.flash('message', `Missing required login field(s).`);
        return done(err, false);
    }



    Admin.findOne({ 'account.email' : email}, (err, admin) => {
        if (err) {
            console.error(`An error occurred while querying for admin email [${email}] in Local ADMIN Login:\n${err}`);
            req.flash('message', 'An error ocurred.');
            return done(err, false);
        }

        if (!admin) {
            console.log('Admin email does not exist.');
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }

        if (password !== admin.account.password) {
            console.log('Invalid admin password.');
            req.flash('message', 'Invalid email or password.');
            return done(null, false);
        }

        admin.account.lastLoggedIn = new Date();
        admin.save((err) => {
            if (err) {
                console.error(`An error occurred while updating Admin [${admin.account.email}]'s Last Logged In date.`);
                req.flash('message', 'An error ocurred.');
                return done(err, false);
            }

            console.log(`Admin ${admin.firstName} ${admin.lastName} logged in.`);
            return done(null, admin);
        })
    })
}))

module.exports = passport;
