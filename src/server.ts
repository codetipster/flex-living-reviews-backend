import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { container } from './container/Container';
import routes from './routes';
import appConfig from './consts/config';
import { Logger } from './utils/Logger';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  const logger = container.get<Logger>('Logger');
  logger.error('Uncaught Exception - shutting down gracefully', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const logger = container.get<Logger>('Logger');
  logger.error('Unhandled Promise Rejection - shutting down gracefully', 
    new Error(reason), 
    { promise: promise.toString() }
  );
  process.exit(1);
});

function createApp(): Application {
  const app: Application = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    }
  }));

  app.use(compression());

  // CORS configuration
  app.use(cors({
    origin: [
      appConfig.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-ID']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Trust proxy for accurate client IP detection
  app.set('trust proxy', 1);

  // Use the enhanced routing system
  app.use('/', routes);

  return app;
}

async function startServer() {
  try {
    const logger = container.get<Logger>('Logger');
    
    const app = createApp();
    
    const server = app.listen(appConfig.PORT, () => {
      logger.info('Server started successfully', {
        port: appConfig.PORT,
        environment: appConfig.NODE_ENV,
        clientUrl: appConfig.CLIENT_URL,
        version: process.env['npm_package_version'] || '1.0.0'
      });
    });

    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal} - starting graceful shutdown`);
      
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', err);
          process.exit(1);
        }
        
        logger.info('Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { startServer, createApp };