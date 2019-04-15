module.exports = function(inputEmail, role) {
    let errorMessage = '';

    if (!inputEmail) {
        errorMessage += 'No email address provided.\n';
    } else if (!role) {
        errorMessage += 'No role provided.\n';
    } else if (inputEmail.startsWith(' ')) {
        errorMessage += 'Email address must not start with space.\n';
    } else if (inputEmail.match(/[^a-zA-Z0-9.@_]/)) {
        errorMessage += 'Email address contains an invalid character.\n';
    } else if (inputEmail.length == 0) {
        errorMessage += 'Email address cannot be empty.\n';
    } else if (inputEmail.length > 50) {
        errorMessage += 'Email address must not be more than 50 characters.\n';
    } // regex: if email starts/ends with @ or period || 2 or more @ || an @ is preceded by a period
    else if (!inputEmail.includes('@') || inputEmail.match(/[@.]$|^[@.]|@[^@]*@|\.@/)) {
        errorMessage += 'Invalid email address.\n';
    }

    return (errorMessage.length > 0 ? new Error(errorMessage) : null);
}