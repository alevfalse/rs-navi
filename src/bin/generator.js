const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @description Generate a random string with the specified length
 */
module.exports = function() {
    return generate(alpha, 16);
}