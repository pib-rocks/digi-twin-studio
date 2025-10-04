import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface Credentials {
  accessKey: string;
  secretKey: string;
  assemblyUrl: string;
}

@Component({
  selector: 'app-credentials-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="credentials-form">
      <h3>Onshape API Credentials</h3>
      <form [formGroup]="credentialsForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
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

        <div class="form-group">
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

        <button 
          type="submit" 
          [disabled]="credentialsForm.invalid"
          class="import-button"
        >
          Import Robot
        </button>
      </form>
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
  `]
})
export class CredentialsFormComponent {
  @Output() credentialsSubmit = new EventEmitter<Credentials>();

  credentialsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.credentialsForm = this.fb.group({
      accessKey: ['', Validators.required],
      secretKey: ['', Validators.required],
      assemblyUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/cad\.onshape\.com\/documents\/.*$/)]]
    });
  }

  onSubmit() {
    if (this.credentialsForm.valid) {
      const credentials: Credentials = {
        accessKey: this.credentialsForm.value.accessKey,
        secretKey: this.credentialsForm.value.secretKey,
        assemblyUrl: this.credentialsForm.value.assemblyUrl
      };
      this.credentialsSubmit.emit(credentials);
    }
  }
}
