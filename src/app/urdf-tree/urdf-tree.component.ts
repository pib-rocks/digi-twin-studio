import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { URDFRobot, URDFLink, URDFJoint, URDFMaterial } from '../services/urdf-generator.service';
import { TreeNodeComponent } from './tree-node.component';

export interface TreeNode {
  id: string;
  name: string;
  type: 'robot' | 'link' | 'joint' | 'material' | 'visual' | 'collision' | 'inertial';
  children?: TreeNode[];
  data?: any;
  expanded?: boolean;
}

@Component({
  selector: 'app-urdf-tree',
  standalone: true,
  imports: [CommonModule, TreeNodeComponent],
  template: `
    <div class="urdf-tree">
      <div class="tree-header">
        <h3>URDF Structure</h3>
        <div class="tree-actions">
          <button (click)="expandAll()" class="action-btn">Expand All</button>
          <button (click)="collapseAll()" class="action-btn">Collapse All</button>
          <button (click)="downloadUrdf()" class="action-btn primary">Download URDF</button>
        </div>
      </div>
      
      <div class="tree-content" *ngIf="treeData.length > 0">
        <div *ngFor="let node of treeData" class="tree-node">
          <app-tree-node 
            [node]="node" 
            (nodeClick)="onNodeClick($event)"
            (toggleExpand)="toggleNode($event)">
          </app-tree-node>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="treeData.length === 0">
        <p>No URDF data available. Import a robot assembly to see the structure.</p>
      </div>
    </div>
  `,
  styles: [`
    .urdf-tree {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .tree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .tree-header h3 {
      margin: 0;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .tree-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      color: #666;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f5f5f5;
      border-color: #1976d2;
    }

    .action-btn.primary {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    .action-btn.primary:hover {
      background: #1565c0;
    }

    .tree-content {
      flex: 1;
      overflow-y: auto;
    }

    .tree-node {
      margin-bottom: 0.25rem;
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-style: italic;
    }
  `]
})
export class UrdfTreeComponent {
  @Input() urdfRobot: URDFRobot | null = null;
  @Output() urdfDownload = new EventEmitter<string>();

  treeData: TreeNode[] = [];

  ngOnChanges() {
    if (this.urdfRobot) {
      this.treeData = this.buildTreeData(this.urdfRobot);
    } else {
      this.treeData = [];
    }
  }

  buildTreeData(robot: URDFRobot): TreeNode[] {
    const robotNode: TreeNode = {
      id: 'robot',
      name: robot.name,
      type: 'robot',
      expanded: true,
      children: []
    };

    // Add materials
    if (robot.materials.length > 0) {
      const materialsNode: TreeNode = {
        id: 'materials',
        name: `Materials (${robot.materials.length})`,
        type: 'material',
        expanded: false,
        children: robot.materials.map(material => ({
          id: `material_${material.name}`,
          name: material.name,
          type: 'material' as const,
          data: material
        }))
      };
      robotNode.children!.push(materialsNode);
    }

    // Add links
    if (robot.links.length > 0) {
      const linksNode: TreeNode = {
        id: 'links',
        name: `Links (${robot.links.length})`,
        type: 'link',
        expanded: true,
        children: robot.links.map(link => this.buildLinkNode(link))
      };
      robotNode.children!.push(linksNode);
    }

    // Add joints
    if (robot.joints.length > 0) {
      const jointsNode: TreeNode = {
        id: 'joints',
        name: `Joints (${robot.joints.length})`,
        type: 'joint',
        expanded: false,
        children: robot.joints.map(joint => ({
          id: `joint_${joint.name}`,
          name: joint.name,
          type: 'joint' as const,
          data: joint
        }))
      };
      robotNode.children!.push(jointsNode);
    }

    return [robotNode];
  }

  buildLinkNode(link: URDFLink): TreeNode {
    const linkNode: TreeNode = {
      id: `link_${link.name}`,
      name: link.name,
      type: 'link',
      expanded: false,
      children: []
    };

    // Add visual
    if (link.visual) {
      linkNode.children!.push({
        id: `visual_${link.name}`,
        name: 'Visual',
        type: 'visual',
        data: link.visual
      });
    }

    // Add collision
    if (link.collision) {
      linkNode.children!.push({
        id: `collision_${link.name}`,
        name: 'Collision',
        type: 'collision',
        data: link.collision
      });
    }

    // Add inertial
    if (link.inertial) {
      linkNode.children!.push({
        id: `inertial_${link.name}`,
        name: 'Inertial',
        type: 'inertial',
        data: link.inertial
      });
    }

    return linkNode;
  }

  onNodeClick(node: TreeNode) {
    console.log('Node clicked:', node);
  }

  toggleNode(nodeId: string) {
    const node = this.findNode(this.treeData, nodeId);
    if (node) {
      node.expanded = !node.expanded;
    }
  }

  findNode(nodes: TreeNode[], id: string): TreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  expandAll() {
    this.setAllExpanded(this.treeData, true);
  }

  collapseAll() {
    this.setAllExpanded(this.treeData, false);
  }

  setAllExpanded(nodes: TreeNode[], expanded: boolean) {
    nodes.forEach(node => {
      node.expanded = expanded;
      if (node.children) {
        this.setAllExpanded(node.children, expanded);
      }
    });
  }

  downloadUrdf() {
    if (this.urdfRobot) {
      // This will be handled by the parent component
      this.urdfDownload.emit('download');
    }
  }
}

