const MAX = 100;

export class PalaceNet {
  constructor() {
    this.id = null;
    this.host = null;
    this.n = 1;
    this.max = MAX;
    this.poses = [];
    this.world = null;
    this.online = false;
    this.room = "palace";
    this.timer = 0;
    this.pendingAtk = false;
    this.inFlight = false;
  }

  get isHost() {
    return this.online && this.id && this.id === this.host;
  }

  async join(room = "palace", name = "Sovereign") {
    this.room = room || "palace";
    const res = await this.post({ op: "join", room: this.room, name });
    if (!res.ok) throw new Error(res.err || "join failed");
    this.id = res.id;
    this.host = res.host;
    this.n = res.n;
    this.max = res.max || MAX;
    this.online = true;
    addEventListener("pagehide", () => this.leave());
    return res;
  }

  async post(body) {
    const r = await fetch("/net", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }

  async tick(dt, pose, world) {
    if (!this.online) return;
    this.timer += dt;
    if (this.timer < 0.1 || this.inFlight) return;
    this.timer = 0;
    this.inFlight = true;
    const msg = {
      op: "pose",
      room: this.room,
      id: this.id,
      x: pose.x, y: pose.y, z: pose.z, yaw: pose.yaw, hp: pose.hp,
      atk: this.pendingAtk ? 1 : 0,
    };
    this.pendingAtk = false;
    const pack = this.isHost && world
      ? { ...msg, op: "world", dragon: world.dragon, npcs: world.npcs, over: world.over, win: world.win }
      : msg;
    try {
      const res = await this.post(pack);
      if (!res.ok) return;
      this.host = res.host;
      this.n = res.n;
      this.poses = res.poses || [];
      if (res.world) this.world = res.world;
    } catch {
      /* keep last snapshot */
    } finally {
      this.inFlight = false;
    }
  }

  leave() {
    if (!this.online || !this.id) return;
    this.online = false;
    navigator.sendBeacon?.("/net", JSON.stringify({ op: "leave", room: this.room, id: this.id }));
  }
}
