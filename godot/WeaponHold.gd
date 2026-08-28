class_name WeaponHold
extends Node3D

@export var catalog_path: NodePath
@export var default_weapon_id: String = "sword"
@export var fallback_damage: int = 18

var weapon_id: String = ""
var damage: int = 18
var _model: Node3D

func _ready() -> void:
	equip(default_weapon_id)

func equip(id: String) -> void:
	weapon_id = id
	damage = fallback_damage
	var catalog := get_node_or_null(catalog_path)
	if catalog and catalog.has_method("find"):
		var entry: Dictionary = catalog.find("weapons", id)
		if not entry.is_empty() and entry.get("enabled", true):
			damage = int(entry.get("damage", fallback_damage))
			if catalog.has_method("instantiate") and entry.has("file"):
				if _model:
					_model.queue_free()
				_model = catalog.instantiate(entry["file"])
				if _model:
					add_child(_model)
					_model.scale = Vector3.ONE * 0.35
					_model.position = Vector3(0.25, 0.1, 0.2)
