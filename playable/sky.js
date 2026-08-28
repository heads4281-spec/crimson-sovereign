import * as THREE from "three";

export function makeSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 32, 20),
    new THREE.MeshStandardMaterial({
      color: 0x3a1018,
      emissive: 0x220810,
      emissiveIntensity: 0.45,
      roughness: 1,
      metalness: 0,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  sky.position.set(0, 40, 0);
  sky.name = "sky_dome";
  scene.add(sky);
  return {
    mesh: sky,
    spin: 1.4 * Math.PI / 180,
    tick(dt) { sky.rotation.y += this.spin * dt; },
  };
}
