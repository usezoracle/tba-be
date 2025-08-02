import { Logger } from 'nestjs-pino';

/**
 * Utility to handle graceful shutdown with proper log flushing
 */
export class GracefulShutdownUtil {
  private static logger: Logger;

  static setLogger(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Setup graceful shutdown handlers to ensure logs are flushed
   */
  static setupGracefulShutdown(app: any) {
    const gracefulShutdown = async (signal: string) => {
      if (this.logger) {
        this.logger.log(`Received ${signal}, starting graceful shutdown...`);
      }

      try {
        // Close the application
        await app.close();
        
        if (this.logger) {
          this.logger.log('Application closed successfully');
        }

        // Give time for final logs to flush (non-blocking)
        setTimeout(() => {
          process.exit(0);
        }, 100);
      } catch (error) {
        if (this.logger) {
          this.logger.error('Error during graceful shutdown', error);
        }
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      if (this.logger) {
        this.logger.fatal('Uncaught exception', error);
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      if (this.logger) {
        this.logger.fatal('Unhandled rejection', { reason, promise });
      }
      process.exit(1);
    });
  }
}