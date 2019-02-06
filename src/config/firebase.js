const firebaseAdmin = require('firebase-admin');

const firebaseApp = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
        projectId: process.env.PROJECT_ID,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: process.env.PRIVATE_KEY
    }),
    databaseURL: "https://rs-navi.firebaseio.com"
})

exports.database = firebaseApp.firestore();
exports.auth = firebaseApp.auth();