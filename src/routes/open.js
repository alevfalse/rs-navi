const { Router } = require('express');
const request = require('request-promise');
// const argon2 = require('argon2');
const database = require('../config/firebase').database;

/**
 * @param { Router } openRouter
 */
module.exports = function(openRouter) {
    openRouter.get('/', (req, res) => {
        res.status(200);
        res.render('index');
    })

    openRouter.get('/login/student', (req, res) => {
        res.render('login');
    })

    openRouter.post('/login/student', (req, res) => {

        database.collection('students').where('email', '==', req.body.username).get()
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

    openRouter.get('/signup/student', (req, res) => {
        res.render('signup');
    })

    openRouter.post('/signup/student', (req, res) => {

        if (req.body.password !== req.body.confirmPassword) {
            console.log('Confirm password does not match.');
            return res.redirect('/signup/student');
        }

        database.collection('students').where('email', '==', req.body.email).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    console.log(`${req.body.email} already exists.`);
                    return res.redirect('/signup/student');
                }

                const now = new Date();

                database.collection('students').add({

                    'email': req.body.email,
                    'firstname': req.body.firstname,
                    'lastname': req.body.lastname,
                    'password': req.body.password,
                    'school': req.body.school,
                    'lastLoggedIn': null,
                    'createdAt': new Date(),
                    'verified': false,

                }).then(studentDoc => {
                    res.redirect('/');
                    studentDoc.get().then(snapshot => {
                        console.log(`${snapshot.data().email} successfully signed up.`);
                    })
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

    openRouter.get('/login/placeowner', (req, res) => {
        res.render('loginPO');
    })

    openRouter.post('/login/placeowner', (req, res) => {
        res.render('loginPO');
    })

    openRouter.get('/signup/placeowner', (req, res) => {
        res.render('signupPO');
    })

    openRouter.get('/search', (req, res) => {
        console.log(req.query);
        const query = req.query.schoolname;

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