# Instancing — what we shipped

`obsidian_obelisk_field.glb` was 446 unique meshes (417 identical cubes) with positions baked in world space. No `EXT_mesh_gpu_instancing`.

## Runtime (live fight)

`playable/instancing.js` and `src/game/instancing.ts`:

- Group meshes by vertex/index count
- Build a local-space prototype (subtract centroid)
- One `THREE.InstancedMesh` per topology
- Firebolts use an InstancedMesh pool of 64, not a new Mesh per spit

Obelisk field: **3 draws** instead of **446**.

## File rewrite

```
python3 playable/tools/instance_glb.py \
  models/obsidian_obelisk_field_src.glb \
  models/obsidian_obelisk_field.glb
```

Writes `EXT_mesh_gpu_instancing` with `TRANSLATION` / `ROTATION` / `SCALE`.

The original dragon `crimson_dragon.glb` is never rewritten. Join/quantize that as a sibling `_opt` only.
