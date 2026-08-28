# Online palace (cap 100)

Not a WebRTC mesh. One HTTP relay, host simulates the dragon.

- **Begin solo** — local
- **Online (100)** — join room `palace` (or your code)
- First joiner is host. Guests see host dragon + up to 99 other bodies
- 101st join is rejected `{ err: "full" }`
- Remotes are one `InstancedMesh` (100 slots), not 100 GLBs

Run: `node playable/net-server.mjs` then open the game.
