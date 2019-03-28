const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

const Query = require('../models/query');

// a middle to check if a user is logged in
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    
    req.flash('message', 'Unauthorized!');
    return res.redirect('/auth');
}

openRouter.get('/', (req, res) => {

    req.session.save((err) => {
        const flashMessage = req.flash('message');
        console.log('Flash Message: ' + flashMessage);
        if (err) { 
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        res.render('index', { user: req.user, message: flashMessage },
            (err, html) => {
                if (err) { 
                    console.error(err);
                    return res.sendStatus(500); 
                }

                return res.send(html);
            }
        );
    });
});

openRouter.get('/search', (req, res) => {

    const query = req.query.schoolName;

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        return res.redirect('/');

    } else if (query.length <= 1) {
        req.flash('message', 'School name is too short.');
        return res.redirect('/');
    }

    const newQuery = new Query({ keyword: query });

    newQuery.save((err, savedQuery) => {
        if (err) { console.error(err); }
        else console.log(`Search query "${savedQuery.keyword}" has been saved to the database.`);
    })

    const uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
    + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=ph`;

    request(uri).then(response => {
        const data = JSON.parse(response);
        return res.json(data.features); // update for user friendly format
    }).catch(err => { 
        console.error(err)
        req.flash('message', 'An error occurred. Please try searching again later.');
        return res.redirect('/');
    });
})

openRouter.get('/profile', isAuthenticated, (req, res) => {

    req.session.save((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        res.render('profile', { user: req.user, message: req.flash('message') },
            (err, html) => {
                if (err) { 
                    console.error(err);
                    return res.sendStatus(500); // TODO: Send custom status 500 page
                }
                
                return res.send(html);
            }
        );
    });
});

module.exports = openRouter;