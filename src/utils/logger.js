import winston from 'winston';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const getFormat = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        );
    }

    return winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
    );
};

const transports = [
    new winston.transports.Console(),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    format: getFormat(),
    transports,
});

export default logger;
