const autocompleteRouter = require('express').Router();
const School = require('../models/school');

function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

autocompleteRouter.get('/schools', (req, res) => {
    const query = regexEscape(req.query.query);

    if (!query || query.length <= 2) {
        return res.json({ suggestions: [] });
    }

    const regex = new RegExp(query, 'i');

    process.nextTick(() => {
        School.find({ 'name': { $regex : regex } }, { 'name': 1 }, (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ suggestions: [] });
            }
    
            if (result.length == 0) {
                return res.json({ suggestions: [] });
            }
    
            let schools = [];
            
            result.forEach((school) => {
                schools.push(school.name);
            })
    
            schools.sort();
            
            res.json({ suggestions: schools });
        });
    });
});

autocompleteRouter.get('/*', (req, res) => {
    req.flash('message', 'Page not found.');
    req.session.save((err) => {
        if (err) { console.error(err); }
        res.redirect('/');
    })
});

module.exports = autocompleteRouter;