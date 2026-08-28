class_name GameManager
extends Node

signal game_started
signal game_won
signal game_lost
signal message(text: String)

@export var player_path: NodePath
@export var dragon_path: NodePath
@export var palace_path: NodePath
@export var restart_on_end: bool = false

var running: bool = false

func _ready() -> void:
	start_game()

func start_game() -> void:
	running = true
	game_started.emit()
	message.emit("Enter the palace. Reach the throne.")
	var player := get_node_or_null(player_path)
	var dragon := get_node_or_null(dragon_path)
	var palace := get_node_or_null(palace_path)
	if player and player.has_signal("died"):
		if not player.died.is_connected(_on_player_died):
			player.died.connect(_on_player_died)
	if dragon and dragon.has_signal("died"):
		if not dragon.died.is_connected(_on_dragon_died):
			dragon.died.connect(_on_dragon_died)
	if palace:
		if palace.has_signal("player_entered_gate") and not palace.player_entered_gate.is_connected(_on_gate):
			palace.player_entered_gate.connect(_on_gate)
		if palace.has_signal("player_reached_throne") and not palace.player_reached_throne.is_connected(_on_throne):
			palace.player_reached_throne.connect(_on_throne)
		if palace.has_signal("dragon_awakened") and not palace.dragon_awakened.is_connected(_on_wake):
			palace.dragon_awakened.connect(_on_wake)

func _on_gate() -> void:
	message.emit("The gate accepts you.")

func _on_throne() -> void:
	message.emit("The throne answers. The dragon wakes.")

func _on_wake() -> void:
	message.emit("Defeat the dragon.")

func _on_player_died() -> void:
	if not running:
		return
	running = false
	game_lost.emit()
	message.emit("You fell in the palace.")
	if restart_on_end:
		get_tree().reload_current_scene()

func _on_dragon_died() -> void:
	if not running:
		return
	running = false
	game_won.emit()
	message.emit("The palace is yours.")
