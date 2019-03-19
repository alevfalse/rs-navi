require('dotenv').config();

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

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.disable('etag');

app.use(express.static(__dirname + '/public')); // serving static files
app.use(morgan('dev')); // logging
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'cookie cutter',
    saveUninitialized: false,   // don't create session until something stored
    resave: false,              // don't save session if unmodified
    store: new MongoStore({ 
        mongooseConnection: mongoose.connection,
        ttl: 1 * 24 * 60 * 60,  // max age of 1 day
        touchAfter: 1 * 60 * 60 // session will be updated every hour except when session data is changed
    }),
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 

// ROUTERS ===============================================================================
const rootRouter = require('./app/routes/root');
const authRouter = require('./app/routes/auth');
const validateRouter = require('./app/routes/validate');
const autocompleteRouter = require('./app/routes/autocomplete');
const adminRouter = require('./app/routes/admin');

// bind the routes to the application
app.use('/auth', authRouter);
app.use('/validate', validateRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/admin', adminRouter);
app.use('/', rootRouter);

console.log('Application configured.');

console.log(`Connecting to MongoDB: ${database.uri}`);
mongoose.connect(database.uri, { useNewUrlParser: true }, (err) => {
    if (err) return console.error(err);
    console.log('Connected to database!');
    app.listen(process.env.PORT || 8080, () => {
        console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
    });
})