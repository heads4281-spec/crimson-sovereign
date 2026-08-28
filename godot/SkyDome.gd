class_name SkyDome
extends Node3D

@export var model_path: NodePath = NodePath("Model")
@export var spin_degrees_per_second: float = 1.4
@export var scale_to_world: float = 1.0

@onready var model: Node3D = get_node_or_null(model_path)

func _ready() -> void:
	if model == null:
		model = get_node_or_null("Model")
	if scale_to_world != 1.0 and model:
		model.scale = Vector3.ONE * scale_to_world

func _process(delta: float) -> void:
	if model:
		model.rotate_y(deg_to_rad(spin_degrees_per_second) * delta)
