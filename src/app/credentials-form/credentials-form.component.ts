import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { OnshapeApiService, OnshapeCredentials } from '../services/onshape-api.service';
import { UrdfGeneratorService, URDFRobot } from '../services/urdf-generator.service';
import { ErrorDetailsComponent, ErrorDetails } from '../error-details/error-details.component';
import { ConsoleLogViewerComponent } from '../console-log-viewer/console-log-viewer.component';
import { ProxyTestService } from '../services/proxy-test.service';

export interface Credentials {
  accessKey: string;
  secretKey: string;
  assemblyUrl: string;
}

export interface ImportResult {
  success: boolean;
  urdfRobot?: URDFRobot;
  error?: string;
  errorDetails?: ErrorDetails;
  progress?: string;
}

@Component({
  selector: 'app-credentials-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ErrorDetailsComponent, ConsoleLogViewerComponent],
  template: `
    <div class="credentials-form">
      <h3>Onshape API Credentials</h3>
      
      <div class="error-alert" *ngIf="currentError">
        <div class="error-alert-header">
          <span class="error-icon">⚠️</span>
          <strong>Import Failed</strong>
        </div>
        <div class="error-alert-message">
          {{ currentError.message }}
        </div>
      </div>
      
      <div class="credentials-toggle">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            [(ngModel)]="useBackendCredentials"
            (change)="onToggleBackendCredentials()"
            class="toggle-checkbox"
          >
          <span class="toggle-text">Use credentials from backend (secrets.json)</span>
        </label>
      </div>
      
      <form [formGroup]="credentialsForm" (ngSubmit)="onSubmit()">
        <div class="form-group" *ngIf="!useBackendCredentials">
          <label for="accessKey">Access Key:</label>
          <input 
            id="accessKey"
            type="text" 
            formControlName="accessKey"
            placeholder="Enter your Onshape access key"
            class="form-input"
          >
          <div *ngIf="credentialsForm.get('accessKey')?.invalid && credentialsForm.get('accessKey')?.touched" 
               class="error-message">
            Access key is required
          </div>
        </div>

        <div class="form-group" *ngIf="!useBackendCredentials">
          <label for="secretKey">Secret Key:</label>
          <input 
            id="secretKey"
            type="password" 
            formControlName="secretKey"
            placeholder="Enter your Onshape secret key"
            class="form-input"
          >
          <div *ngIf="credentialsForm.get('secretKey')?.invalid && credentialsForm.get('secretKey')?.touched" 
               class="error-message">
            Secret key is required
          </div>
        </div>

        <div class="form-group">
          <label for="assemblyUrl">Assembly URL:</label>
          <input 
            id="assemblyUrl"
            type="url" 
            formControlName="assemblyUrl"
            placeholder="https://cad.onshape.com/documents/..."
            class="form-input"
          >
          <div *ngIf="credentialsForm.get('assemblyUrl')?.invalid && credentialsForm.get('assemblyUrl')?.touched" 
               class="error-message">
            Please enter a valid URL
          </div>
        </div>

        <div class="button-group">
          <button 
            type="button" 
            (click)="testProxy()"
            class="test-button"
          >
            Test Proxy
          </button>
          
          <button 
            type="submit" 
            [disabled]="credentialsForm.invalid || isImporting"
            class="import-button"
          >
            {{ isImporting ? 'Importing...' : 'Import Robot' }}
          </button>
        </div>
        
        <div *ngIf="importProgress" class="import-progress">
          {{ importProgress }}
        </div>
      </form>
      
      <app-error-details [error]="currentError"></app-error-details>
      
      <app-console-log-viewer [showLogs]="true"></app-console-log-viewer>
    </div>
  `,
  styles: [`
    .credentials-form {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0 0 1rem 0;
      color: #1976d2;
      font-size: 1.2rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
      transition: border-color 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }

    .error-message {
      color: #d32f2f;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .import-button {
      width: 100%;
      padding: 0.75rem;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .import-button:hover:not(:disabled) {
      background-color: #1565c0;
    }

    .import-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
    }

    .test-button {
      padding: 0.75rem;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .test-button:hover {
      background-color: #45a049;
    }

    .import-progress {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #e3f2fd;
      border: 1px solid #1976d2;
      border-radius: 4px;
      color: #1976d2;
      font-size: 0.9rem;
      text-align: center;
    }

    .error-alert {
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .error-alert-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .error-icon {
      font-size: 1.2rem;
      margin-right: 0.5rem;
    }

    .error-alert-message {
      color: #d32f2f;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      white-space: pre-line;
      background: #fff;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ffcdd2;
    }

    .credentials-toggle {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f0f8ff;
      border: 1px solid #1976d2;
      border-radius: 8px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 1rem;
      color: #1976d2;
    }

    .toggle-checkbox {
      margin-right: 0.75rem;
      transform: scale(1.2);
      cursor: pointer;
    }

    .toggle-text {
      font-weight: 500;
    }
  `]
})
export class CredentialsFormComponent {
  @Output() credentialsSubmit = new EventEmitter<Credentials>();
  @Output() importResult = new EventEmitter<ImportResult>();

  credentialsForm: FormGroup;
  isImporting = false;
  importProgress = '';
  currentError: ErrorDetails | null = null;
  useBackendCredentials = false;

  constructor(
    private fb: FormBuilder,
    private onshapeApi: OnshapeApiService,
    private urdfGenerator: UrdfGeneratorService,
    private proxyTest: ProxyTestService
  ) {
    this.credentialsForm = this.fb.group({
      accessKey: [''],
      secretKey: [''],
      assemblyUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/cad\.onshape\.com\/documents\/.*$/)]]
    });
  }

  onToggleBackendCredentials() {
    if (this.useBackendCredentials) {
      // When using backend credentials, clear the form fields
      this.credentialsForm.patchValue({
        accessKey: '',
        secretKey: ''
      });
      // Remove validators for access key and secret key
      this.credentialsForm.get('accessKey')?.clearValidators();
      this.credentialsForm.get('secretKey')?.clearValidators();
    } else {
      // When using manual credentials, add validators back
      this.credentialsForm.get('accessKey')?.setValidators([Validators.required]);
      this.credentialsForm.get('secretKey')?.setValidators([Validators.required]);
    }
    this.credentialsForm.get('accessKey')?.updateValueAndValidity();
    this.credentialsForm.get('secretKey')?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.credentialsForm.valid && !this.isImporting) {
      let credentials: Credentials;
      
      if (this.useBackendCredentials) {
        // Use credentials from backend
        try {
          const backendCredentials = await this.getBackendCredentials();
          credentials = {
            accessKey: backendCredentials.accessKey,
            secretKey: backendCredentials.secretKey,
            assemblyUrl: this.credentialsForm.value.assemblyUrl
          };
        } catch (error) {
          this.currentError = {
            message: 'Failed to load credentials from backend: ' + (error as Error).message,
            timestamp: new Date().toISOString(),
            operation: 'getBackendCredentials',
            context: { error }
          };
          return;
        }
      } else {
        // Use manual credentials
        credentials = {
          accessKey: this.credentialsForm.value.accessKey,
          secretKey: this.credentialsForm.value.secretKey,
          assemblyUrl: this.credentialsForm.value.assemblyUrl
        };
      }
      
      this.importRobot(credentials);
    }
  }

  private async getBackendCredentials(): Promise<{ accessKey: string; secretKey: string }> {
    const response = await fetch('http://localhost:3001/backend-credentials');
    if (!response.ok) {
      throw new Error(`Backend credentials request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      accessKey: data.onshape.accessKey,
      secretKey: data.onshape.secretKey
    };
  }

  async importRobot(credentials: Credentials) {
    this.isImporting = true;
    this.importProgress = 'Connecting to Onshape API...';
    this.currentError = null;
    this.credentialsSubmit.emit(credentials);

    try {
      // Test connection
      this.importProgress = 'Testing API connection...';
      await this.onshapeApi.testConnection(credentials).toPromise();

      // Get assembly data
      this.importProgress = 'Fetching assembly data...';
      const assembly = await this.onshapeApi.getAssembly(credentials).toPromise();
      if (!assembly) {
        throw new Error('Failed to fetch assembly data');
      }

      // Get parts data
      this.importProgress = 'Fetching parts data...';
      const parts = await this.onshapeApi.getAssemblyParts(credentials).toPromise();
      if (!parts) {
        throw new Error('Failed to fetch parts data');
      }

      // Download STL files
      this.importProgress = 'Downloading STL files...';
      const stlFiles = new Map<string, Blob>();
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        this.importProgress = `Downloading STL ${i + 1}/${parts.length}: ${part.name}`;
        
        try {
          const stlBlob = await this.onshapeApi.downloadStl(credentials, part.id).toPromise();
          if (stlBlob) {
            stlFiles.set(part.id, stlBlob);
          }
        } catch (error) {
          console.warn(`Failed to download STL for part ${part.name}:`, error);
        }
      }

      // Generate URDF
      this.importProgress = 'Generating URDF...';
      const urdfRobot = this.urdfGenerator.generateUrdf(assembly, parts, stlFiles);

      this.importProgress = 'Import completed successfully!';
      this.importResult.emit({
        success: true,
        urdfRobot: urdfRobot,
        progress: this.importProgress
      });

    } catch (error) {
      console.error('Import failed:', error);
      this.importProgress = 'Import failed';
      
      // Extract detailed error information
      const errorDetails: ErrorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        operation: 'importRobot',
        context: {
          credentials: {
            accessKey: credentials.accessKey.substring(0, 8) + '...',
            assemblyUrl: credentials.assemblyUrl
          },
          progress: this.importProgress
        }
      };

      // Add enhanced error details if available
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.details) {
          errorDetails.request = errorObj.details.request;
          errorDetails.response = errorObj.details.response;
          errorDetails.fullError = errorObj.details.fullError;
          errorDetails.status = errorObj.status;
          errorDetails.url = errorObj.url;
          errorDetails.statusText = errorObj.details.response?.statusText;
        }
      }

      this.currentError = errorDetails;
      
      this.importResult.emit({
        success: false,
        error: errorDetails.message,
        errorDetails: errorDetails,
        progress: this.importProgress
      });
    } finally {
      this.isImporting = false;
    }
  }

  async testProxy() {
    this.importProgress = 'Testing proxy connection...';
    this.currentError = null;

    try {
      const result = await this.proxyTest.testProxy().toPromise();
      this.importProgress = '✅ Proxy connection successful!';
      console.log('Proxy test result:', result);
    } catch (error) {
      this.importProgress = '❌ Proxy connection failed';
      console.error('Proxy test failed:', error);
      
      const errorDetails: ErrorDetails = {
        message: 'Proxy connection test failed. Make sure the proxy server is running on port 3001.',
        timestamp: new Date().toISOString(),
        operation: 'testProxy',
        context: { error: error }
      };
      
      this.currentError = errorDetails;
    }
  }
}
