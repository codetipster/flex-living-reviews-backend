// src/container/Container.ts
import { Container } from 'inversify';
import { InMemoryReviewRepository } from '../database/repositories/InMemoryReviewRepository';
import { ReviewRepository } from '../database/repositories/ReviewRepository';
import { ReviewService } from '../services/ReviewService';
import { IReviewService } from '../services/interfaces/IReviewService';
import { CacheService, InMemoryCacheService } from '../services/CacheService';
import { ValidationService } from '../services/ValidationService';
import { Logger, ConsoleLogger } from '../utils/Logger';
import { ErrorHandler } from '../middlewares/ErrorHandler';
import { RequestLogger } from '../middlewares/RequestLogger';
import { ExternalReviewProvider, HostawayProvider } from '../services/providers/ExternalReviewProvider';
import { HealthCheckService } from '../services/HealthCheckService';
import { ReviewController } from '../controllers/ReviewController';
import { ManagerController } from '../controllers/ManagerController';
import { PublicController } from '../controllers/PublicController';
import { HealthController } from '../controllers/HealthController';

const container = new Container();

// Core services
container.bind<Logger>('Logger').to(ConsoleLogger).inSingletonScope();
container.bind<CacheService>('CacheService').to(InMemoryCacheService).inSingletonScope();
container.bind<ValidationService>('ValidationService').to(ValidationService).inSingletonScope();

// Repositories
container.bind<ReviewRepository>('ReviewRepository').to(InMemoryReviewRepository).inSingletonScope();

// External providers
container.bind<ExternalReviewProvider>('ExternalReviewProvider').to(HostawayProvider).inSingletonScope();

// Business services
container.bind<IReviewService>('ReviewService').to(ReviewService).inSingletonScope();
container.bind<HealthCheckService>('HealthCheckService').to(HealthCheckService).inSingletonScope();

// Middleware
container.bind<ErrorHandler>('ErrorHandler').to(ErrorHandler).inSingletonScope();
container.bind<RequestLogger>('RequestLogger').to(RequestLogger).inSingletonScope();

// Controllers
container.bind<ReviewController>('ReviewController').to(ReviewController).inSingletonScope();
container.bind<ManagerController>('ManagerController').to(ManagerController).inSingletonScope();
container.bind<PublicController>('PublicController').to(PublicController).inSingletonScope();
container.bind<HealthController>('HealthController').to(HealthController).inSingletonScope();

export { container };