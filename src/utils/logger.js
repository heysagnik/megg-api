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

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    // Use JSON in production, colored text in development
    (process.env.NODE_ENV === 'development')
        ? winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf((info) => {
                const { timestamp, level, message, ...meta } = info;
                let log = `${timestamp} ${level}: ${message}`;
                
                // Add metadata if present
                if (Object.keys(meta).length > 0) {
                    log += `\n  Metadata: ${JSON.stringify(meta, null, 2)}`;
                }
                
                return log;
            })
        )
        : winston.format.json()
);

const transports = [
    new winston.transports.Console(),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export default logger;
