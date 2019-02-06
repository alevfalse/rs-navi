const { Router } = require('express');
const argon2 = require('argon2');
const database = require('../config/database');
/**
 * @param { Router } openRouter
 */
module.exports = function(openRouter) {
    openRouter.get('/', (req, res) => {
        database.collection('views').add({
            'visitDate': new Date()
        }).then(docRef => {
            res.render('index');
        }).catch(err => console.error(err));
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
                })
            })
            .catch(err => console.error(err));
    })

    openRouter.get('/signup', (req, res) => {
        res.render('signup');
    })

    openRouter.post('/signup', (req, res) => {
        argon2.hash(req.body.password).then(hashedPassword => {
            database.collection('students').add({
                'username': req.body.username,
                'password': hashedPassword,
                'createdAt': new Date()
            }).then(studentDoc => {
                res.redirect('/');
            }).catch(err => console.error(err));
        }).catch(err => console.error(err));
    })
}