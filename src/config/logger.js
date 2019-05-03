const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logsDirectory = path.join(__dirname, '../logs/');

fs.existsSync(logsDirectory) || fs.mkdirSync(logsDirectory);

const logger = winston.createLogger({
    format: winston.format.printf(info => `${new Date()}: ${info.level}: ${info.message}`),
    exitOnError: false,
    transports: [
        new winston.transports.Console({
            format: winston.format.printf(info => `${info.level}: ${info.message||info}`),
        }),
        new winston.transports.File({ level: 'error', filename: logsDirectory + 'error.log' }),
        new winston.transports.File({ level: 'info', filename: logsDirectory + 'combined.log' })
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            format: winston.format.printf(info => `${info.level}: ${info.message}`),
        }),
        new winston.transports.File({ filename: logsDirectory + 'exceptions.log' }),
    ]
});

logger.info('Logger instantiated');

module.exports = logger;