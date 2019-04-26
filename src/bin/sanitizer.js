/**
 * @description A middleware that checks for html tags in the request parameters and body
 */
function sanitizer(req, res, next) {
    console.time('Passed');
    console.log(`\nSanitizing: ${req.originalUrl}`);
    console.log('---Params---');
    console.log(req.params);
    console.log('---Body---');
    console.log(req.body);

    for (let prop in req.params) {
        if (req.params[prop].match(/<[a-z][\s\S]*>/)) {
            console.warn(`XSS Detected at ${req.originalUrl}:\n${req.params[prop]}\n----------\n`);
            req.flash('message', 'Bad request.');
            return req.session.save(err => err ? next(err) : res.redirect('/'));
        }
    }

    for (let prop in req.body) {
        if (req.body[prop].match(/<[a-z][\s\S]*>/)) {
            console.warn(`XSS Detected at ${req.originalUrl}:\n${req.params[prop]}\n----------\n`);
            req.flash('message', 'Bad request.');
            return req.session.save(err => err ? next(err) : res.redirect('/'));
        }
    }

    console.timeEnd('Passed');
    next();
}

module.exports = sanitizer;