import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorDetails {
  message: string;
  operation?: string;
  status?: number;
  statusText?: string;
  url?: string;
  context?: any;
  timestamp?: string;
  request?: any;
  response?: any;
  fullError?: any;
}

@Component({
  selector: 'app-error-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-details" *ngIf="error">
      <div class="error-header">
        <h4>❌ Import Failed</h4>
        <button class="toggle-btn" (click)="toggleExpanded()">
          {{ expanded ? '▼' : '▶' }} {{ expanded ? 'Hide' : 'Show' }} Details
        </button>
      </div>
      
      <div class="error-message">
        <strong>{{ error.message }}</strong>
      </div>
      
      <div class="error-details-content" *ngIf="expanded">
        <div class="error-section" *ngIf="error.operation">
          <h5>Operation:</h5>
          <code>{{ error.operation }}</code>
        </div>
        
        <div class="error-section" *ngIf="error.status">
          <h5>HTTP Status:</h5>
          <span class="status-badge" [class]="getStatusClass()">
            {{ error.status }} {{ error.statusText }}
          </span>
        </div>
        
        <div class="error-section" *ngIf="error.url">
          <h5>API URL:</h5>
          <code class="url">{{ error.url }}</code>
        </div>
        
        <div class="error-section" *ngIf="error.timestamp">
          <h5>Timestamp:</h5>
          <span>{{ error.timestamp }}</span>
        </div>
        
        <div class="error-section" *ngIf="error.context">
          <h5>Context:</h5>
          <pre class="context-json">{{ formatContext() }}</pre>
        </div>
        
        <div class="error-section" *ngIf="error.request">
          <h5>Request Details:</h5>
          <pre class="context-json">{{ formatRequest() }}</pre>
        </div>
        
        <div class="error-section" *ngIf="error.response">
          <h5>Response Details:</h5>
          <pre class="context-json">{{ formatResponse() }}</pre>
        </div>
        
        <div class="error-section" *ngIf="error.fullError">
          <h5>Full Error Object:</h5>
          <pre class="context-json">{{ formatFullError() }}</pre>
        </div>
        
        <div class="troubleshooting">
          <h5>🔧 Troubleshooting Tips:</h5>
          <ul>
            <li *ngIf="error.status === 401">
              <strong>Authentication Error:</strong> Verify your Onshape API credentials are correct and have not expired.
            </li>
            <li *ngIf="error.status === 403">
              <strong>Permission Error:</strong> Ensure your API key has access to the specified assembly.
            </li>
            <li *ngIf="error.status === 404">
              <strong>Not Found:</strong> Check that the Onshape URL is correct and the assembly exists.
            </li>
            <li *ngIf="error.status === 429">
              <strong>Rate Limited:</strong> Wait a few minutes before trying again.
            </li>
            <li *ngIf="error.message.includes('Invalid Onshape assembly URL')">
              <strong>URL Format:</strong> Ensure the URL follows the format: 
              <code>https://cad.onshape.com/documents/{{ '{' }}documentId{{ '}' }}/w/{{ '{' }}workspaceId{{ '}' }}/e/{{ '{' }}elementId{{ '}' }}</code>
            </li>
            <li>
              <strong>Network Issues:</strong> Check your internet connection and try again.
            </li>
            <li>
              <strong>API Limits:</strong> Verify your Onshape API plan allows the requested operations.
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-details {
      background: #ffebee;
      border: 1px solid #f44336;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .error-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .error-header h4 {
      margin: 0;
      color: #d32f2f;
      font-size: 1.1rem;
    }

    .toggle-btn {
      background: none;
      border: 1px solid #d32f2f;
      color: #d32f2f;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .toggle-btn:hover {
      background: #d32f2f;
      color: white;
    }

    .error-message {
      color: #d32f2f;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .error-details-content {
      border-top: 1px solid #ffcdd2;
      padding-top: 1rem;
    }

    .error-section {
      margin-bottom: 1rem;
    }

    .error-section h5 {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-badge.status-4xx {
      background: #ffebee;
      color: #d32f2f;
      border: 1px solid #f44336;
    }

    .status-badge.status-5xx {
      background: #fff3e0;
      color: #f57c00;
      border: 1px solid #ff9800;
    }

    .status-badge.status-other {
      background: #f5f5f5;
      color: #666;
      border: 1px solid #ccc;
    }

    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
    }

    .url {
      word-break: break-all;
      display: block;
      margin-top: 0.25rem;
    }

    .context-json {
      background: #f5f5f5;
      padding: 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }

    .troubleshooting {
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .troubleshooting h5 {
      margin: 0 0 0.5rem 0;
      color: #2e7d32;
      font-size: 0.9rem;
    }

    .troubleshooting ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .troubleshooting li {
      margin-bottom: 0.5rem;
      color: #2e7d32;
      font-size: 0.85rem;
    }

    .troubleshooting strong {
      color: #1b5e20;
    }
  `]
})
export class ErrorDetailsComponent {
  @Input() error: ErrorDetails | null = null;
  expanded = false;

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  getStatusClass(): string {
    if (!this.error?.status) return 'status-other';
    
    if (this.error.status >= 400 && this.error.status < 500) {
      return 'status-4xx';
    } else if (this.error.status >= 500) {
      return 'status-5xx';
    }
    return 'status-other';
  }

  formatContext(): string {
    if (!this.error?.context) return '';
    return JSON.stringify(this.error.context, null, 2);
  }

  formatRequest(): string {
    if (!this.error?.request) return '';
    return JSON.stringify(this.error.request, null, 2);
  }

  formatResponse(): string {
    if (!this.error?.response) return '';
    return JSON.stringify(this.error.response, null, 2);
  }

  formatFullError(): string {
    if (!this.error?.fullError) return '';
    return JSON.stringify(this.error.fullError, null, 2);
  }
}
