const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @param { Number } length - the length of the id, defaults to 10
 * @description Generate a random string with the specified length
 */
module.exports = function(length=10) {
    return generate(alpha, length);
}