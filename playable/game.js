import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const phpEl = document.getElementById("php");
const dhpEl = document.getElementById("dhp");
const statusEl = document.getElementById("status");
const endEl = document.getElementById("end");
const endTitle = document.getElementById("endtitle");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07040a);
scene.fog = new THREE.Fog(0x1a0508, 28, 90);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xff6655, 0x11080c, 0.7));
const sun = new THREE.DirectionalLight(0xff7a55, 1.2);
sun.position.set(12, 22, 10);
scene.add(sun);

const keys = {};
addEventListener("keydown", (e) => { keys[e.code] = true; if (e.code === "Space") e.preventDefault(); });
addEventListener("keyup", (e) => { keys[e.code] = false; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0x161214 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  m.position.set(x, y, z); scene.add(m); return m;
}
box(16, 8, 12, 0x2a2426, 0, 4, -6);
box(6, 10, 6, 0x161214, -8, 5, -10);
box(6, 10, 6, 0x161214, 8, 5, -10);
const throne = box(3.2, 3.4, 1.4, 0xaa8830, 0, 2.2, -4.2);

const player = { hp: 100, speed: 9, range: 3.4, cd: 0, dmg: 18, alive: true,
  mesh: new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.05, 6, 10), new THREE.MeshStandardMaterial({ color: 0xc9a36a })) };
player.mesh.position.set(0, 1.1, 10); scene.add(player.mesh);

const dragon = { hp: 420, alive: true, spitCd: 0, biteCd: 0, angle: 0, woke: false, mesh: new THREE.Group() };
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x120c0e, emissive: 0x3a0505, emissiveIntensity: 0.35 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), mat); body.scale.set(1.5, 0.7, 2.1);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 8), mat); head.rotation.x = Math.PI / 2; head.position.set(0, 0.15, 2.1);
  dragon.mesh.add(body, head); dragon.mesh.position.set(0, 10.2, -2); scene.add(dragon.mesh);
}
const bolts = [];
function spit() {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3a14, emissive: 0xff2a00, emissiveIntensity: 3 }));
  mesh.position.copy(dragon.mesh.position);
  const dir = player.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(mesh.position).normalize();
  bolts.push({ mesh, dir, life: 3.2 }); scene.add(mesh);
}
async function loadOptional() {
  const loader = new GLTFLoader();
  const tryLoad = (path, parent, scale = 1) => new Promise((resolve) => {
    loader.load(path, (g) => { g.scene.scale.setScalar(scale); parent.add(g.scene); resolve(true); }, undefined, () => resolve(false));
  });
  await tryLoad("./models/crimson_cosmos_sky.glb", scene, 1);
  const placeRoot = new THREE.Group(); scene.add(placeRoot);
  if (!(await tryLoad("./models/crimson_world_places.glb", placeRoot, 1))) await tryLoad("./models/dragon_palace.glb", placeRoot, 1);
}
const clock = new THREE.Clock(); let over = false;
function end(win) {
  over = true; endTitle.textContent = win ? "The palace is yours." : "You fell in the palace.";
  endEl.classList.add("show");
}
function attack() {
  if (player.cd > 0 || !player.alive) return; player.cd = 0.45;
  if (player.mesh.position.distanceTo(dragon.mesh.position) <= player.range + 1.2 && dragon.alive) {
    dragon.hp = Math.max(0, dragon.hp - player.dmg); dhpEl.textContent = dragon.hp;
    if (dragon.hp <= 0) { dragon.alive = false; end(true); }
  }
}
function tickDragon(dt) {
  if (!dragon.alive) return;
  const dist = player.mesh.position.distanceTo(dragon.mesh.position);
  dragon.spitCd = Math.max(0, dragon.spitCd - dt); dragon.biteCd = Math.max(0, dragon.biteCd - dt);
  if (!dragon.woke) {
    if (player.mesh.position.distanceTo(throne.position) < 3.6) { dragon.woke = true; statusEl.textContent = "The dragon wakes."; }
    return;
  }
  dragon.angle += dt * 0.85;
  dragon.mesh.position.lerp(new THREE.Vector3(player.mesh.position.x + Math.cos(dragon.angle) * 11, 7.2, player.mesh.position.z + Math.sin(dragon.angle) * 11), 1 - Math.pow(0.08, dt));
  dragon.mesh.lookAt(player.mesh.position.x, dragon.mesh.position.y, player.mesh.position.z);
  if (dist < 4.6 && dragon.biteCd <= 0) {
    player.hp = Math.max(0, player.hp - 28); phpEl.textContent = player.hp; dragon.biteCd = 1.4;
    if (player.hp <= 0) { player.alive = false; end(false); }
  } else if (dist < 18 && dist > 6 && dragon.spitCd <= 0) { spit(); dragon.spitCd = 2.1; }
}
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!over && player.alive) {
    player.cd = Math.max(0, player.cd - dt);
    const move = new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0), 0, (keys.KeyS?1:0)-(keys.KeyW?1:0));
    if (move.length() > 0) { move.normalize().multiplyScalar(player.speed * dt); player.mesh.position.add(move); }
    if (keys.Space) attack();
    tickDragon(dt);
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i]; b.life -= dt; b.mesh.position.addScaledVector(b.dir, 22 * dt);
    if (player.alive && b.mesh.position.distanceTo(player.mesh.position) < 0.9) {
      player.hp = Math.max(0, player.hp - 16); phpEl.textContent = player.hp;
      scene.remove(b.mesh); bolts.splice(i, 1);
      if (player.hp <= 0) { player.alive = false; end(false); } continue;
    }
    if (b.life <= 0) { scene.remove(b.mesh); bolts.splice(i, 1); }
  }
  camera.position.lerp(player.mesh.position.clone().add(new THREE.Vector3(0, 4.2, 8.2)), 0.08);
  camera.lookAt(player.mesh.position.x, player.mesh.position.y + 1.1, player.mesh.position.z);
  renderer.render(scene, camera);
}
loadOptional().finally(() => loop());
