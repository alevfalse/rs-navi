require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');

const app = express();

app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})
app.listen(process.env.PORT, () => {
    console.log(`Application is now listening to http://localhost:${process.env.PORT}`);
})
