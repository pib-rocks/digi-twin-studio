import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService, LogEntry } from '../services/logging.service';

@Component({
  selector: 'app-console-log-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="console-log-viewer" *ngIf="showLogs">
      <div class="log-header">
        <h4>📋 Console Logs</h4>
        <div class="log-actions">
          <button (click)="clearLogs()" class="action-btn">Clear</button>
          <button (click)="exportLogs()" class="action-btn">Export</button>
          <button (click)="toggleAutoScroll()" class="action-btn" [class.active]="autoScroll">
            Auto-scroll: {{ autoScroll ? 'ON' : 'OFF' }}
          </button>
        </div>
      </div>
      
      <div class="log-content" #logContainer>
        <div *ngFor="let log of logs" class="log-entry" [class]="'log-' + log.level">
          <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-operation" *ngIf="log.operation">[{{ log.operation }}]</span>
          <span class="log-message">{{ log.message }}</span>
          <div class="log-context" *ngIf="log.context">
            <pre>{{ formatContext(log.context) }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .console-log-viewer {
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      margin-top: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      max-height: 300px;
      display: flex;
      flex-direction: column;
    }

    .log-header {
      background: #2d2d30;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #3e3e42;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .log-header h4 {
      margin: 0;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .log-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: #0e639c;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.7rem;
    }

    .action-btn:hover {
      background: #1177bb;
    }

    .action-btn.active {
      background: #4caf50;
    }

    .log-content {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      max-height: 250px;
    }

    .log-entry {
      margin-bottom: 0.5rem;
      padding: 0.25rem;
      border-radius: 3px;
      border-left: 3px solid transparent;
    }

    .log-entry.log-error {
      background: rgba(244, 67, 54, 0.1);
      border-left-color: #f44336;
    }

    .log-entry.log-warn {
      background: rgba(255, 152, 0, 0.1);
      border-left-color: #ff9800;
    }

    .log-entry.log-info {
      background: rgba(33, 150, 243, 0.1);
      border-left-color: #2196f3;
    }

    .log-entry.log-debug {
      background: rgba(156, 39, 176, 0.1);
      border-left-color: #9c27b0;
    }

    .log-timestamp {
      color: #888;
      margin-right: 0.5rem;
    }

    .log-level {
      font-weight: bold;
      margin-right: 0.5rem;
      min-width: 50px;
      display: inline-block;
    }

    .log-level.log-error {
      color: #f44336;
    }

    .log-level.log-warn {
      color: #ff9800;
    }

    .log-level.log-info {
      color: #2196f3;
    }

    .log-level.log-debug {
      color: #9c27b0;
    }

    .log-operation {
      color: #4caf50;
      margin-right: 0.5rem;
      font-weight: bold;
    }

    .log-message {
      color: #d4d4d4;
    }

    .log-context {
      margin-top: 0.25rem;
      margin-left: 1rem;
    }

    .log-context pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.25rem;
      border-radius: 3px;
      font-size: 0.7rem;
      color: #b0b0b0;
      overflow-x: auto;
      max-height: 100px;
      overflow-y: auto;
    }
  `]
})
export class ConsoleLogViewerComponent implements OnInit, OnDestroy {
  @Input() showLogs = false;
  
  logs: LogEntry[] = [];
  autoScroll = true;
  private logSubscription: any;

  constructor(private loggingService: LoggingService) {}

  ngOnInit() {
    this.logs = this.loggingService.getLogs();
    // In a real implementation, you'd subscribe to log updates
  }

  ngOnDestroy() {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  formatContext(context: any): string {
    return JSON.stringify(context, null, 2);
  }

  clearLogs() {
    this.loggingService.clearLogs();
    this.logs = [];
  }

  exportLogs() {
    const logsJson = this.loggingService.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digi-twin-studio-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
  }
}

