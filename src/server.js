console.log('Configuring application...');
require('dotenv').config();

if (!require('./check.env')()) {
    process.exit(1);
}

// ENVIRONMENT VARIABLES
const port = process.env.PORT || 5000;
const mode = process.env.MODE;

// REQUIRED MODULES ======================================================================
const express    = require('express');
const session    = require('express-session');
const mongoose   = require('mongoose');
const morgan     = require('morgan');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo')(session);
const flash      = require('connect-flash');

// AUTHENTHICATION =======================================================================
const passport   = require('./config/passport');

// DATABASE ==============================================================================
const database   = require('./config/database');

// APPLICATION ===========================================================================
const app = express();

app.set('view engine', 'ejs'); // templating engine for dynamic pages
app.set('views', __dirname + '/views'); // folder containing the pages to be served

app.use(express.static(__dirname + '/public')); // serving static files
app.use(morgan(process.env.MODE == 'prod' ? 'combined' : 'dev')); // logging

// for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// SESSION ===============================================================================
app.use(session({
    name: 'rs-navi.session',
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 3 }, // max age of 3 days
    saveUninitialized: false,   // don't save session in the database if not modified
    resave: false,              // don't save session if unmodified
    store: new MongoStore({ 
        mongooseConnection: mongoose.connection,
        touchAfter: 60 * 60 * 24 // the session will be updated only one time in a period of 24 hours, 
        // does not matter how many request's are made (with the exception of those that change something on the session data)
    })
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for flashing messages between requests

// ROUTERS ===============================================================================
const authRouter = require('./app/routes/auth');
const validateRouter = require('./app/routes/validate');
const autocompleteRouter = require('./app/routes/autocomplete');
const placesRouter = require('./app/routes/places');
const adminRouter = require('./app/routes/admin');
const rootRouter = require('./app/routes/root');

// bind the routes to the application
app.use('/auth', authRouter);
app.use('/validate', validateRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/places', placesRouter);
app.use('/admin', adminRouter);
app.use('/', rootRouter);

console.log('Application configured.');

let uri;
switch (mode)
{
case 'dev':   uri = database.devURI;   break;
case 'prod':  uri = database.prodURI;  break;
case 'local': uri = database.localURI; break;
default: return console.error('Invalid MODE environment variable value.');
}

console.log(`Connecting to ${mode} database...`);
mongoose.connect(uri, { useNewUrlParser: true }, (err) => {
    if (err) { return console.error(`An error occurred while trying to connect to the ${mode} database:\n${err}`); }
    console.log(`Application successfully connected to ${mode} database.`);
    app.listen(port, () => {
        console.log(`${mode === 'prod' ? 'rsnavigation.com' : 'Application'} is now live and listening to port ${port}!`);
    });
});