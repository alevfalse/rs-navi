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
const rootRouter = require('./app/routes/root');

// APPLICATION ===========================================================================
const app = express();

if (mode === 'prod') { app.enable('trust proxy'); }

app.use(express.static(__dirname + '/public')); // serving static files

// logging
const logDirectory = path.join(__dirname + '/logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory); // create logs folder if it does not exist
app.use(morgan('dev'));
app.use(morgan('common', { stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' }) }));

// for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // templating engine for dynamic pages
app.set('views', __dirname + '/views'); // folder containing the pages to be served


// session
const cookie = { maxAge: 1000 * 60 * 60 * 24 * 3 };
if (mode === 'prod') cookie.domain = '.rsnavigation.com';
app.use(session({
    name: 'rs-navi.session',
    secret: process.env.SESSION_SECRET,
    cookie: cookie,
    saveUninitialized: true,   // don't save session in the database if not modified
    resave: true,              // don't save session if unmodified
    store: new MongoStore({ 
        mongooseConnection: mongoose.connection
        //touchAfter: 60 * 60 * 24 // the session will be updated only one time in a period of 24 hours, 
        // does not matter how many request's are made (with the exception of those that change something on the session data)
    })
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for flashing messages between requests

// bind the routes to the application
app.use('/auth', authRouter);
app.use('/validate', validateRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/places', placesRouter);
app.use('/admin', adminRouter);
app.use('/', rootRouter);

console.log('Application configured.');

connection.once('connected', () => {
    console.log(`Application successfully connected to ${mode} database.`);
    app.listen(port, () => {
        console.log(`${mode === 'prod' ? 'rsnavigation.com is now live and' : 'RS Navi (Dev) is now '} listening to port ${port}!`);
    });
})