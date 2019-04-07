console.log('Configuring application...');

// ENVIRONMENT VARIABLES
require('dotenv').config();
if (!require('./check.env')()) { process.exit(1); }
const port = process.env.PORT || 5000;
const mode = process.env.MODE;

// REQUIRED MODULES ======================================================================
const path       = require('path');
const rfs        = require('rotating-file-stream');
const fs         = require('fs');
const express    = require('express');
const session    = require('express-session');
const flash      = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const morgan     = require('morgan');

// AUTHENTHICATION =======================================================================
const passport   = require('./config/passport');

// DATABASE CONNECTION ===================================================================
const connection = require('./config/connection');

// ROUTERS ===============================================================================
const authRouter = require('./app/routes/auth');
const validateRouter = require('./app/routes/validate');
const autocompleteRouter = require('./app/routes/autocomplete');
const placesRouter = require('./app/routes/places');
const adminRouter = require('./app/routes/admin');
const newsletteRouter = require('./app/routes/newsletter');
const rootRouter = require('./app/routes/root');

// APPLICATION ===========================================================================
const app = express();

// enable when behind a reverse proxy during production
if (mode === 'prod') { 
    app.enable('trust proxy');
    console.log('Trust Proxy enabled.') 
}

app.use(express.static(path.join(__dirname + '/public')));
app.use('/favicon.ico', express.static(__dirname + '/public/images/favicon.ico'));

// logging
const logDirectory = path.join(__dirname + '/logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory); // create logs folder if it does not exist
app.use(morgan(mode === 'dev' ? 'dev' : 'common'));
app.use(morgan('common', { stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' }) }));

// for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // templating engine for rendering pages
app.set('views', __dirname + '/views'); // folder containing the pages to be rendered

// session
const cookie = { maxAge: 1000 * 60 * 60 * 24 * 3 }; // max cookie age of 3 days
if (mode === 'prod') cookie.domain = '.rsnavigation.com'; // set cookie's domain to the main domain at production
app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: cookie,
    saveUninitialized: true, // save the session immediately even if not modified
    resave: true, // resave the session in every request
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for flashing messages between requests

// bind the routes to the application
app.use('/auth', authRouter);
app.use('/places', placesRouter);
app.use('/admin', adminRouter);
app.use('/validate', validateRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/newsletter', newsletteRouter);
app.use('/', rootRouter);

// ERROR HANDLERS ======================================================
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// This is invoked when next is called with an error
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    let title, message;

    console.log('ERROR: ' + res.statusCode);

    switch (res.statusCode)
    {
        case 401: {
            title = '401 Unauthorized';
            message = 'Not for your eyes.';
        } break;

        case 404: {
            title = '404 Not Found';
            message = 'Sorry, we could\'t find the page you are looking for.';
        } break;

        default: { // status 500
            console.error(err); // TODO: Write server errors to a log file
            title = '500 Internal Server Error T_T';
            message = 'Something went wrong. Our lazy devs are onto it.';
        }
    }

    res.render('error', { title: title, message: message });
});

console.log('Application configured.');

connection.once('connected', () => {
    console.log(`Application successfully connected to ${mode} database.`);
    app.listen(port, () => {
        console.log(`${mode === 'prod' ? 'rsnavigation.com is now live and' : 'RS Navi (Dev) is now'} listening to port ${port}!`);
    });
})