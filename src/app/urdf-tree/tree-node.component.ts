import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeNode } from './urdf-tree.component';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node-item" [class.expanded]="node.expanded">
      <div class="node-content" (click)="onClick()">
        <span class="expand-icon" *ngIf="hasChildren" (click)="onToggleExpand($event)">
          {{ node.expanded ? '▼' : '▶' }}
        </span>
        <span class="node-icon" [class]="'icon-' + node.type">{{ getNodeIcon() }}</span>
        <span class="node-name">{{ node.name }}</span>
        <span class="node-type">{{ node.type }}</span>
      </div>
      
      <div class="node-children" *ngIf="node.children && node.expanded">
        <app-tree-node 
          *ngFor="let child of node.children" 
          [node]="child"
          (nodeClick)="onChildClick($event)"
          (toggleExpand)="onChildToggle($event)">
        </app-tree-node>
      </div>
    </div>
  `,
  styles: [`
    .tree-node-item {
      margin-left: 0;
    }

    .node-content {
      display: flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .node-content:hover {
      background-color: #f5f5f5;
    }

    .expand-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      margin-right: 0.25rem;
      cursor: pointer;
    }

    .node-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
      font-size: 12px;
    }

    .icon-robot { color: #1976d2; }
    .icon-link { color: #4caf50; }
    .icon-joint { color: #ff9800; }
    .icon-material { color: #9c27b0; }
    .icon-visual { color: #2196f3; }
    .icon-collision { color: #f44336; }
    .icon-inertial { color: #607d8b; }

    .node-name {
      flex: 1;
      font-size: 0.9rem;
      color: #333;
    }

    .node-type {
      font-size: 0.7rem;
      color: #666;
      background: #f0f0f0;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .node-children {
      margin-left: 1rem;
      border-left: 1px solid #e0e0e0;
      padding-left: 0.5rem;
    }
  `]
})
export class TreeNodeComponent {
  @Input() node!: TreeNode;
  @Output() nodeClick = new EventEmitter<TreeNode>();
  @Output() toggleExpand = new EventEmitter<string>();

  get hasChildren(): boolean {
    return !!(this.node.children && this.node.children.length > 0);
  }

  getNodeIcon(): string {
    switch (this.node.type) {
      case 'robot': return '🤖';
      case 'link': return '🔗';
      case 'joint': return '⚙️';
      case 'material': return '🎨';
      case 'visual': return '👁️';
      case 'collision': return '💥';
      case 'inertial': return '⚖️';
      default: return '📄';
    }
  }

  onClick() {
    this.nodeClick.emit(this.node);
  }

  onToggleExpand(event: Event) {
    event.stopPropagation();
    this.toggleExpand.emit(this.node.id);
  }

  onChildClick(node: TreeNode) {
    this.nodeClick.emit(node);
  }

  onChildToggle(nodeId: string) {
    this.toggleExpand.emit(nodeId);
  }
}
