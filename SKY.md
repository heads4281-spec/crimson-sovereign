# Cosmos sky + NPC director

## Sky GLB

Download `crimson_sky_pack.zip` from the Grok chat, then:

GitHub → Add file → Upload files → drop the zip.

Unzip to `models/crimson_cosmos_sky.glb`.

Godot: instance the GLB as child `Model` under a Node3D with `SkyDome.gd`.
Unity: drop the GLB in the scene and add `SkyDome.cs`.

The dome is 120 units across. Keep the camera inside it. It uses your nebula picture as the texture and spins slowly.

## NPC director

`godot/NpcDirector.gd` and `unity/NpcDirector.cs` find every enemy in the `enemy` group (the dragon) and watch when they die.

Put NpcDirector next to GameManager. Assign the player path.
