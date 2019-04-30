const newsletterRouter = require('express').Router();
const Subscriber = require('../models/subscriber');
const sanitizer = require('../../bin/sanitizer');

newsletterRouter.post('/', sanitizer, (req, res, next) => {

    Subscriber.findOne({ 'email': req.body.email }, '_id', (err, subscriber) => {
        if (err) { return next(err); }

        if (subscriber) { 
            req.flash('message', 'Your email address is already subscribed.');
            req.session.save(err => err ? next(err) : res.redirect('/'));

        } else {
            const newSubscriber = new Subscriber({ email: req.body.email });

            newSubscriber.save(err => {
                if (err) { return next(err); }

                req.flash('message', 'Subscribed to newsletter.');
                req.session.save(err => err ? next(err) : res.redirect('/'));
                
                new Audit({ executor: newSubscriber._id, action: 30, actionType: 'CREATE' }).save(console.error);
            });
        }
    });
});

module.exports = newsletterRouter;
