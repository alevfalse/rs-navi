require('dotenv').config();

if (!process.env.PRIVATE_KEY) {
    return console.error('No PRIVATE KEY found. Check your .env file.');
}

// REQUIRED MODULES ======================================================================
const express    = require('express');
const morgan     = require('morgan');
const bodyParser = require('body-parser');
const multer     = require('multer');

// ROUTERS ===============================================================================
const openRouter = require('./app/routes/open');
const authRouter = require('./app/routes/auth');

// APPLICATION ===========================================================================
const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', openRouter);
app.use('/auth', authRouter);

app.listen(process.env.PORT || 8080, () => {
    console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
});