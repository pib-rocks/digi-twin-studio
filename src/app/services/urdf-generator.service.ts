import { Injectable } from '@angular/core';
import { OnshapePart, OnshapeAssembly } from './onshape-api.service';

export interface URDFLink {
  name: string;
  visual: URDFVisual;
  collision?: URDFCollision;
  inertial?: URDFInertial;
  origin?: URDFOrigin;
}

export interface URDFJoint {
  name: string;
  type: 'fixed' | 'revolute' | 'prismatic' | 'continuous' | 'planar' | 'floating';
  parent: string;
  child: string;
  origin?: URDFOrigin;
  axis?: URDFAxis;
  limit?: URDFLimit;
}

export interface URDFVisual {
  geometry: URDFGeometry;
  material?: URDFMaterial;
  origin?: URDFOrigin;
}

export interface URDFCollision {
  geometry: URDFGeometry;
  origin?: URDFOrigin;
}

export interface URDFInertial {
  mass: number;
  inertia: URDFInertia;
  origin?: URDFOrigin;
}

export interface URDFGeometry {
  type: 'box' | 'cylinder' | 'sphere' | 'mesh';
  size?: number[];
  filename?: string;
  scale?: number[];
}

export interface URDFMaterial {
  name: string;
  color?: {
    rgba: string;
  };
  texture?: {
    filename: string;
  };
}

export interface URDFOrigin {
  xyz: number[];
  rpy: number[];
}

export interface URDFAxis {
  xyz: number[];
}

export interface URDFLimit {
  lower: number;
  upper: number;
  effort: number;
  velocity: number;
}

export interface URDFInertia {
  ixx: number;
  ixy: number;
  ixz: number;
  iyy: number;
  iyz: number;
  izz: number;
}

export interface URDFRobot {
  name: string;
  links: URDFLink[];
  joints: URDFJoint[];
  materials: URDFMaterial[];
}

@Injectable({
  providedIn: 'root'
})
export class UrdfGeneratorService {

  /**
   * Generate URDF from Onshape assembly data
   */
  generateUrdf(assembly: OnshapeAssembly, parts: OnshapePart[], stlFiles: Map<string, Blob>): URDFRobot {
    const robot: URDFRobot = {
      name: assembly.name.replace(/\s+/g, '_').toLowerCase(),
      links: [],
      joints: [],
      materials: []
    };

    // Generate materials from parts
    const materialMap = new Map<string, URDFMaterial>();
    parts.forEach(part => {
      if (part.appearance && !materialMap.has(part.appearance)) {
        materialMap.set(part.appearance, {
          name: part.appearance.replace(/\s+/g, '_').toLowerCase(),
          color: {
            rgba: this.generateRandomColor()
          }
        });
      }
    });
    robot.materials = Array.from(materialMap.values());

    // Generate links from parts
    parts.forEach(part => {
      const link: URDFLink = {
        name: this.sanitizeName(part.name),
        visual: {
          geometry: this.createGeometryFromPart(part, stlFiles),
          material: part.appearance ? materialMap.get(part.appearance) : undefined,
          origin: this.calculateOrigin(part)
        },
        collision: {
          geometry: this.createCollisionGeometry(part),
          origin: this.calculateOrigin(part)
        },
        inertial: this.calculateInertial(part)
      };
      robot.links.push(link);
    });

    // Generate joints from assembly elements
    assembly.elements.forEach((element, index) => {
      if (index === 0) {
        // First element is the base link
        return;
      }

      const joint: URDFJoint = {
        name: `joint_${this.sanitizeName(element.name)}`,
        type: 'fixed', // Default to fixed joints, could be enhanced with joint detection
        parent: index === 1 ? 'base_link' : `link_${this.sanitizeName(assembly.elements[index - 1].name)}`,
        child: `link_${this.sanitizeName(element.name)}`,
        origin: this.calculateJointOrigin(element),
        axis: { xyz: [0, 0, 1] } // Default axis
      };
      robot.joints.push(joint);
    });

    return robot;
  }

  /**
   * Convert URDF robot to XML string
   */
  urdfToXml(robot: URDFRobot): string {
    let xml = '<?xml version="1.0"?>\n';
    xml += `<robot name="${robot.name}">\n\n`;

    // Add materials
    robot.materials.forEach(material => {
      xml += `  <material name="${material.name}">\n`;
      if (material.color) {
        xml += `    <color rgba="${material.color.rgba}"/>\n`;
      }
      if (material.texture) {
        xml += `    <texture filename="${material.texture.filename}"/>\n`;
      }
      xml += `  </material>\n\n`;
    });

    // Add links
    robot.links.forEach(link => {
      xml += `  <link name="${link.name}">\n`;
      
      // Visual
      xml += `    <visual>\n`;
      xml += this.geometryToXml(link.visual.geometry, 6);
      if (link.visual.material) {
        xml += `      <material name="${link.visual.material.name}"/>\n`;
      }
      if (link.visual.origin) {
        xml += this.originToXml(link.visual.origin, 6);
      }
      xml += `    </visual>\n`;

      // Collision
      if (link.collision) {
        xml += `    <collision>\n`;
        xml += this.geometryToXml(link.collision.geometry, 6);
        if (link.collision.origin) {
          xml += this.originToXml(link.collision.origin, 6);
        }
        xml += `    </collision>\n`;
      }

      // Inertial
      if (link.inertial) {
        xml += `    <inertial>\n`;
        xml += `      <mass value="${link.inertial.mass}"/>\n`;
        xml += this.inertiaToXml(link.inertial.inertia, 6);
        if (link.inertial.origin) {
          xml += this.originToXml(link.inertial.origin, 6);
        }
        xml += `    </inertial>\n`;
      }

      xml += `  </link>\n\n`;
    });

    // Add joints
    robot.joints.forEach(joint => {
      xml += `  <joint name="${joint.name}" type="${joint.type}">\n`;
      xml += `    <parent link="${joint.parent}"/>\n`;
      xml += `    <child link="${joint.child}"/>\n`;
      if (joint.origin) {
        xml += this.originToXml(joint.origin, 4);
      }
      if (joint.axis) {
        xml += `    <axis xyz="${joint.axis.xyz.join(' ')}"/>\n`;
      }
      if (joint.limit) {
        xml += `    <limit lower="${joint.limit.lower}" upper="${joint.limit.upper}" effort="${joint.limit.effort}" velocity="${joint.limit.velocity}"/>\n`;
      }
      xml += `  </joint>\n\n`;
    });

    xml += '</robot>';
    return xml;
  }

  /**
   * Create geometry from part data
   */
  private createGeometryFromPart(part: OnshapePart, stlFiles: Map<string, Blob>): URDFGeometry {
    if (stlFiles.has(part.id)) {
      return {
        type: 'mesh',
        filename: `package://${part.name.toLowerCase()}/meshes/${part.name}.stl`,
        scale: [1, 1, 1]
      };
    } else if (part.boundingBox) {
      // Create bounding box geometry as fallback
      const size = [
        part.boundingBox.maxCorner[0] - part.boundingBox.minCorner[0],
        part.boundingBox.maxCorner[1] - part.boundingBox.minCorner[1],
        part.boundingBox.maxCorner[2] - part.boundingBox.minCorner[2]
      ];
      return {
        type: 'box',
        size: size
      };
    } else {
      // Default box geometry
      return {
        type: 'box',
        size: [0.1, 0.1, 0.1]
      };
    }
  }

  /**
   * Create collision geometry (simplified bounding box)
   */
  private createCollisionGeometry(part: OnshapePart): URDFGeometry {
    if (part.boundingBox) {
      const size = [
        part.boundingBox.maxCorner[0] - part.boundingBox.minCorner[0],
        part.boundingBox.maxCorner[1] - part.boundingBox.minCorner[1],
        part.boundingBox.maxCorner[2] - part.boundingBox.minCorner[2]
      ];
      return {
        type: 'box',
        size: size
      };
    } else {
      return {
        type: 'box',
        size: [0.1, 0.1, 0.1]
      };
    }
  }

  /**
   * Calculate origin from part data
   */
  private calculateOrigin(part: OnshapePart): URDFOrigin {
    if (part.boundingBox) {
      const center = [
        (part.boundingBox.minCorner[0] + part.boundingBox.maxCorner[0]) / 2,
        (part.boundingBox.minCorner[1] + part.boundingBox.maxCorner[1]) / 2,
        (part.boundingBox.minCorner[2] + part.boundingBox.maxCorner[2]) / 2
      ];
      return {
        xyz: center,
        rpy: [0, 0, 0]
      };
    }
    return {
      xyz: [0, 0, 0],
      rpy: [0, 0, 0]
    };
  }

  /**
   * Calculate joint origin from element transform
   */
  private calculateJointOrigin(element: any): URDFOrigin {
    if (element.transform && element.transform.length >= 12) {
      // Extract translation from 4x4 transformation matrix
      return {
        xyz: [element.transform[3], element.transform[7], element.transform[11]],
        rpy: [0, 0, 0] // Could extract rotation from matrix if needed
      };
    }
    return {
      xyz: [0, 0, 0],
      rpy: [0, 0, 0]
    };
  }

  /**
   * Calculate inertial properties (simplified)
   */
  private calculateInertial(part: OnshapePart): URDFInertial {
    // Simplified mass calculation based on bounding box volume
    let mass = 0.1; // Default mass
    if (part.boundingBox) {
      const volume = 
        (part.boundingBox.maxCorner[0] - part.boundingBox.minCorner[0]) *
        (part.boundingBox.maxCorner[1] - part.boundingBox.minCorner[1]) *
        (part.boundingBox.maxCorner[2] - part.boundingBox.minCorner[2]);
      mass = Math.max(0.01, volume * 0.001); // Assume density of 0.001 kg/cm³
    }

    // Simplified inertia calculation for box
    const size = part.boundingBox ? [
      part.boundingBox.maxCorner[0] - part.boundingBox.minCorner[0],
      part.boundingBox.maxCorner[1] - part.boundingBox.minCorner[1],
      part.boundingBox.maxCorner[2] - part.boundingBox.minCorner[2]
    ] : [0.1, 0.1, 0.1];

    const inertia = this.calculateBoxInertia(mass, size);

    return {
      mass: mass,
      inertia: inertia,
      origin: this.calculateOrigin(part)
    };
  }

  /**
   * Calculate inertia tensor for a box
   */
  private calculateBoxInertia(mass: number, size: number[]): URDFInertia {
    const [x, y, z] = size;
    const ixx = (mass / 12) * (y * y + z * z);
    const iyy = (mass / 12) * (x * x + z * z);
    const izz = (mass / 12) * (x * x + y * y);
    
    return {
      ixx: ixx,
      ixy: 0,
      ixz: 0,
      iyy: iyy,
      iyz: 0,
      izz: izz
    };
  }

  /**
   * Sanitize names for URDF compatibility
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .toLowerCase();
  }

  /**
   * Generate random color for materials
   */
  private generateRandomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `${r/255} ${g/255} ${b/255} 1`;
  }

  /**
   * Convert geometry to XML
   */
  private geometryToXml(geometry: URDFGeometry, indent: number): string {
    const spaces = ' '.repeat(indent);
    let xml = `${spaces}<geometry>\n`;
    
    switch (geometry.type) {
      case 'box':
        xml += `${spaces}  <box size="${geometry.size?.join(' ') || '0.1 0.1 0.1'}"/>\n`;
        break;
      case 'cylinder':
        xml += `${spaces}  <cylinder radius="${geometry.size?.[0] || 0.05}" length="${geometry.size?.[1] || 0.1}"/>\n`;
        break;
      case 'sphere':
        xml += `${spaces}  <sphere radius="${geometry.size?.[0] || 0.05}"/>\n`;
        break;
      case 'mesh':
        xml += `${spaces}  <mesh filename="${geometry.filename || 'mesh.stl'}"`;
        if (geometry.scale) {
          xml += ` scale="${geometry.scale.join(' ')}"`;
        }
        xml += `/>\n`;
        break;
    }
    
    xml += `${spaces}</geometry>\n`;
    return xml;
  }

  /**
   * Convert origin to XML
   */
  private originToXml(origin: URDFOrigin, indent: number): string {
    const spaces = ' '.repeat(indent);
    return `${spaces}<origin xyz="${origin.xyz.join(' ')}" rpy="${origin.rpy.join(' ')}"/>\n`;
  }

  /**
   * Convert inertia to XML
   */
  private inertiaToXml(inertia: URDFInertia, indent: number): string {
    const spaces = ' '.repeat(indent);
    return `${spaces}<inertia ixx="${inertia.ixx}" ixy="${inertia.ixy}" ixz="${inertia.ixz}" iyy="${inertia.iyy}" iyz="${inertia.iyz}" izz="${inertia.izz}"/>\n`;
  }
}

