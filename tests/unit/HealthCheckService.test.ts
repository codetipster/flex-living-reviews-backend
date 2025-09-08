import { HealthCheckService } from '../../src/services/HealthCheckService';

describe('HealthCheckService', () => {
  let healthService: HealthCheckService;

  beforeEach(() => {
    healthService = new HealthCheckService();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status with correct structure', async () => {
      const result = await healthService.getHealthStatus();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment', 'test');
      expect(result).toHaveProperty('checks');
    });

    it('should return checks object with all required services', async () => {
      const result = await healthService.getHealthStatus();

      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('cache');
      expect(result.checks).toHaveProperty('externalServices');
      
      expect(result.checks.database).toHaveProperty('status', 'healthy');
      expect(result.checks.cache).toHaveProperty('status', 'healthy');
      expect(result.checks.externalServices).toHaveProperty('status', 'healthy');
    });

    it('should use NODE_ENV from environment', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      
      const result = await healthService.getHealthStatus();
      expect(result.environment).toBe('production');
      
      process.env['NODE_ENV'] = originalEnv;
    });

    it('should default to development when NODE_ENV is not set', async () => {
      const originalEnv = process.env['NODE_ENV'];
      delete process.env['NODE_ENV'];
      
      const result = await healthService.getHealthStatus();
      expect(result.environment).toBe('development');
      
      process.env['NODE_ENV'] = originalEnv;
    });
  });
});
