const { Router } = require('express');
const request = require('request-promise');
// const argon2 = require('argon2');
const database = require('../config/firebase').database;

/**
 * @param { Router } openRouter
 */
module.exports = function(openRouter) {
    openRouter.get('/', (req, res) => {
        console.log(`Client I.P. Address: ${req.ip}`);
        res.status(200);
        res.render('index');
    })

    openRouter.get('/login', (req, res) => {
        res.render('login');
    })

    openRouter.post('/login', (req, res) => {

        database.collection('students').where('username', '==', req.body.username).get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    console.log('Invalid username.');
                    return res.redirect('/login');
                }

                querySnapshot.forEach(docSnapshot => {
                    let data = docSnapshot.data();

                    if (data.password == req.body.password) {
                        console.log('Successfully logged in.');

                        docSnapshot.ref.update({
                            'lastLoggedIn': new Date()
                        }).catch(err => console.error(err));

                        return res.redirect('/');
                    } else {
                        console.log('Invalid password.');
                        return res.redirect('/login');
                    }

                    /*
                     * Temporarility removed
                     *
                    argon2.verify(data.password, req.body.password).then(matched => {
                        if (matched) {
                            console.log('Successfully logged in.');
                            docSnapshot.ref.update({
                                'lastLoggedIn': new Date()
                            }).catch(err => console.error(err));
                            return res.redirect('/');
                        } else {
                            console.log('Invalid password.');
                            return res.redirect('/login');
                        }
                    }).catch(err => console.error(err));
                    */
                })
            })
            .catch(err => console.error(err));
    })

    openRouter.get('/signup', (req, res) => {
        res.render('signup');
    })

    openRouter.post('/signup', (req, res) => {

        database.collection('students').where('username', '==', req.body.username).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    console.log('Username already exists.');
                    return res.redirect('/signup');
                }

                database.collection('students').add({
                    'username': req.body.username,
                    'password': req.body.password,
                    'createdAt': new Date()
                }).then(studentDoc => {
                    res.redirect('/');
                }).catch(err => console.error(err));

                /*
                 * Temporarility removed
                 *
                argon2.hash(req.body.password).then(hashedPassword => {
                    database.collection('students').add({
                        'username': req.body.username,
                        'password': hashedPassword,
                        'createdAt': new Date()
                    }).then(studentDoc => {
                        res.redirect('/');
                    }).catch(err => console.error(err));
                }).catch(err => console.error(err));*/

            }).catch(err => console.error(err));
    })

    openRouter.get('/search', (req, res) => {
        console.log(req.query);
        const query = req.query.school_name;

        database.collection('queries').add({
            'query': query,
            'date': new Date()
        }).then(docRef => {
            console.log(`Saved to queries collection: ${query}`);
        }).catch(err => {
            console.error(err);
        })

        if (process.env.MAPBOX_ACCESS_TOKEN) {
            const uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
            + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=ph`;

            console.log(uri);

            request(uri).then(response => {
                const data = JSON.parse(response);
                console.log(data.features);
                res.send(data.features);
            }).catch(err => console.error(err));

        } else {
            console.error('No MAPBOX ACCESS TOKEN in your .env file.');
            res.redirect('/');
        }
    })
}