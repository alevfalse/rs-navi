const val = require('validator');

function undef(x) {
    return typeof x === 'undefined';
}

/**
 * @description returns true if the hash code is valid
 */
exports.validateHashCode = function(hashCode) {

    if (undef(hashCode)) {
        return false;
    }

    if (val.isEmpty(hashCode) || !val.isAlphanumeric(hashCode)) {
        return false;
    }

    return true;
}

exports.validateLoginForm = function(email, password, role) {

    if (undef(email) || undef(password) || undef(role)) {
        return 'Missing required signup fields.';
    }

    if (val.isEmpty(email) || val.isEmpty(password) || val.isEmpty(role)) {
        return 'Missing required signup fields.';
    }

    if (!val.isEmail(email)) {
        return 'Invalid email address form.';
    }

    if (role !== 'student' && role !== 'placeowner') {
        return 'Invalid role.';
    }

    return null;
}

exports.validateSignupForm = function(body) {

    if (undef(body)) { return 'Missing required signup fields.'; }

    const { email, password, confirmPassword, firstName, 
            lastName, contactNumber, role, schoolName } = body;

    if (undef(email) || undef(password) || undef(confirmPassword) || undef(firstName) 
        || undef(lastName) || undef(contactNumber) || undef(role))
    {
        return 'Missing required signup fields.';
    }

    if (val.isEmpty(email) || val.isEmpty(password) || val.isEmpty(confirmPassword) || val.isEmpty(firstName)
        || val.isEmpty(lastName) || val.isEmpty(contactNumber) || val.isEmpty(role)) 
    {
        return 'Missing required signup fields.';
    }
    
    if (!val.isEmail(email)) {
        return 'Invalid email address form.';
    }

    // password
    if (password.length < 8)           { return 'Password must be at least 8 characters.'; } 
    if (password.length > 24)          { return 'Password must not be more than 24 characters.'; } 
    if (password !== confirmPassword)  { return 'Passwords do not match.'; }

    // first name
    if (firstName.match(/[^a-zA-Zñ\s]/)) { return 'First name contains invalid character(s).'; }
    if (firstName.length > 50)   { return 'First name is too long.' }

    // last name
    if (lastName.match(/[^a-zA-Zñ\s]/)) { return 'Last name contains invalid character(s).'; }
    if (lastName.length > 50)   { return 'Last name is too long.' }

    // contact number
    if (!val.isNumeric(contactNumber)) { return 'Contact number must only contain numbers.'; }
    if (contactNumber.length < 7)      { return 'Contact number is too short.'; }
    if (contactNumber.length > 12)     { return 'Contact number is too long.'; }
    
    // role
    if (role !== 'student' && role !== 'placeowner') { return 'Invalid role.'; }

    // student's school name
    if (role === 'student') {
        if (undef(schoolName) || val.isEmpty(schoolName)) { return 'Missing school name.'; }
        if (schoolName.match(/[^a-zA-Zñ\s]/)) { return 'School name contains invalid character(s).'}
        if (schoolName.length > 50)           { return 'School name is too long. '}
    }

    return null;
}

exports.validateForgotPasswordForm = function(email, role) {

    if (undef(email) || undef(role) || val.isEmpty(email) || val.isEmpty(role)) {
        return 'Missing required signup fields.';
    }

    if (!val.isEmail(email)) {
        return 'Invalid email address form.';
    }
    
    if (role !== 'student' && role !== 'placeowner') {
        return 'Invalid role.';
    }
        
    return null;
}

exports.validateResetPasswordForm = function(hashCode, password, confirm) {
    if (undef(hashCode) || undef(password) || undef(confirm)) {
        return 'Missing required reset password fields.';
    }

    if (val.isEmpty(hashCode) || val.isEmpty(password) || val.isEmpty(confirm)) {
        return 'Missing required reset password fields.';
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters.';
    }

    if (password.length > 24) {
        return 'Password must not be more than 24 characters.';
    }
    
    if (password !== confirm) {
        return 'Passwords do not match.';
    }

    return false;
}

exports.validateAdminLoginForm = function(email, password) {

    if (undef(email) || undef(password) || val.isEmpty(email) || val.isEmpty(password)) {
        return 'Missing required signup fields.';
    }

    if (!val.isEmail(email)) {
        return 'Invalid email address form.';
    }

    return null;
}

exports.validateAddPlaceForm = function(body) {
    
}

