
// Mock performance API for Node.js test environment
const { performance } = require('perf_hooks');
global.performance = performance;

describe('Logger fallback behavior', () => {
  const originalWindow = global.window;
  const originalConsole = global.console;
  let mockConsole;
  
  beforeEach(() => {
    // Mock console with spy functions
    mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      group: jest.fn(),
      groupEnd: jest.fn(),
      table: jest.fn(),
      clear: jest.fn()
    };
    global.console = mockConsole;
    
    // Reset window object
    global.window = {
      location: {
        hostname: 'localhost'
      }
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.console = originalConsole;
    // Clean up module cache to ensure fresh require
    delete require.cache[require.resolve('./logger')];
  });

  test('Logger uses window.Logger when window.Logger is properly defined', () => {
    // Require module to register window.safeLog
    require('./logger');

    // Set up properly defined window.Logger AFTER module load
    const mockWindowLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    global.window.Logger = mockWindowLogger;
    
    // Test that window.safeLog uses window.Logger when available
    global.window.safeLog('log', 'test log message');
    global.window.safeLog('warn', 'test warn message');
    global.window.safeLog('error', 'test error message');
    
    expect(mockWindowLogger.log).toHaveBeenCalledWith('test log message');
    expect(mockWindowLogger.warn).toHaveBeenCalledWith('test warn message');
    expect(mockWindowLogger.error).toHaveBeenCalledWith('test error message');
    
    // Verify console methods were not called
    expect(mockConsole.log).not.toHaveBeenCalled();
    expect(mockConsole.warn).not.toHaveBeenCalled();
    expect(mockConsole.error).not.toHaveBeenCalled();
  });

  test('Logger falls back to console methods when window.Logger is undefined', () => {
    // Load module to define window.safeLog
    require('./logger');

    // Ensure window.Logger is undefined at call time
    delete global.window.Logger;
    
    // Test that safeLog falls back to console when window.Logger is undefined
    global.window.safeLog('log', 'test log message');
    global.window.safeLog('warn', 'test warn message');
    global.window.safeLog('error', 'test error message');
    
    expect(mockConsole.log).toHaveBeenCalledWith('test log message');
    expect(mockConsole.warn).toHaveBeenCalledWith('test warn message');
    expect(mockConsole.error).toHaveBeenCalledWith('test error message');
  });

  test('Logger falls back to console methods when window.Logger is defined but missing log, warn, or error functions', () => {
    // Load module to define window.safeLog
    require('./logger');

    // Set up window.Logger with missing methods AFTER module load
    global.window.Logger = {
      // Missing log, warn, error methods
      someOtherMethod: jest.fn()
    };
    
    // Test that safeLog falls back to console when window.Logger methods are missing
    global.window.safeLog('log', 'test log message');
    global.window.safeLog('warn', 'test warn message');
    global.window.safeLog('error', 'test error message');
    
    expect(mockConsole.log).toHaveBeenCalledWith('test log message');
    expect(mockConsole.warn).toHaveBeenCalledWith('test warn message');
    expect(mockConsole.error).toHaveBeenCalledWith('test error message');
  });
});
