class_name AssetCatalog
extends Node

const CATALOG_PATH := "res://assets/crimson_sovereign/assets_catalog.json"
const MODEL_DIR := "res://assets/crimson_sovereign/"

var _data: Dictionary = {}

func _ready() -> void:
	reload()

func reload() -> void:
	if not FileAccess.file_exists(CATALOG_PATH):
		push_error("Asset catalog missing: %s" % CATALOG_PATH)
		_data = {}
		return
	var file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		_data = {}
		return
	_data = parsed

func enabled_list(category: String) -> Array:
	var out: Array = []
	if not _data.has(category):
		return out
	for entry in _data[category]:
		if entry.get("enabled", false):
			out.append(entry)
	return out

func find(category: String, id: String) -> Dictionary:
	if not _data.has(category):
		return {}
	for entry in _data[category]:
		if entry.get("id", "") == id:
			return entry
	return {}

func instantiate(file_name: String) -> Node3D:
	var path := MODEL_DIR + file_name
	if not ResourceLoader.exists(path):
		return null
	var packed: PackedScene = load(path)
	if packed == null:
		return null
	return packed.instantiate()
