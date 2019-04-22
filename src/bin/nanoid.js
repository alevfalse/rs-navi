const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @param { Number } length
 * @description Generate a random string with the specified length
 */
module.exports = function(length) {
    return generate(alpha, length);
}