import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function upgrade(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry;
    const hasColor = !!(geo && geo.getAttribute && geo.getAttribute("color"));
    const list = Array.isArray(o.material) ? o.material : [o.material];
    list.forEach((m) => {
      if (!m) return;
      if (hasColor) {
        m.map = null;
        m.emissiveMap = null;
        m.vertexColors = true;
        if (m.color) m.color.setHex(0xffffff);
      }
      if (m.emissive) m.emissive.setHex(0x4a1018);
      m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 0.28);
      m.needsUpdate = true;
    });
  });
}

function fitHeight(root, h) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.multiplyScalar(h / Math.max(size.y, 0.001));
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y;
}

export class Loadout {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.catalog = null;
    this.cache = new Map();
    this.character = null;
    this.weapon = null;
    this.levels = [];
    this.selected = { character: "", weapon: "", level: "" };
  }

  async init(catalog) {
    this.catalog = catalog;
  }

  find(kind, id) {
    return (this.catalog[kind] || []).find((e) => e.id === id && e.enabled) || null;
  }

  currentWeaponDamage() {
    const w = this.find("weapons", this.selected.weapon);
    return w ? w.damage : 18;
  }

  loadFile(file) {
    if (this.cache.has(file)) return Promise.resolve(this.cache.get(file).clone());
    return new Promise((resolve) => {
      this.loader.load("./models/" + file, (g) => {
        upgrade(g.scene);
        this.cache.set(file, g.scene);
        resolve(g.scene.clone());
      }, undefined, () => resolve(null));
    });
  }

  async equipCharacter(id, parent) {
    const entry = this.find("characters", id);
    if (!entry) return false;
    const node = await this.loadFile(entry.file);
    if (!node) return false;
    if (this.character) parent.remove(this.character);
    fitHeight(node, entry.scale || 1.72);
    parent.add(node);
    this.character = node;
    this.selected.character = id;
    return true;
  }

  async equipWeapon(id, parent) {
    const entry = this.find("weapons", id);
    if (!entry) return false;
    const node = await this.loadFile(entry.file);
    if (!node) return false;
    if (this.weapon) parent.remove(this.weapon);
    fitHeight(node, 1.15);
    node.position.set(0.38, 0.85, 0.15);
    node.rotation.set(0.2, 0, -0.4);
    parent.add(node);
    this.weapon = node;
    this.selected.weapon = id;
    return true;
  }

  async loadLevel(id, { instanceRepeatedMeshes } = {}) {
    const entry = this.find("levels", id);
    if (!entry) return false;
    const node = await this.loadFile(entry.file);
    if (!node) return false;
    fitHeight(node, entry.height || 12);
    node.position.set(entry.x || 0, 0, entry.z || 0);
    if (entry.instance && instanceRepeatedMeshes) instanceRepeatedMeshes(node, 8);
    this.scene.add(node);
    this.levels.push(node);
    this.selected.level = id;
    return true;
  }

  async loadAllLevels(helpers) {
    for (const entry of this.catalog.levels || []) {
      if (entry.enabled) await this.loadLevel(entry.id, helpers);
    }
    for (const entry of this.catalog.props || []) {
      if (!entry.enabled) continue;
      const node = await this.loadFile(entry.file);
      if (!node) continue;
      fitHeight(node, entry.height || 2);
      node.position.set(entry.x || 0, 0, entry.z || 0);
      this.scene.add(node);
    }
  }
}

export { upgrade, fitHeight };
