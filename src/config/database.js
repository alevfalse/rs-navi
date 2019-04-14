module.exports = {
    prodURI:  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@rs-navi-zp6p4.mongodb.net/rs-navi?retryWrites=true`,
    devURI:   `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@rs-navi-zp6p4.mongodb.net/rs-navi-dev?retryWrites=true`,
    localURI: `mongodb://localhost:27017/rs-navi-local`
}
