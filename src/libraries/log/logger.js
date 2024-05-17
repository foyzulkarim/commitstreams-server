const os = require('os');
const fs = require('fs');
const path = require('path');

const { retrieveRequestId } = require('../../middlewares/request-context');
const { createLogger, format, transports } = require('winston');
const { Loggly } = require('winston-loggly-bulk');
require('winston-daily-rotate-file');
const argv = require('minimist')(process.argv);

const LOG_DIR = 'logs';
class LogManager {
  static instance;
  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format((info) => {
          const requestId = retrieveRequestId();
          if (requestId) {
            info.requestId = requestId;
          }
          return info;
        })()
      ),
      transports: [
        new transports.File({
          filename: `${LOG_DIR}/error.log`,
          level: 'error',
        }),
        new transports.File({ filename: `${LOG_DIR}/combined.log` }),
        new transports.DailyRotateFile({
          level: 'info',
          filename: `${LOG_DIR}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    if (argv.env !== 'production') {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        })
      );
    }
    const configPath = path.resolve(
      __dirname,
      '../../configs/config.production.json'
    );

    if (fs.existsSync(configPath)) {
      const config = require(configPath);
      if (config?.LOGGLY_TOKEN) {
        this.logger.add(
          new Loggly({
            token: config.LOGGLY_TOKEN,
            subdomain: config.LOGGLY_SUBDOMAIN || 'foyzulk2023',
            tags: [os.hostname(), argv.env],
            json: true,
          })
        );
      }
    } else {
      console.log('Production config file not found');
    }
  }

  getLogger() {
    return this.logger;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new LogManager();
    }

    return this.instance;
  }
}

module.exports = LogManager.getInstance().getLogger();
