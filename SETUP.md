# Crimson Sovereign

Game scripts for the cathedral dragon NPC and optional asset loadout.

Repo: https://github.com/heads4281-spec/crimson-sovereign

## Clone into your build

```bash
git clone https://github.com/heads4281-spec/crimson-sovereign.git
```

Then copy:
- `godot/` scripts into a Godot 4 project
- `unity/` scripts into a Unity project
- `assets_catalog.json` next to your models

Download the `.glb` models from the chat file cards (`dragon_npc_pack.zip` and `game_integration_pack.zip`) and put them in `assets/`.

## Dragon fight

See `DRAGON_NPC.md`.

Godot: attach `godot/DragonNPC.gd` to a CharacterBody3D, child the dragon GLB under `Model`.
Unity: add `unity/DragonNPC.cs` plus a CharacterController.
