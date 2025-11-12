// Secure logging utility for production
type LogLevel = "error" | "warn" | "info" | "debug";

// interface LogEntry {
//   level: LogLevel;
//   message: string;
//   error?: Error;
//   timestamp: string;
// }

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, error?: Error) {
    // const entry: LogEntry = {
    //   level,
    //   message,
    //   error: error ? {
    //     name: error.name,
    //     message: error.message,
    //     stack: this.isDevelopment ? error.stack : undefined,
    //   } as Error : undefined,
    //   timestamp: new Date().toISOString(),
    // };

    // Only log to console in development
    if (this.isDevelopment) {
      switch (level) {
        case "error":
          console.error(message, error);
          break;
        case "warn":
          console.warn(message, error);
          break;
        case "info":
          console.info(message);
          break;
        case "debug":
          console.debug(message);
          break;
      }
    }

    // In production, you could send logs to a secure logging service
    // For now, we'll just silently handle them
  }

  error(message: string, error?: Error) {
    this.log("error", message, error);
  }

  warn(message: string, error?: Error) {
    this.log("warn", message, error);
  }

  info(message: string) {
    this.log("info", message);
  }

  debug(message: string) {
    this.log("debug", message);
  }
}

export const logger = new Logger();
