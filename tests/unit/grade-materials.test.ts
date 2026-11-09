import { describe, expect, it } from "bun:test";
import * as THREE from "three";
import { GradeMaterialFactory } from "../../apps/web/src/components/3d/materials/GradeMaterialFactory";

describe("Unit Suite: GradeMaterialFactory Shader Generator", () => {
  it("menghasilkan material MeshStandardMaterial untuk grade NORMAL dan BESAR", () => {
    const normalSet = GradeMaterialFactory.getMaterials("NORMAL");
    expect(normalSet.body instanceof THREE.MeshStandardMaterial).toBe(true);
    expect(normalSet.grade).toBe("NORMAL");

    const besarSet = GradeMaterialFactory.getMaterials("BESAR");
    expect(besarSet.body instanceof THREE.MeshStandardMaterial).toBe(true);
    expect(besarSet.grade).toBe("BESAR");
  });

  it("menghasilkan material metalik berkilau untuk grade EMAS", () => {
    const emasSet = GradeMaterialFactory.getMaterials("EMAS");
    const mat = emasSet.body as THREE.MeshStandardMaterial;

    expect(mat instanceof THREE.MeshStandardMaterial).toBe(true);
    expect(mat.metalness).toBe(0.95);
    expect(mat.roughness).toBe(0.12);
  });

  it("menghasilkan material kristal transparan MeshPhysicalMaterial untuk grade BERLIAN", () => {
    const berlianSet = GradeMaterialFactory.getMaterials("BERLIAN");
    const mat = berlianSet.body as THREE.MeshPhysicalMaterial;

    expect(mat instanceof THREE.MeshPhysicalMaterial).toBe(true);
    expect(mat.transmission).toBe(0.85);
    expect(mat.ior).toBe(2.4);
    expect(mat.roughness).toBe(0.05);
  });

  it("menghasilkan material kristal pendaran MeshPhysicalMaterial untuk grade RUBI", () => {
    const rubiSet = GradeMaterialFactory.getMaterials("RUBI");
    const mat = rubiSet.body as THREE.MeshPhysicalMaterial;

    expect(mat instanceof THREE.MeshPhysicalMaterial).toBe(true);
    expect(mat.metalness).toBe(0.8);
    expect(mat.emissiveIntensity).toBe(0.6);
  });

  it("menggunakan singleton caching agar tidak mengalokasikan ulang shader material yang sama", () => {
    const call1 = GradeMaterialFactory.getMaterials("EMAS");
    const call2 = GradeMaterialFactory.getMaterials("EMAS");
    expect(call1).toBe(call2);
  });
});
