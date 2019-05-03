module.exports = function(body) {
    const { password, confirmPassword, firstName, 
        lastName, contactNumber, schoolName, role } = body;

    let errorMessage = '';

    if (!email || !password || !confirmPassword || !firstName || !lastName || !contactNumber || !role) {
        errorMessage += 'Missing required signup field(s).\n';
    } else if (role === 'student' && !schoolName) {
        errorMessage += 'Missing school name.\n';
    }

    if (role !== 'student' && role !== 'placeowner') {
        errorMessage += 'Invalid role.';
    }

    // password
    if (password.length < 8) {
        errorMessage += 'Password must be at least 8 characters.\n';
    } else if (password !== confirmPassword) {
        errorMessage += 'Passwords do not match.\n';
    }

    if (firstName.match(/[^a-zA-Zñ\s]|\s{2,}/) || firstName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'First name contains an invalid character.\n';
    } else if (firstName.length === 0) {
        errorMessage += 'First name cannot be empty.\n';
    } else if (firstName.length > 50) {
        errorMessage += 'First name must not be more than 50 characters.\n';
    }

    if (lastName.match(/[^a-zA-Zñ\s]|\s{2,}/) || lastName.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        errorMessage += 'Last name contains an invalid character.\n';
    } else if (lastName.length === 0) {
        errorMessage += 'Last name cannot be empty.\n';
    } else if (lastName.length > 50) {
        errorMessage += 'Last name must not be more than 50 characters.\n';
    }

    // contact number
    if (contactNumber.match(/[^\d+\(\)-\s]|\s{2,}/)) {
        errorMessage += 'Contact number contains an invalid character.';
    } else if (contactNumber.length < 7) {
        errorMessage += 'Contact number is too short.';
    }

    // check if an error occurred
    if (errorMessage.length > 0) {
        return new Error(errorMessage);
    } else {
        return null;
    }
}