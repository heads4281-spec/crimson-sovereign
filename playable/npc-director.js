import * as THREE from "three";
import { upgrade, fitHeight } from "./loadout.js";

export class NpcDirector {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.npcs = [];
  }

  async spawn(file, { x, y = 0, z, h, kind, hp }) {
    const node = await new Promise((resolve) => {
      this.loader.load("./models/" + file, (g) => resolve(g.scene), undefined, () => resolve(null));
    });
    const root = new THREE.Group();
    if (node) {
      upgrade(node);
      fitHeight(node, h);
      root.add(node);
    } else {
      const fallback = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 1.1, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a1018, emissive: 0x2a0508, emissiveIntensity: 0.4 }),
      );
      fallback.position.y = 0.9;
      root.add(fallback);
    }
    root.position.set(x, y, z);
    this.scene.add(root);
    const npc = {
      mesh: root, kind, hp, max: hp, alive: true,
      cd: 0, home: new THREE.Vector3(x, y, z),
    };
    this.npcs.push(npc);
    return npc;
  }

  living() {
    return this.npcs.filter((n) => n.alive && n.hp > 0);
  }

  tick(dt, playerPos, onHitPlayer) {
    for (const n of this.npcs) {
      if (!n.alive) continue;
      if (n.kind === "dragon") continue;
      n.cd = Math.max(0, n.cd - dt);
      const dx = playerPos.x - n.mesh.position.x;
      const dz = playerPos.z - n.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 14 && dist > 1.6) {
        n.mesh.position.x += (dx / dist) * 3.2 * dt;
        n.mesh.position.z += (dz / dist) * 3.2 * dt;
        n.mesh.lookAt(playerPos.x, n.mesh.position.y, playerPos.z);
      }
      if (dist < 1.7 && n.cd <= 0) {
        n.cd = 1.2;
        onHitPlayer(12);
      }
    }
  }

  strike(origin, range, dmg) {
    let hit = 0;
    for (const n of this.npcs) {
      if (!n.alive || n.kind === "dragon") continue;
      if (origin.distanceTo(n.mesh.position) <= range) {
        n.hp -= dmg;
        hit++;
        if (n.hp <= 0) {
          n.alive = false;
          n.mesh.rotation.x = Math.PI / 2;
        }
      }
    }
    return hit;
  }
}
