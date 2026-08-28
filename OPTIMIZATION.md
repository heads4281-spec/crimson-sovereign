# glTF 2.0 optimization for this pack

Authoring copies stay as uploaded. Runtime / `_opt` siblings take the cuts.

| Step | Asset | Action |
|---|---|---|
| 1 Draw calls | obelisk field | `InstancedMesh` / `EXT_mesh_gpu_instancing` |
| 2 Indices | weapons | `UNSIGNED_SHORT` when verts < 65535 |
| 3 Join | dragon, sovereign, cathedral | 1–4 meshes, keep `crimson_dragon.glb` source |
| 4 Quantize | dragon BIN | `KHR_mesh_quantization` + meshopt on `_opt` only |
| 5 Draco | later | not first; 130 primitives would decode 130 times |

Do not parent sky/well to the camera. `BackSide` + lights. Spawn outside volumes.
