# Full working game loop

Walk the palace, wake the dragon, fight, win or lose.

1. HUD shows health.
2. Player starts at the gate.
3. Dragon waits on the roof.
4. Reach the throne — dragon hunts you.
5. Enter / Space attacks.
6. Dragon HP 0 — win. Player HP 0 — lose.

Godot: copy `godot/` to `res://scripts/` and set `godot/Main.tscn` as the main scene.
Instance `dragon_palace.glb` under Palace/PalaceAnchor and the dragon GLB under Palace/Dragon/Model.
