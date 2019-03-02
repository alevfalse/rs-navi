require('dotenv').config();

// REQUIRED MODULES ======================================================================
const express    = require('express');
const morgan     = require('morgan');
const bodyParser = require('body-parser');
const multer     = require('multer');

// ROUTERS ===============================================================================
const openRouter     = express.Router();
require('./routes/open')(openRouter);

// APPLICATION ===========================================================================
const app = express();

app.enable('trust proxy');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', openRouter);

if (process.env.PRIVATE_KEY) {
    app.listen(process.env.PORT, () => {
        console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
    });
} else {
    console.error('No PRIVATE KEY found in environment variables.');
}


