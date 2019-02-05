require('dotenv').config();

// REQUIRED MODULES ======================================================================
const express    = require('express');
const morgan     = require('morgan');
const bodyParser = require('body-parser');
const multer     = require('multer');

// ROUTERS ================================================================================
const openRouter     = express.Router();

require('./routes/open')(openRouter);
const studentRouter  = express.Router();
const landlordRouter = express.Router();
const adminRouter    = express.Router();

// APPLICATION ===========================================================================
const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', openRouter);

app.listen(process.env.PORT, () => {
    console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
})
