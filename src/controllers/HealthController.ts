import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from './BaseController';
import { HealthCheckService } from '../services/HealthCheckService';
import { Logger } from '../utils/Logger';

@injectable()
export class HealthController extends BaseController {
  constructor(
    @inject('Logger') logger: Logger,
    @inject('HealthCheckService') private healthService: HealthCheckService
  ) {
    super(logger);
  }

  // GET /health
  public getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.healthService.getHealthStatus();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      this.logger.error('Health check failed', error as Error, this.getRequestContext(req));
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  };
}