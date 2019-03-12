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

// ROUTERS ===============================================================================
const openRouter = require('./app/routes/open');
const authRouter = require('./app/routes/auth');

// APPLICATION ===========================================================================
const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'anystringoftext',
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection,
                            ttl: 3 * 24 * 60 * 60 }) // (1 hour) max session timeout in seconds
}))

app.use(passport.initialize());
app.use(passport.session());    // uses the session above
app.use(flash()); 

// bind the routes to the application
app.use('/', openRouter);
app.use('/auth', authRouter);

console.log('Application configured.');

console.log(`Connecting to MongoDB: ${database.uri}`);
mongoose.connect(database.uri, { useNewUrlParser: true }, (err) => {
    if (err) return console.error(err);
    console.log('Connected to database!');
    app.listen(process.env.PORT || 8080, () => {
        console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
    });
})