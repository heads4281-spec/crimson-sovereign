# Online palace (cap 100)

Works in **any modern browser**: Chrome, Firefox, Safari, Edge, and mobile Chrome/Safari.

Not a WebRTC mesh. One HTTP relay. First joiner is **host** (runs the dragon).

- **Begin solo** — no server
- **Online (100)** — same room code = same palace
- 101st join is `{ err: "full" }`
- Other players draw as one `InstancedMesh` (100 slots)

## This preview

The Node relay is already running with the game. Open the preview in Chrome or any other browser, click **Online (100)**.

## Host on Google (Cloud Run)

Anyone with the public URL can play from any browser.

```bash
cd crimson-sovereign
gcloud run deploy palace --source . --allow-unauthenticated --port 8080
```

Cloud Run sets `PORT`; `net-server.mjs` already reads it.

Then share the `*.run.app` link. Solo still works if `/net` is down.

GitHub Pages can serve **solo only** (no Node). Online needs this relay.
