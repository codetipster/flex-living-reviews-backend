import { Request, Response } from 'express';
import { HealthController } from '../../src/controllers/HealthController';
import { HealthCheckService } from '../../src/services/HealthCheckService';
import { Logger } from '../../src/utils/Logger';

// Mock the dependencies
jest.mock('../../src/services/HealthCheckService');
jest.mock('../../src/utils/Logger');

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthService: jest.Mocked<HealthCheckService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create mocks
    mockHealthService = {
      getHealthStatus: jest.fn()
    } as any;

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as any;

    // Create controller instance
    healthController = new HealthController(mockLogger, mockHealthService);

    // Setup request/response mocks
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/health'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status with 200', async () => {
    const mockHealthData = {
      status: 'healthy',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: '1.0.0',
      environment: 'test'
    };

    (mockHealthService.getHealthStatus as any).mockResolvedValue(mockHealthData);

    await healthController.getHealth(mockRequest as Request, mockResponse as Response);

    expect(mockHealthService.getHealthStatus).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockHealthData);
  });
  
});