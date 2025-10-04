import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CredentialsFormComponent, Credentials } from './credentials-form/credentials-form.component';
import { ThreeViewerComponent } from './three-viewer/three-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CredentialsFormComponent, ThreeViewerComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>DigiTwin Studio</h1>
        <p>Onshape Robot Visualization Platform</p>
      </header>
      
      <main class="main-content">
        <div class="left-panel">
          <app-credentials-form 
            (credentialsSubmit)="onCredentialsSubmit($event)">
          </app-credentials-form>
        </div>
        
        <div class="right-panel">
          <app-three-viewer 
            [robotData]="currentRobotData">
          </app-three-viewer>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      padding: 1rem 2rem;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .app-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .main-content {
      flex: 1;
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background-color: #f5f5f5;
      overflow: hidden;
    }

    .left-panel {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .right-panel {
      flex: 2;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .main-content {
        flex-direction: column;
      }
      
      .left-panel,
      .right-panel {
        flex: none;
      }
      
      .right-panel {
        min-height: 400px;
      }
    }
  `]
})
export class AppComponent {
  currentRobotData: any = null;

  onCredentialsSubmit(credentials: Credentials) {
    console.log('Credentials submitted:', credentials);
    
    // Here you would typically:
    // 1. Validate credentials with Onshape API
    // 2. Fetch the assembly data
    // 3. Process the 3D model data
    // 4. Pass the data to the Three.js viewer
    
    // For now, we'll simulate this process
    this.currentRobotData = {
      credentials: credentials,
      timestamp: new Date().toISOString(),
      status: 'processing'
    };
    
    // Simulate API call delay
    setTimeout(() => {
      this.currentRobotData = {
        ...this.currentRobotData,
        status: 'loaded',
        assemblyData: 'Mock assembly data from Onshape'
      };
    }, 1000);
  }
}
