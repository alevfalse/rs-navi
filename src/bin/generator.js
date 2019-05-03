const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @description Generate a random string with the specified length
 */
module.exports = function() {
    return Date.now().toString(36) + generate(alpha, 8);
}