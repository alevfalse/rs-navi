console.log('Configuring application...');

// ENVIRONMENT VARIABLES
require('dotenv').config();
if (!require('./bin/env-checker')()) { process.exit(1); }
const port = process.env.PORT || 5000;
const mode = process.env.MODE;

// REQUIRED MODULES ======================================================================
const path       = require('path');
const fs         = require('fs');
const express    = require('express');
const https      = require('https');
const session    = require('express-session');
const flash      = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const morgan     = require('morgan');
const override = require('method-override');

// AUTHENTHICATION =======================================================================
const passport   = require('./config/passport');

// ROUTERS ===============================================================================
const authRouter = require('./app/routes/auth');
const validateRouter = require('./app/routes/validate');
const autocompleteRouter = require('./app/routes/autocomplete');
const placesRouter = require('./app/routes/places');
const adminRouter = require('./app/routes/admin');
const newsletteRouter = require('./app/routes/newsletter');
const imagesRouter = require('./app/routes/images');
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

app.use(override('_method')); 

app.set('view engine', 'ejs'); // templating engine for rendering pages
app.set('views', __dirname + '/views'); // folder containing the pages to be rendered

// session
const cookieOptions = { maxAge: 1000 * 60 * 60 * 24 * 3 }; // max cookie age of 3 days

// set cookie's domain to the main domain at production
if (mode === 'prod') {
    cookieOptions.domain = '.rsnavigation.com';
    console.log(`Cookie domain set to: ${cookieOptions.domain}`);
    cookieOptions.secure = true
    console.log(`Cookie set to HTTPS only.`);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: cookieOptions,
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
app.use('/images', imagesRouter);
app.use('/validate', validateRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/newsletter', newsletteRouter);
app.use('/', rootRouter);

// This is called when no route was able handle the request
app.use(require('./bin/404-handler'));
// This is called when next is called with an error
app.use(require('./bin/error-handler'));

console.log('Application configured.');

// DATABASE CONNECTION ===================================================================
const connection = require('./config/connection');

connection.once('connected', () => {

    console.log(`Application successfully connected to ${mode} database.`);

    if (mode === 'prod') {

        const sslOptions = {
            key: fs.readFileSync('/etc/letsencrypt/live/rsnavigation.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/rsnavigation.com/fullchain.pem')
        };

        https.createServer(sslOptions, app).listen(port, () => {
            console.log(`RS Navi is now live with SSL certificate!`);
        });

    } else {
        app.listen(port, () => {
            console.log(`Application is now listening to port ${port}.`);
        });
    }
});