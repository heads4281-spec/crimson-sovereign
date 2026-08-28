# Palace level

The palace is the map. The player starts at the glowing gate. Reaching the throne wakes the dragon on the roof.

## Files

- `godot/PalaceLevel.gd`
- `godot/PalaceArena.tscn`
- `unity/PalaceLevel.cs`

## Models to drop in

Use these GLBs from the chat zips:

- `dragon_palace.glb` — castle with dragon perch
- `spiked_throne_hall.glb` — interior throne room
- `crimson_dragon_textured.glb` — roof boss

Put them under `res://assets/crimson_sovereign/` (Godot) or `Assets/CrimsonSovereign/` (Unity).

## Godot

1. Copy `PalaceLevel.gd` to `res://scripts/`.
2. Open `PalaceArena.tscn`.
3. Instance `dragon_palace.glb` under `PalaceAnchor`.
4. Instance the dragon GLB under `Dragon/Model`.
5. Play. Walk from the gate toward the keep. The dragon starts on the roof.

## Unity

1. Add `PalaceLevel.cs` to an empty object.
2. Assign the palace prefab, player, and dragon.
3. Play.

## Points you can edit

- `gate_spawn` — player start
- `throne_point` — trigger that wakes the dragon
- `roof_point` — dragon perch
