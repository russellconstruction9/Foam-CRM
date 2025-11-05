import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create transports
const transports = [];

// Console transport for development
if (nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel
    })
  );
} else {
  // JSON format for production
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: logLevel
    })
  );
}

// File transports for production
if (nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Stream for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};