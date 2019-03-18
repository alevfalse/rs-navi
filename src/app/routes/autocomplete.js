const autocompleteRouter = require('express').Router();
const School = require('../models/school');

function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

autocompleteRouter.get('/schools', (req, res) => {
    const query = regexEscape(req.query.query);
    const regex = new RegExp(query, 'i');

    console.log(`Regex: ${regex}`);
    
    let schools = [];

    School.find({ 'name': { $regex : regex } }, { 'name': 1 }, (err, result) => {
        if (err) {
            console.log(err);
            return res.json(null);
        }

        result.forEach((school) => {
            schools.push(school.name);
        })

        schools.sort();
        
        res.json({ suggestions: schools });
    })
})

autocompleteRouter.get('/*', (req, res) => {
    res.sendStatus(404);
})

module.exports = autocompleteRouter;