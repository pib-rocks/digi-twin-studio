import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Scene, PerspectiveCamera, WebGLRenderer, Color, AmbientLight, DirectionalLight, BoxGeometry, MeshPhongMaterial, Mesh, PlaneGeometry } from 'three';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="three-container">
      <div #threeCanvas class="three-canvas"></div>
      <div class="viewer-info">
        <h3>3D Robot Viewer</h3>
        <p>Three.js scene ready for robot visualization</p>
        <div *ngIf="isLoading" class="loading">Loading...</div>
      </div>
    </div>
  `,
  styles: [`
    .three-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      overflow: hidden;
    }

    .three-canvas {
      width: 100%;
      height: 100%;
      min-height: 500px;
    }

    .viewer-info {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(255, 255, 255, 0.9);
      padding: 1rem;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .viewer-info h3 {
      margin: 0 0 0.5rem 0;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .viewer-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .loading {
      color: #1976d2;
      font-weight: 500;
      margin-top: 0.5rem;
    }
  `]
})
export class ThreeViewerComponent implements OnInit, OnDestroy {
  @ViewChild('threeCanvas', { static: true }) canvasRef!: ElementRef;
  @Input() robotData: any = null;

  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private animationId!: number;
  private cube!: Mesh;
  
  isLoading = false;

  ngOnInit() {
    this.initThreeJS();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS() {
    const canvas = this.canvasRef.nativeElement;
    
    // Scene
    this.scene = new Scene();
    this.scene.background = new Color(0x222222);

    // Camera
    this.camera = new PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = 1; // PCFSoftShadowMap
    
    canvas.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add a simple placeholder cube
    this.createPlaceholderGeometry();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createPlaceholderGeometry() {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshPhongMaterial({ 
      color: 0x1976d2,
      transparent: true,
      opacity: 0.8
    });
    this.cube = new Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);

    // Add a ground plane
    const groundGeometry = new PlaneGeometry(10, 10);
    const groundMaterial = new MeshPhongMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.3
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Rotate the cube
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const canvas = this.canvasRef.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  // Method to load robot data (will be called when credentials are submitted)
  loadRobotData(robotData: any) {
    this.isLoading = true;
    
    // Simulate loading time
    setTimeout(() => {
      // Here you would process the robot data and create 3D geometry
      console.log('Loading robot data:', robotData);
      
      // For now, just change the cube color to indicate data is loaded
      if (this.cube) {
        (this.cube.material as MeshPhongMaterial).color.setHex(0x4caf50);
      }
      
      this.isLoading = false;
    }, 2000);
  }
}
