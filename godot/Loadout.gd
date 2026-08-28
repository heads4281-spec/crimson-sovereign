class_name Loadout
extends Node

signal character_changed(id: String)
signal weapon_changed(id: String)
signal level_changed(id: String)

@export var catalog_path: NodePath
@export var character_anchor: NodePath
@export var weapon_anchor: NodePath
@export var level_anchor: NodePath

var selected_character_id: String = ""
var selected_weapon_id: String = ""
var selected_level_id: String = ""
var _character_node: Node3D
var _weapon_node: Node3D
var _level_node: Node3D

func catalog() -> AssetCatalog:
	if catalog_path != NodePath():
		return get_node(catalog_path) as AssetCatalog
	return get_node_or_null("AssetCatalog") as AssetCatalog

func available_characters() -> Array:
	return catalog().enabled_list("characters")

func available_weapons() -> Array:
	return catalog().enabled_list("weapons")

func available_levels() -> Array:
	return catalog().enabled_list("levels")

func equip_character(id: String) -> bool:
	var entry: Dictionary = catalog().find("characters", id)
	if entry.is_empty() or not entry.get("enabled", false):
		return false
	_replace(character_anchor, _character_node)
	_character_node = catalog().instantiate(entry["file"])
	if _character_node == null:
		return false
	_character_node.scale = Vector3.ONE * float(entry.get("scale", 1.0))
	_attach(character_anchor, _character_node)
	selected_character_id = id
	character_changed.emit(id)
	return true

func equip_weapon(id: String) -> bool:
	var entry: Dictionary = catalog().find("weapons", id)
	if entry.is_empty() or not entry.get("enabled", false):
		return false
	_replace(weapon_anchor, _weapon_node)
	_weapon_node = catalog().instantiate(entry["file"])
	if _weapon_node == null:
		return false
	_attach(weapon_anchor, _weapon_node)
	selected_weapon_id = id
	weapon_changed.emit(id)
	return true

func load_level(id: String) -> bool:
	var entry: Dictionary = catalog().find("levels", id)
	if entry.is_empty() or not entry.get("enabled", false):
		return false
	_replace(level_anchor, _level_node)
	_level_node = catalog().instantiate(entry["file"])
	if _level_node == null:
		return false
	_attach(level_anchor, _level_node)
	selected_level_id = id
	level_changed.emit(id)
	return true

func _attach(anchor: NodePath, node: Node3D) -> void:
	var parent: Node = self if anchor == NodePath() else get_node(anchor)
	parent.add_child(node)

func _replace(_anchor: NodePath, old: Node3D) -> void:
	if old != null and is_instance_valid(old):
		old.queue_free()
