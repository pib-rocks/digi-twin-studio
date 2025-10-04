import { Injectable } from '@angular/core';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
  operation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(level: LogEntry['level'], message: string, context?: any, operation?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      operation
    };

    this.logs.unshift(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console
    const consoleMessage = `[${entry.timestamp}] ${operation ? `[${operation}] ` : ''}${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, context);
        break;
      case 'warn':
        console.warn(consoleMessage, context);
        break;
      case 'debug':
        console.debug(consoleMessage, context);
        break;
      default:
        console.log(consoleMessage, context);
    }
  }

  info(message: string, context?: any, operation?: string) {
    this.log('info', message, context, operation);
  }

  warn(message: string, context?: any, operation?: string) {
    this.log('warn', message, context, operation);
  }

  error(message: string, context?: any, operation?: string) {
    this.log('error', message, context, operation);
  }

  debug(message: string, context?: any, operation?: string) {
    this.log('debug', message, context, operation);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

