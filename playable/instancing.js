import * as THREE from "three";

const dummy = new THREE.Object3D();
const tmp = new THREE.Vector3();
const sphere = new THREE.Sphere();

function centroidAndExtent(geo) {
  const pos = geo.getAttribute("position");
  let cx = 0, cy = 0, cz = 0;
  let minx = Infinity, miny = Infinity, minz = Infinity;
  let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    cx += x; cy += y; cz += z;
    if (x < minx) minx = x; if (y < miny) miny = y; if (z < minz) minz = z;
    if (x > maxx) maxx = x; if (y > maxy) maxy = y; if (z > maxz) maxz = z;
  }
  const n = Math.max(1, pos.count);
  return {
    cx: cx / n, cy: cy / n, cz: cz / n,
    ex: Math.max(1e-6, maxx - minx),
    ey: Math.max(1e-6, maxy - miny),
    ez: Math.max(1e-6, maxz - minz),
  };
}

function localPrototype(geo) {
  const g = geo.clone();
  const pos = g.getAttribute("position");
  const { cx, cy, cz } = centroidAndExtent(g);
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) - cx, pos.getY(i) - cy, pos.getZ(i) - cz);
  }
  pos.needsUpdate = true;
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** Collapse repeated baked-world meshes into InstancedMesh (one draw per topology). */
export function instanceRepeatedMeshes(root, minCount = 8) {
  const groups = new Map();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const pos = o.geometry.getAttribute("position");
    if (!pos) return;
    const ic = o.geometry.index ? o.geometry.index.count : 0;
    const key = pos.count + ":" + ic;
    const list = groups.get(key);
    if (list) list.push(o);
    else groups.set(key, [o]);
  });
  let n = 0;
  for (const list of groups.values()) {
    if (list.length < minCount) continue;
    const proto = list[0];
    const local = localPrototype(proto.geometry);
    const protoExt = centroidAndExtent(local);
    const im = new THREE.InstancedMesh(local, proto.material, list.length);
    im.name = "instanced_" + list.length;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const field = new THREE.Box3();
    list.forEach((m, i) => {
      const e = centroidAndExtent(m.geometry);
      dummy.position.set(e.cx, e.cy, e.cz);
      dummy.quaternion.identity();
      dummy.scale.set(e.ex / protoExt.ex, e.ey / protoExt.ey, e.ez / protoExt.ez);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      m.updateWorldMatrix(true, false);
      field.expandByObject(m);
      m.parent && m.parent.remove(m);
    });
    im.instanceMatrix.needsUpdate = true;
    field.getBoundingSphere(sphere);
    im.boundingSphere = sphere.clone();
    im.frustumCulled = true;
    root.add(im);
    n++;
  }
  return n;
}

export function makeBoltPool(capacity = 64) {
  const geo = new THREE.SphereGeometry(0.22, 10, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff3a14, emissive: 0xff2a00, emissiveIntensity: 3,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, capacity);
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  return { mesh, dummy, tmp, capacity };
}
