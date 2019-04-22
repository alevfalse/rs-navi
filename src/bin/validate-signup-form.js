module.exports = function(firstName, lastName, email, password, confirmPassword) {
    
    let errorMessage = '';

    // first name
    if (firstName.startsWith(' ')) {
        errorMessage += 'First name must not start with a space.\n';
    } else if (firstName.match(/[^a-zA-Zñ\s]|\s{2,}/) || firstName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'First name contains an invalid character.\n';
    } else if (firstName.length === 0) {
        errorMessage += 'First name cannot be empty.\n';
    } else if (firstName.length > 50) {
        errorMessage += 'First name must not be more than 50 characters.\n';
    }

    // last name
    if (lastName.startsWith(' ')) {
        errorMessage += 'Last name must not start with a space.\n';
    } else if (lastName.match(/[^a-zA-Zñ\s]|\s{2,}/) || lastName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'Last name contains an invalid character.\n';
    } else if (lastName.length === 0) {
        errorMessage += 'Last name cannot be empty.\n';
    } else if (lastName.length > 50) {
        errorMessage += 'Last name must not be more than 50 characters.\n';
    }
    
    // email
    if (email.startsWith(' ')) {
        errorMessage += 'Email address must not start with space.\n';
    } else if (email.match(/[^a-zA-Z0-9.@_]/)) {
        errorMessage += 'Email address contains an invalid character.\n';
    } else if (email.length === 0) {
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