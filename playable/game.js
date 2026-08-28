import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { instanceRepeatedMeshes, makeBoltPool } from "./instancing.js";
import { Loadout } from "./loadout.js";
import { NpcDirector } from "./npc-director.js";
import { makeSky } from "./sky.js";

const $ = (id) => document.getElementById(id);
const menu = $("menu"), help = $("help"), hud = $("hud"), statusEl = $("status"), endEl = $("end");
let started = false, over = false, audio;

function makeAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, dur, type = "sawtooth", gain = 0.06) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  };
  return {
    start: () => beep(90, 0.4, "square", 0.05),
    roar: () => { beep(70, 0.5); beep(110, 0.35, "triangle", 0.04); },
    spit: () => beep(320, 0.18, "square", 0.05),
    hit: () => beep(180, 0.12, "square", 0.07),
    win: () => { beep(260, 0.2); setTimeout(() => beep(390, 0.35), 160); },
    lose: () => beep(60, 0.7),
  };
}

$("btnHelp").onclick = () => help.classList.remove("hidden");
$("btnHelpBack").onclick = () => help.classList.add("hidden");
$("btnStart").onclick = () => {
  audio = makeAudio(); audio.start(); started = true;
  menu.classList.add("hidden"); hud.style.display = "block"; statusEl.style.display = "block";
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0208);
scene.fog = new THREE.Fog(0x1a0508, 40, 180);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.15, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xff6a55, 0.7));
scene.add(new THREE.HemisphereLight(0xff5570, 0x1a0508, 0.9));
const sun = new THREE.DirectionalLight(0xff7a55, 1.25);
sun.position.set(12, 22, 40);
scene.add(sun);
const fill = new THREE.PointLight(0xff4422, 40, 80, 1.4);
fill.position.set(6, 10, 18);
scene.add(fill);

const sky = makeSky(scene);

const keys = {};
addEventListener("keydown", (e) => { keys[e.code] = true; if (e.code === "Space") e.preventDefault(); });
addEventListener("keyup", (e) => { keys[e.code] = false; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const walls = [];
function addWall(w, h, d, x, y, z, color = 0x2a2426) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  m.position.set(x, y, z); scene.add(m); walls.push(new THREE.Box3().setFromObject(m)); return m;
}
const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: 0x161214, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
addWall(16, 8, 12, 0, 4, -8);
addWall(6, 10, 6, -8, 5, -12);
addWall(6, 10, 6, 8, 5, -12);
addWall(28, 6, 1.2, 0, 3, -18);
addWall(1.2, 6, 20, -14, 3, -8);
addWall(1.2, 6, 20, 14, 3, -8);
const throne = addWall(3.2, 3.4, 1.4, 0, 2.2, -3.2, 0xaa8830);

const player = {
  hp: 100, speed: 9, range: 4.2, cd: 0, dmg: 18, alive: true,
  mesh: new THREE.Group(),
};
const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.05, 6, 10), new THREE.MeshStandardMaterial({ color: 0xc9a36a }));
cap.name = "fallbackBody";
player.mesh.add(cap);
player.mesh.position.set(8, 1.1, 18);
scene.add(player.mesh);

const dragon = { hp: 420, alive: true, spitCd: 0, biteCd: 0, angle: 0, woke: false, mesh: new THREE.Group() };
const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.6, 3), new THREE.MeshStandardMaterial({ color: 0x7a1210 }));
const wingR = wingL.clone();
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x120c0e, emissive: 0x3a0505, emissiveIntensity: 0.35 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), mat); body.scale.set(1.5, 0.7, 2.1); body.name = "fallbackDragon";
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 8), mat); head.rotation.x = Math.PI / 2; head.position.set(0, 0.15, 2.1); head.name = "fallbackDragon";
  wingL.rotation.z = 1.05; wingL.position.set(-1.5, 0.45, 0); wingL.name = "fallbackWing";
  wingR.rotation.z = -1.05; wingR.position.set(1.5, 0.45, 0); wingR.name = "fallbackWing";
  dragon.mesh.add(body, head, wingL, wingR);
  dragon.mesh.position.set(6, 8.2, 4);
  scene.add(dragon.mesh);
}

const loadout = new Loadout(scene);
const loader = new GLTFLoader();
const npcs = new NpcDirector(scene, loader);

const boltPool = makeBoltPool(64);
scene.add(boltPool.mesh);
const bolts = [];
const boltDummy = new THREE.Object3D();
function spit() {
  if (bolts.length >= boltPool.capacity) return;
  const pos = dragon.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
  const dir = player.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(pos).normalize();
  bolts.push({ dir, life: 3.2, pos });
  audio && audio.spit();
}

function blocked(next) {
  const box = new THREE.Box3().setFromCenterAndSize(next, new THREE.Vector3(0.7, 1.6, 0.7));
  return walls.some((w) => w.intersectsBox(box));
}

async function loadOptional() {
  const catalog = await fetch("./catalog.json").then((r) => r.json()).catch(() => null);
  if (!catalog) return;
  await loadout.init(catalog);
  await loadout.loadAllLevels({ instanceRepeatedMeshes });
  const bodyOn = await loadout.equipCharacter("fire_sovereign", player.mesh);
  if (bodyOn) {
    const fb = player.mesh.getObjectByName("fallbackBody");
    if (fb) fb.visible = false;
  }
  await loadout.equipWeapon("hammer", player.mesh);
  player.dmg = loadout.currentWeaponDamage();
  const boss = catalog.bosses && catalog.bosses[0];
  if (boss) {
    const dr = await loadout.loadFile(boss.file);
    if (dr) {
      const { fitHeight } = await import("./loadout.js");
      fitHeight(dr, boss.scale || 6.8);
      dr.name = "crimson_dragon";
      dragon.mesh.children.slice().forEach((c) => {
        if (c.name && c.name.startsWith("fallback")) c.visible = false;
      });
      dragon.mesh.add(dr);
    }
  }
  await npcs.spawn("ankh_queen.glb", { x: -7, z: -10, h: 1.75, kind: "queen", hp: 90 });
  await npcs.spawn("crimson_elf.glb", { x: 16, z: 12, h: 1.7, kind: "elf", hp: 70 });
  await npcs.spawn("hooded_sorcerer_placeholder.glb", { x: -14, z: 10, h: 1.8, kind: "hooded", hp: 80 });
  await npcs.spawn("obsidian_demon.glb", { x: 18, z: 6, h: 2.4, kind: "demon", hp: 120 });
  await npcs.spawn("runic_sorceress.glb", { x: -12, z: 16, h: 1.85, kind: "sorceress", hp: 85 });
}

const clock = new THREE.Clock();
function end(win) {
  over = true;
  $("endtitle").textContent = win ? "The palace is yours." : "You fell in the palace.";
  endEl.classList.remove("hidden");
  audio && (win ? audio.win() : audio.lose());
}
function hurtPlayer(amt) {
  if (!player.alive) return;
  player.hp = Math.max(0, player.hp - amt);
  $("php").textContent = player.hp;
  audio && audio.hit();
  if (player.hp <= 0) { player.alive = false; end(false); }
}
function attack() {
  if (player.cd > 0 || !player.alive) return;
  player.cd = 0.45;
  let hit = false;
  if (player.mesh.position.distanceTo(dragon.mesh.position) <= player.range + 1.2 && dragon.alive) {
    dragon.hp = Math.max(0, dragon.hp - player.dmg);
    $("dhp").textContent = dragon.hp;
    hit = true;
    if (dragon.hp <= 0) { dragon.alive = false; end(true); }
  }
  if (npcs.strike(player.mesh.position, player.range, player.dmg)) hit = true;
  if (hit) audio && audio.hit();
}
function tickDragon(dt) {
  const flap = Math.sin(performance.now() * 0.012) * 0.35;
  wingL.rotation.z = 1.05 + flap;
  wingR.rotation.z = -1.05 - flap;
  if (!dragon.alive) {
    dragon.mesh.position.y = Math.max(0.6, dragon.mesh.position.y - dt * 3);
    return;
  }
  const dist = player.mesh.position.distanceTo(dragon.mesh.position);
  dragon.spitCd = Math.max(0, dragon.spitCd - dt);
  dragon.biteCd = Math.max(0, dragon.biteCd - dt);
  if (!dragon.woke) {
    if (player.mesh.position.distanceTo(throne.position) < 3.8) {
      dragon.woke = true;
      statusEl.textContent = "The dragon wakes. Defeat it.";
      audio && audio.roar();
    }
    return;
  }
  dragon.angle += dt * 0.85;
  dragon.mesh.position.lerp(
    new THREE.Vector3(
      player.mesh.position.x + Math.cos(dragon.angle) * 11,
      7.2,
      player.mesh.position.z + Math.sin(dragon.angle) * 11,
    ),
    1 - Math.pow(0.08, dt),
  );
  dragon.mesh.lookAt(player.mesh.position.x, dragon.mesh.position.y, player.mesh.position.z);
  if (dist < 4.6 && dragon.biteCd <= 0) {
    hurtPlayer(28);
    dragon.biteCd = 1.4;
  } else if (dist < 18 && dist > 6 && dragon.spitCd <= 0) {
    spit();
    dragon.spitCd = 2.1;
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  sky.tick(dt);
  if (started && !over && player.alive) {
    player.cd = Math.max(0, player.cd - dt);
    const move = new THREE.Vector3((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), 0, (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0));
    if (move.length() > 0) {
      move.normalize().multiplyScalar(player.speed * dt);
      const next = player.mesh.position.clone().add(move);
      if (!blocked(next)) player.mesh.position.copy(next);
    }
    if (keys.Space) attack();
    tickDragon(dt);
    npcs.tick(dt, player.mesh.position, hurtPlayer);
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.life -= dt;
    b.pos.addScaledVector(b.dir, 22 * dt);
    if (player.alive && started && b.pos.distanceTo(player.mesh.position) < 0.9) {
      hurtPlayer(16);
      bolts.splice(i, 1);
      continue;
    }
    if (b.life <= 0) bolts.splice(i, 1);
  }
  boltPool.mesh.count = bolts.length;
  bolts.forEach((b, i) => {
    boltDummy.position.copy(b.pos);
    boltDummy.updateMatrix();
    boltPool.mesh.setMatrixAt(i, boltDummy.matrix);
  });
  boltPool.mesh.instanceMatrix.needsUpdate = true;
  camera.position.lerp(player.mesh.position.clone().add(new THREE.Vector3(0, 4.2, 8.2)), 0.08);
  camera.lookAt(player.mesh.position.x, player.mesh.position.y + 1.1, player.mesh.position.z);
  fill.position.set(player.mesh.position.x + 2, player.mesh.position.y + 6, player.mesh.position.z + 3);
  renderer.render(scene, camera);
}
loadOptional().finally(() => loop());
