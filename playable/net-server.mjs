#!/usr/bin/env node
/** Static playable + 100-player palace relay (HTTP poll, no extra deps). */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const MAX = 100;
const STALE_MS = 5000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const rooms = new Map();

function room(name) {
  const id = (name || "palace").slice(0, 24);
  if (!rooms.has(id)) rooms.set(id, { players: new Map(), host: null, world: null, seq: 0 });
  return rooms.get(id);
}

function prune(r, now) {
  for (const [id, p] of r.players) {
    if (now - p.seen > STALE_MS) r.players.delete(id);
  }
  if (r.host && !r.players.has(r.host)) r.host = r.players.keys().next().value || null;
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > 64_000) {
        req.destroy();
        reject(new Error("too large"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

function handleNet(msg) {
  const now = Date.now();
  const r = room(msg.room);
  prune(r, now);
  const op = msg.op;

  if (op === "join") {
    if (r.players.size >= MAX) return { ok: false, err: "full", n: r.players.size, max: MAX };
    r.seq += 1;
    const id = "p" + r.seq;
    if (!r.host) r.host = id;
    r.players.set(id, { id, name: String(msg.name || "Sovereign").slice(0, 24), x: 8, y: 1.1, z: 18, yaw: 0, hp: 100, atk: 0, seen: now });
    return { ok: true, id, host: r.host, n: r.players.size, max: MAX };
  }

  const p = r.players.get(msg.id);
  if (!p) return { ok: false, err: "who" };
  p.seen = now;

  if (op === "pose" || op === "world") {
    if (msg.x != null) {
      p.x = +msg.x || 0; p.y = +msg.y || 0; p.z = +msg.z || 0;
      p.yaw = +msg.yaw || 0; p.hp = +msg.hp || 0; p.atk = msg.atk ? 1 : 0;
    }
  }
  if (op === "world" && msg.id === r.host) {
    r.world = {
      dragon: msg.dragon || null,
      npcs: msg.npcs || [],
      over: msg.over || false,
      win: !!msg.win,
    };
  }
  if (op === "leave") {
    r.players.delete(msg.id);
    if (r.host === msg.id) r.host = r.players.keys().next().value || null;
    return { ok: true, n: r.players.size };
  }

  const poses = [];
  for (const o of r.players.values()) {
    if (o.id === p.id) continue;
    poses.push([o.id, o.x, o.y, o.z, o.yaw, o.hp, o.atk]);
  }
  return {
    ok: true,
    host: r.host,
    you: p.id,
    n: r.players.size,
    max: MAX,
    poses,
    world: r.world,
  };
}

function serveStatic(req, res) {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/") url = "/index.html";
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }
  if (req.url === "/health") { json(res, 200, { ok: true, rooms: rooms.size }); return; }
  if (req.url && req.url.startsWith("/net") && req.method === "POST") {
    try {
      const msg = await readBody(req);
      json(res, 200, handleNet(msg));
    } catch {
      json(res, 400, { ok: false, err: "bad" });
    }
    return;
  }
  if (req.method === "GET") { serveStatic(req, res); return; }
  res.writeHead(405); res.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("palace net " + PORT + " cap " + MAX);
});
