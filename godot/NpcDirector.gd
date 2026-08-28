class_name NpcDirector
extends Node

signal npc_registered(npc: Node)
signal npc_died(npc: Node)

@export var player_path: NodePath
@export var auto_find_group: String = "enemy"

var _npcs: Array[Node] = []

func _ready() -> void:
	call_deferred("refresh")

func refresh() -> void:
	_npcs.clear()
	for node in get_tree().get_nodes_in_group(auto_find_group):
		register_npc(node)

func register_npc(npc: Node) -> void:
	if npc == null or _npcs.has(npc):
		return
	_npcs.append(npc)
	if npc.has_signal("died") and not npc.died.is_connected(_on_npc_died):
		npc.died.connect(_on_npc_died.bind(npc))
	npc_registered.emit(npc)

func get_player() -> Node:
	if player_path != NodePath():
		return get_node_or_null(player_path)
	var players := get_tree().get_nodes_in_group("player")
	return players[0] if players.size() > 0 else null

func living_npcs() -> Array[Node]:
	var out: Array[Node] = []
	for npc in _npcs:
		if npc and is_instance_valid(npc):
			if "health" in npc and npc.health <= 0:
				continue
			out.append(npc)
	return out

func _on_npc_died(npc: Node) -> void:
	npc_died.emit(npc)
