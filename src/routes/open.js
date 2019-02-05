const { Router } = require('express');

/**
 * @param { Router } openRouter
 */
module.exports = function(openRouter) {
    openRouter.get('/', (req, res) => {
        res.render('index');
    })
}