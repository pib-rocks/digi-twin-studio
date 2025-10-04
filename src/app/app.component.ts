import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Welcome to DigiTwin Studio</h1>
      <p>Your minimal Angular 20 application is running!</p>
      <p>TypeScript version: {{ typescriptVersion }}</p>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    
    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }
    
    p {
      color: #666;
      margin-bottom: 0.5rem;
    }
  `]
})
export class AppComponent {
  typescriptVersion = '5.8.0';
}
