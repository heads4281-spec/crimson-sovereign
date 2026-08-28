class_name PalaceLevel
extends Node3D

signal palace_ready
signal player_entered_gate
signal player_reached_throne
signal dragon_awakened

@export var palace_scene: PackedScene
@export var player_path: NodePath
@export var dragon_path: NodePath
@export var gate_spawn: Vector3 = Vector3(0, 1.2, 8)
@export var throne_point: Vector3 = Vector3(0, 6.2, -4)
@export var roof_point: Vector3 = Vector3(0, 10.2, 0)
@export var throne_radius: float = 3.5
@export var gate_radius: float = 4.0
@export var put_dragon_on_roof: bool = true

var _gate_fired: bool = false
var _throne_fired: bool = false
var _palace: Node3D

func _ready() -> void:
	if palace_scene:
		_palace = palace_scene.instantiate()
		add_child(_palace)
	_place_actors()
	palace_ready.emit()

func _process(_delta: float) -> void:
	var player := get_node_or_null(player_path) as Node3D
	if player == null:
		return
	if not _gate_fired and player.global_position.distance_to(gate_spawn) < gate_radius:
		_gate_fired = true
		player_entered_gate.emit()
	if not _throne_fired and player.global_position.distance_to(throne_point) < throne_radius:
		_throne_fired = true
		player_reached_throne.emit()
		_wake_dragon()

func _place_actors() -> void:
	var player := get_node_or_null(player_path) as Node3D
	if player:
		player.global_position = gate_spawn
	var dragon := get_node_or_null(dragon_path) as Node3D
	if dragon and put_dragon_on_roof:
		dragon.global_position = roof_point

func _wake_dragon() -> void:
	var dragon := get_node_or_null(dragon_path)
	if dragon and dragon.has_method("roar"):
		dragon.roar()
	dragon_awakened.emit()
