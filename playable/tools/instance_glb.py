#!/usr/bin/env python3
"""Rewrite a baked-world trimesh GLB into EXT_mesh_gpu_instancing."""
import json, struct, sys
from pathlib import Path
from collections import defaultdict
import numpy as np

def read_glb(path):
    data = Path(path).read_bytes()
    off = 12
    j, blob = None, b""
    while off + 8 <= len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off)
        chunk = data[off + 8 : off + 8 + clen]
        if ctype.startswith(b"JSON"):
            j = json.loads(chunk)
        elif ctype.startswith(b"BIN"):
            blob = chunk
        off += 8 + clen + ((4 - (clen % 4)) % 4)
    return j, blob

def acc_bytes(j, blob, aid):
    acc = j["accessors"][aid]
    bv = j["bufferViews"][acc["bufferView"]]
    off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    n = acc["count"]
    ctype = acc["componentType"]
    typ = acc["type"]
    comps = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[typ]
    fmt = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}[ctype]
    raw = np.frombuffer(blob, dtype=np.dtype(fmt), count=n * comps, offset=off)
    return raw.reshape(n, comps).copy(), acc

def pad4(b):
    return b + b"\x00" * ((4 - (len(b) % 4)) % 4)

def write_glb(j, blob, path):
    jbytes = pad4(json.dumps(j, separators=(",", ":")).encode("utf-8"))
    blob = pad4(blob)
    header = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(jbytes) + 8 + len(blob))
    out = header
    out += struct.pack("<I4s", len(jbytes), b"JSON") + jbytes
    out += struct.pack("<I4s", len(blob), b"BIN\x00") + blob
    Path(path).write_bytes(out)

def instance_file(src, dst):
    j, blob = read_glb(src)
    groups = defaultdict(list)
    for ni, node in enumerate(j["nodes"]):
        if "mesh" not in node:
            continue
        mesh = j["meshes"][node["mesh"]]
        pr = mesh["primitives"][0]
        pos, _ = acc_bytes(j, blob, pr["attributes"]["POSITION"])
        col = None
        if "COLOR_0" in pr["attributes"]:
            col, _ = acc_bytes(j, blob, pr["attributes"]["COLOR_0"])
        idx = None
        if "indices" in pr:
            idx, _ = acc_bytes(j, blob, pr["indices"])
        key = (pos.shape[0], 0 if idx is None else idx.size)
        groups[key].append((ni, pos, col, idx))

    new_blob = bytearray()
    views, accessors, meshes, nodes = [], [], [], []

    def push(arr, target="ARRAY_BUFFER"):
        raw = arr.tobytes()
        off = len(new_blob)
        new_blob.extend(pad4(raw))
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(raw), "target": 34963 if target == "ELEMENT" else 34962})
        return len(views) - 1

    def acc(view, count, ctype, typ, mn=None, mx=None, normalized=False):
        a = {"bufferView": view, "componentType": ctype, "count": count, "type": typ}
        if normalized:
            a["normalized"] = True
        if mn is not None:
            a["min"] = mn
            a["max"] = mx
        accessors.append(a)
        return len(accessors) - 1

    for key, items in groups.items():
        proto_pos = items[0][1]
        c0 = proto_pos.mean(axis=0)
        local = (proto_pos - c0).astype(np.float32)
        trans = np.array([it[1].mean(axis=0) for it in items], dtype=np.float32)
        scales = []
        proto_ext = np.maximum(local.max(0) - local.min(0), 1e-6)
        for _, pos, _, _ in items:
            loc = pos - pos.mean(0)
            ext = np.maximum(loc.max(0) - loc.min(0), 1e-6)
            scales.append(ext / proto_ext)
        scales = np.array(scales, dtype=np.float32)
        rots = np.tile(np.array([0, 0, 0, 1], np.float32), (len(items), 1))

        pv = push(local)
        pa = acc(pv, local.shape[0], 5126, "VEC3", local.min(0).tolist(), local.max(0).tolist())
        attrs = {"POSITION": pa}
        if items[0][2] is not None:
            col = items[0][2].astype(np.uint8)
            cv = push(col)
            attrs["COLOR_0"] = acc(cv, col.shape[0], 5121, "VEC4", normalized=True)
        indices_id = None
        if items[0][3] is not None:
            idx = items[0][3].astype(np.uint16).reshape(-1)
            iv = push(idx, "ELEMENT")
            indices_id = acc(iv, idx.size, 5123, "SCALAR")

        prim = {"attributes": attrs, "mode": 4}
        if indices_id is not None:
            prim["indices"] = indices_id
        meshes.append({"primitives": [prim]})
        mesh_id = len(meshes) - 1

        tv = push(trans)
        ta = acc(tv, len(items), 5126, "VEC3", trans.min(0).tolist(), trans.max(0).tolist())
        rv = push(rots)
        ra = acc(rv, len(items), 5126, "VEC4")
        sv = push(scales)
        sa = acc(sv, len(items), 5126, "VEC3", scales.min(0).tolist(), scales.max(0).tolist())
        nodes.append({
            "mesh": mesh_id,
            "name": "instanced_%d" % len(items),
            "extensions": {
                "EXT_mesh_gpu_instancing": {
                    "attributes": {"TRANSLATION": ta, "ROTATION": ra, "SCALE": sa}
                }
            },
        })

    out = {
        "asset": {"version": "2.0", "generator": "crimson-instancer"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(new_blob)}],
        "extensionsUsed": ["EXT_mesh_gpu_instancing"],
    }
    write_glb(out, bytes(new_blob), dst)
    print("wrote", dst, "nodes", len(nodes), "bytes", Path(dst).stat().st_size)

if __name__ == "__main__":
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    instance_file(src, dst)
