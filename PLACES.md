# Places — where the files are

Scripts are already in this GitHub repo.
The 3D place models are large binary `.glb` files. They are **not** inside this repo yet because GitHub's connected upload only accepts text.

## Download from the Grok chat

In the Grok conversation, download these cards:

1. `places_glb_pack.zip`
2. `dragon_npc_pack.zip`
3. `game_integration_pack.zip` (optional, extra characters and weapons)

## Put them on THIS GitHub repo (you do this once)

1. Open https://github.com/heads4281-spec/crimson-sovereign
2. Click **Add file** → **Upload files**
3. Drop `places_glb_pack.zip` into the page
4. Commit to `main`

Then unzip locally:

```bash
git pull
unzip places_glb_pack.zip -d models/
```

## Files inside places_glb_pack.zip

| File | Place |
|---|---|
| crimson_world_places.glb | Full map: palace + cathedral + throne + obelisk field |
| dragon_palace.glb | Palace exterior |
| crimson_cathedral.glb | Cathedral outside |
| crimson_cathedral_interior.glb | Cathedral nave |
| spiked_throne_hall.glb | Throne room |
| obsidian_obelisk_field.glb | Obelisk field |

## After unzip, Godot path

`res://assets/crimson_sovereign/`

Instance `crimson_world_places.glb` under `Palace/PalaceAnchor`.
