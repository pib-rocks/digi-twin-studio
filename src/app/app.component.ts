import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CredentialsFormComponent, Credentials, ImportResult } from './credentials-form/credentials-form.component';
import { ErrorDetails } from './error-details/error-details.component';
import { ThreeViewerComponent } from './three-viewer/three-viewer.component';
import { UrdfTreeComponent } from './urdf-tree/urdf-tree.component';
import { URDFRobot } from './services/urdf-generator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CredentialsFormComponent, ThreeViewerComponent, UrdfTreeComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>DigiTwin Studio</h1>
        <p>Onshape Robot Visualization Platform</p>
      </header>
      
      <main class="main-content">
        <div class="left-panel">
          <app-credentials-form 
            (credentialsSubmit)="onCredentialsSubmit($event)"
            (importResult)="onImportResult($event)">
          </app-credentials-form>
          
          <div class="urdf-section" *ngIf="urdfRobot">
            <app-urdf-tree 
              [urdfRobot]="urdfRobot"
              (urdfDownload)="downloadUrdf()">
            </app-urdf-tree>
          </div>
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
      gap: 1rem;
    }

    .urdf-section {
      flex: 1;
      min-height: 0;
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
  urdfRobot: URDFRobot | null = null;
  importError: string | null = null;
  errorDetails: ErrorDetails | null = null;

  onCredentialsSubmit(credentials: Credentials) {
    console.log('Credentials submitted:', credentials);
    this.importError = null;
    this.errorDetails = null;
    
    // Update the 3D viewer with processing status
    this.currentRobotData = {
      credentials: credentials,
      timestamp: new Date().toISOString(),
      status: 'processing'
    };
  }

  onImportResult(result: ImportResult) {
    if (result.success && result.urdfRobot) {
      this.urdfRobot = result.urdfRobot;
      this.importError = null;
      this.errorDetails = null;
      
      // Update the 3D viewer with the loaded robot data
      this.currentRobotData = {
        urdfRobot: result.urdfRobot,
        timestamp: new Date().toISOString(),
        status: 'loaded'
      };
    } else {
      this.importError = result.error || 'Import failed';
      this.errorDetails = result.errorDetails || null;
      this.urdfRobot = null;
      
      // Update the 3D viewer with error status
      this.currentRobotData = {
        error: this.importError,
        errorDetails: this.errorDetails,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  }

  downloadUrdf() {
    if (this.urdfRobot) {
      // Import the URDF generator service to create XML
      import('./services/urdf-generator.service').then(module => {
        const urdfGenerator = new module.UrdfGeneratorService();
        const urdfXml = urdfGenerator.urdfToXml(this.urdfRobot!);
        
        // Create and download the file
        const blob = new Blob([urdfXml], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.urdfRobot!.name}.urdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
    }
  }
}
