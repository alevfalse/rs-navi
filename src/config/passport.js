const passport = require('passport')
const LocalStrategy  = require('passport-local').Strategy;

// Models
const Student = require('../app/models/student');
const Placeowner = require('../app/models/placeowner');
const Admin = require('../app/models/admin');

// stores the user's id in session to be used during deserialization
passport.serializeUser(function(user, done) {
    console.log(`Serializing User: ${user.id}`);
    console.log(user);
    done(null, user.id);  
});

// fetches user's data from the database in every request
// using their id that is stored in session
passport.deserializeUser(function(id, done) {

    console.log(`Deserializing User: ${id}`);

    Student.findById(id, function(err, student) {

        if (err) {
            console.error(`An error occurred while querying for student ID [${id}] in Deserialize User:\n${err}`)
            return done(err, null);
        }

        if (student) {
            return done(null, student) // bind user to request

        } else {
            Placeowner.findById(id, function(err, placeowner) {
                if (err) {
                    console.error(`An error occurred while querying for placeowner ID [${id}] in Deserialize User:\n${err}`)
                    return done(err, null);
                }

                if (!placeowner) {
                    return done(null, null);
                }

                console.timeEnd('Deserialized')
                return done(null, placeowner); // bind user to request
            })
        }
    });
});

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
        return done(err, null, req.flash('message', `Missing required field(s)`));
    }

    switch (role)
    {
    case 'student':
        Student.findOne({ 'account.email': email }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for student email [${email}] in Local Login:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, null);
            }

            if (!student) {
                console.log('Email does not exist.');
                req.flash('message', 'Invalid email or password.');
                return done(null, student);
            }

            if (password !== student.account.password) {
                console.log('Invalid student password.');
                req.flash('message', 'Invalid email or password.');
                return done(null, null);
            }

            student.account.lastLoggedIn = new Date();
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while updating ${student.account.email}'s Last Logged In date.`);
                    req.flash('message', 'An error ocurred.');
                    return done(err, null);
                }
                console.log(`Student ${student.firstName} ${student.lastName} logged in.`);
                return done(null, student);
            })
            
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for placeowner email [${email}] in Local Login:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, null, );
            }

            if (!placeowner) {
                console.log('Placeowner email does not exist.');
                req.flash('message', 'Invalid email or password.');
                return done(null, null);
            }

            if (password !== placeowner.account.password) {
                console.log('Invalid placeowner password.');
                req.flash('message', 'Invalid email or password.');
                return done(null, null);
            }

            placeowner.account.lastLoggedIn = new Date();
            placeowner.save((err) => {
                if (err) {
                    console.error(`An error occurred while updating ${placeowner.account.email}'s Last Logged In date.`);
                    req.flash('message', 'An error ocurred.');
                    return done(err, null);
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
        return done(err, null);
    }
}))

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

    if (!firstName || !lastName || !confirmPassword || !role) {
        const err = new Error(`Missing required field(s) for Local Login.`)
        console.error(err.message);
        req.flash('message', `Missing required login field(s).`);
        return done(err, null);
    }

    if (confirmPassword !== password) {
        const err = new Error(`Passwords do not match.`)
        console.error(err.message);
        req.flash('message', err.message);
        return done(err, null);
    }

    switch (role)
    {
    case 'student':
        const schoolName = req.body.schoolName;

        if (!schoolName) {
            const err = new Error(`Missing school name for Local Login.`)
            console.error(err.message);
            req.flash('message', `Missing school name.`);
            return done(err, null);
        }

        Student.findOne({ 'account.email': email }, { 'id': 1 }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for student email [${email}] in Local Signup:\n${err}`);
                req.flash('message', 'An error ocurred.');
                return done(err, null, );
            }

            if (student) {
                const err = new Error('Student email already exists.');
                console.error(err.message);
                req.flash('message', err.message);
                return done(err, null);
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
                return done(err, null);
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
        return done(err, null);
    }
}))

// =====================================================================================================
// ADMIN LOGIN =========================================================================================
passport.use('local-login-admin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'

}, function(email, password, done) {
    console.log('Local Login Strategy Invoked');
    console.log(req.body);

    if (!email || !password) {
        const err = new Error(`Missing required field(s) for Local ADMIN Login.`)
        console.error(err.message);
        req.flash('message', `Missing required login field(s).`);
        return done(err, null);
    }

    Admin.findOne({ 'account.email' : email}, (err, admin) => {
        if (err) {
            console.error(`An error occurred while querying for admin email [${email}] in Local ADMIN Login:\n${err}`);
            req.flash('message', 'An error ocurred.');
            return done(err, null, );
        }

        if (!admin) {
            console.log('Admin email does not exist.');
            req.flash('message', 'Invalid email or password.');
            return done(null, null);
        }

        if (password !== admin.account.password) {
            console.log('Invalid admin password.');
            req.flash('message', 'Invalid email or password.');
            return done(null, null);
        }

        admin.account.lastLoggedIn = new Date();
        admin.save((err) => {
            if (err) {
                console.error(`An error occurred while updating Admin [${admin.account.email}]'s Last Logged In date.`);
                req.flash('message', 'An error ocurred.');
                return done(err, null);
            }

            console.log(`Admin ${admin.firstName} ${admin.lastName} logged in.`);
            return done(null, admin);
        })
    })
}))


module.exports = passport;
