# Crimson Sovereign

Working Godot/Unity kit: palace places, flying fire dragon NPC, cosmos sky, HUD, win/lose.

Repo: https://github.com/heads4281-spec/crimson-sovereign

## Already in this repo (code)

Godot scripts in `godot/`:
- WorldBootstrap.gd — loads sky + places + dragon model if GLBs exist
- Main.tscn — full scene
- DragonNPC.gd + Firebolt.gd — flying fire AI
- PalaceLevel.gd — gate / throne / roof
- PlayerCombat.gd + WeaponHold.gd
- GameManager.gd + GameHUD.gd
- NpcDirector.gd + SkyDome.gd + AssetCatalog.gd + Loadout.gd

Unity scripts in `unity/`.

## Not in this repo until you upload (3D files)

Download from the Grok chat, then GitHub → Add file → Upload files:

- places_glb_pack.zip
- crimson_sky_pack.zip
- dragon_npc_pack.zip

Unzip into `models/` and copy into Godot `res://assets/crimson_sovereign/`.

## Run (Godot 4)

1. Copy every file from `godot/` to `res://scripts/`.
2. Copy `godot/Main.tscn` to `res://scenes/Main.tscn`.
3. Put GLBs in `res://assets/crimson_sovereign/`.
4. Set Main.tscn as the main scene. Press Play.

Arrow keys move. Enter attacks. Dragon flies, circles, spit fires. Reach the throne to wake it. HUD shows HP.
