const logger = require('./config/logger');
logger.info('Configuring application...');

// ENVIRONMENT VARIABLES
require('dotenv').config();
if (!require('./bin/env-checker')()) { process.exit(1); }
const port = process.env.PORT || 5000;
const mode = process.env.MODE;

// REQUIRED MODULES ======================================================================
const path       = require('path');
const fs         = require('fs');
const express    = require('express');
const subdomain  = require('express-subdomain');
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
const adminRouter = require('./app/routes/admin');
const authRouter = require('./app/routes/auth');
const placesRouter = require('./app/routes/places');
const profileRouter = require('./app/routes/profile');
const rootRouter = require('./app/routes/root');

// APPLICATION ===========================================================================
const app = express();

// enable when behind a reverse proxy during production
if (mode === 'prod') { 
    app.enable('trust proxy');
    logger.info('Trust Proxy enabled.') 
}

app.use(express.static(path.join(__dirname + '/public')));
app.use('/favicon.ico', express.static(__dirname + '/public/images/favicon.ico'));

// access logs
const logDirectory = path.join(__dirname + '/logs/');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory); // create logs folder if it does not exist

// console
app.use(morgan(mode === 'prod' ? 'common' : 'dev', {
    skip: (req, res) => req.url.endsWith('.jpg') || req.url.endsWith('image') // skip image request from image routes
}));

// log file
app.use(morgan('common', { 
    stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), 
    { flags: 'a' }),
    skip: (req, res) => req.url.endsWith('.jpg') || req.url.endsWith('image')
}));

// for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(override('_method')); 

app.set('view engine', 'ejs'); // templating engine for rendering pages
app.set('views', __dirname + '/views'); // folder containing the pages to be rendered

// session
const cookieOptions = { maxAge: 1000 * 60 * 60 * 24 * 1 }; // max cookie age of 1 day

// set cookie's domain to the main domain at production for it to 
// be accessible by all subdomains e.g. www. and admin.
if (mode === 'prod') {
    //cookieOptions.domain = '.rsnavigation.com'; // TODO
    //logger.info(`Cookie domain set to: ${cookieOptions.domain}`);
    cookieOptions.secure = true
    logger.info(`Cookie set to HTTPS only.`);
} else {
    //cookieOptions.domain = '.localhost.com'; // TODO
    //logger.info(`Cookie domain set to: ${cookieOptions.domain}`);
}

// TODO: Fix sessions, share www. and rsnavigation.com, but different for admin.rsnavigation.com
app.use(session({
    name: 'rsnavi',
    cookie: cookieOptions,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true, // save the session immediately even if not modified
    resave: true, // resave the session in every request
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for flashing messages between requests

app.use(subdomain('admin', adminRouter)); // admin.rsnavigation.com

// bind the routes to the application; the order is important
app.use('/auth', authRouter);
app.use('/places', placesRouter);
app.use('/profile', profileRouter);
app.use('/', rootRouter);

// This is called when no route was able handle the request
app.use(require('./bin/404-handler'));
// This is called when next is called with an error
app.use(require('./bin/error-handler'));

logger.info('Application configured.');

// DATABASE CONNECTION ===================================================================
const connection = require('./config/connection');

connection.then((client) => {
    logger.info(`Application successfully connected to ${client.connection.db.databaseName}.`);

    if (mode === 'prod') {

        const sslOptions = {
            key: fs.readFileSync('/etc/letsencrypt/live/rsnavigation.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/rsnavigation.com/fullchain.pem')
        };

        https.createServer(sslOptions, app).listen(port, () => {
            logger.info(`RS Navi is now live with secure connection!`);
        });

    } else {
        app.listen(port, () => {
            logger.info(`Application is now listening to port ${port}.`);
        });
    }
});
