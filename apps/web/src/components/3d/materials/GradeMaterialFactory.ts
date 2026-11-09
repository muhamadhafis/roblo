import * as THREE from "three";
import type { Grade } from "@nomnom/shared";

export interface EntityMaterialSet {
  body: THREE.Material;
  accentYellow: THREE.Material;
  accentRed: THREE.Material;
  accentPink: THREE.Material;
  accentWhite: THREE.Material;
  accentBlack: THREE.Material;
  grade: Grade;
}

export class GradeMaterialFactory {
  private static cache: Map<Grade, EntityMaterialSet> = new Map();

  public static getMaterials(grade: Grade = "NORMAL"): EntityMaterialSet {
    if (this.cache.has(grade)) {
      return this.cache.get(grade)!;
    }

    const set = this.createMaterialSet(grade);
    this.cache.set(grade, set);
    return set;
  }

  private static createMaterialSet(grade: Grade): EntityMaterialSet {
    const accentYellow = new THREE.MeshStandardMaterial({
      color: "#F4C430",
      roughness: 0.5,
    });
    const accentRed = new THREE.MeshStandardMaterial({
      color: "#D2143A",
      roughness: 0.5,
    });
    const accentPink = new THREE.MeshStandardMaterial({
      color: "#FFB6C1",
      roughness: 0.5,
    });
    const accentWhite = new THREE.MeshStandardMaterial({
      color: "#FAFAFA",
      roughness: 0.4,
    });
    const accentBlack = new THREE.MeshStandardMaterial({
      color: "#111111",
      roughness: 0.8,
    });

    let bodyMaterial: THREE.Material;

    switch (grade) {
      case "EMAS":
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: "#FFD700",
          metalness: 0.95,
          roughness: 0.12,
        });
        break;

      case "BERLIAN":
        bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: "#A5F2F3",
          transmission: 0.85,
          ior: 2.4,
          roughness: 0.05,
          thickness: 0.6,
        });
        break;

      case "RUBI":
        bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: "#E0115F",
          emissive: new THREE.Color("#4A0018"),
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.8,
        });
        break;

      case "BESAR":
      case "NORMAL":
      default:
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: "#EFEFEF",
          roughness: 0.6,
          metalness: 0.1,
        });
        break;
    }

    return {
      body: bodyMaterial,
      accentYellow,
      accentRed,
      accentPink,
      accentWhite,
      accentBlack,
      grade,
    };
  }
}
