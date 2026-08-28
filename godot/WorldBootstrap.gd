class_name WorldBootstrap
extends Node

@export var sky_anchor: NodePath
@export var place_anchor: NodePath
@export var dragon_model_anchor: NodePath
@export var asset_root: String = "res://assets/crimson_sovereign/"

const SKY_FILE := "crimson_cosmos_sky.glb"
const PLACE_FILES := ["crimson_world_places.glb", "dragon_palace.glb", "crimson_cathedral_interior.glb"]

func _ready() -> void:
	_try_load(SKY_FILE, sky_anchor, 1.0)
	var loaded_place := false
	for file_name in PLACE_FILES:
		if _try_load(file_name, place_anchor, 1.0):
			loaded_place = true
			break
	if not loaded_place:
		push_warning("No place GLB found under %s" % asset_root)
	_try_load("crimson_dragon.glb", dragon_model_anchor, 1.0)
	if not ResourceLoader.exists(asset_root + "crimson_dragon.glb"):
		_try_load("crimson_dragon_textured.glb", dragon_model_anchor, 1.0)

func _try_load(file_name: String, anchor: NodePath, scale: float) -> bool:
	var path := asset_root + file_name
	if not ResourceLoader.exists(path):
		return false
	var packed = load(path)
	if packed == null:
		return false
	var node: Node = packed.instantiate()
	var parent: Node = self if anchor == NodePath() else get_node_or_null(anchor)
	if parent == null:
		parent = self
	parent.add_child(node)
	if node is Node3D:
		(node as Node3D).scale = Vector3.ONE * scale
	print("Loaded ", path)
	return true
