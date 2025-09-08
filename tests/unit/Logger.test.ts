import { ConsoleLogger } from '../../src/utils/Logger';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new ConsoleLogger();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('error', () => {
    it('should log error with message only', () => {
      const message = 'Test error message';
      
      logger.error(message);
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleSpy.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall!);
      
      expect(logData.level).toBe('ERROR');
      expect(logData.message).toBe(message);
      expect(logData.timestamp).toBeDefined();
      expect(logData.error).toBeUndefined();
      expect(logData.context).toBeUndefined();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const message = 'Test warning message';
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      logger.warn(message);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleWarnSpy.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall!);
      
      expect(logData.level).toBe('WARN');
      expect(logData.message).toBe(message);
      expect(logData.timestamp).toBeDefined();
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const message = 'Test info message';
      const consoleInfoSpy = jest.spyOn(console, 'info');
      
      logger.info(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleInfoSpy.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall!);
      
      expect(logData.level).toBe('INFO');
      expect(logData.message).toBe(message);
      expect(logData.timestamp).toBeDefined();
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const message = 'Test debug message';
      const consoleDebugSpy = jest.spyOn(console, 'debug');
      
      logger.debug(message);
      
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleDebugSpy.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall!);
      
      expect(logData.level).toBe('DEBUG');
      expect(logData.message).toBe(message);
      expect(logData.timestamp).toBeDefined();
    });
  });

  describe('timestamp format', () => {
    it('should use ISO timestamp format', () => {
      const message = 'Test message';
      const consoleInfoSpy = jest.spyOn(console, 'info');
      
      logger.info(message);
      
      const logCall = consoleInfoSpy.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      const logData = JSON.parse(logCall!);
      
      expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});