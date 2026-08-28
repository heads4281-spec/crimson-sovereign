# Flying fire-spitting dragon

The dragon is now an airborne NPC bot.

## Behaviour

- Hover over the palace
- Climb to cruise height
- Circle the player
- Spit fire from mid range
- Swoop and bite when close
- Stun when hit, fall when dead

## Files

- `godot/DragonNPC.gd`
- `godot/Firebolt.gd` — put this at `res://scripts/Firebolt.gd`
- `unity/DragonNPC.cs`
- `unity/Firebolt.cs`

Copy Firebolt next to DragonNPC. The dragon loads `res://scripts/Firebolt.gd` when it spits.
