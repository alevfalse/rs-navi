const newsletterRouter = require('express').Router();
const Subscriber = require('../models/subscriber');

newsletterRouter.post('/', (req, res, next) => {

    process.nextTick(() => {

        Subscriber.findOne({ 'email': req.body.email }, '_id',
        (err, subscriber) => {
            if (err) { return next(err); }
    
            if (subscriber) { 
                req.flash('message', 'Your email address is already subscribed.');
                req.session.save((err) => {
                    if (err) { return next(err); }
                    res.redirect('/');
                });
    
            } else {
                const newSubscriber = new Subscriber({ email: req.body.email });
    
                newSubscriber.save((err) => {
                    if (err) { return next(err); }
            
                    req.flash('message', 'Successfully subscribed to newsletter.');
                    req.session.save((err) => {
                        if (err) { return next(err); }
                        res.redirect('/');
                    });
                });
            }
        });
    });
});

module.exports = newsletterRouter;