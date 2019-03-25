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

const connection = mongoose.createConnection(uri, { useNewUrlParser: true });

connection.on('disconnected', () => { console.error(`Disconnected from ${mode} database.`)});
connection.on('close', () => { console.error(`Database connection closed.`)});
connection.on('reconnected', () => { console.log(`Reconnected to ${mode} database.`)});
connection.on('error', (err) => { console.error(`Database ERROR:\n${err}`) } );

module.exports = connection;