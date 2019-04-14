const database = require('./database');
const mongoose = require('mongoose');

const mode = process.env.MODE;

let uri;

switch (mode)
{
    case 'dev':   uri = database.devURI;   break;
    case 'prod':  uri = database.prodURI;  break;
    case 'local': uri = database.localURI; break;
    default: return console.error('Invalid MODE environment variable value.');
}

// TODO: https://mongoosejs.com/docs/guide.html#options

//use native findOneAndUpdate() rather than deprecated findAndModify()
mongoose.set('useFindAndModify', false);

// create a default mongoose connection
const connection = mongoose.connect(uri, { useNewUrlParser: true });

module.exports = connection;
