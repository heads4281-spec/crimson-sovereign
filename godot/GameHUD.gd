class_name GameHUD
extends CanvasLayer

@export var player_path: NodePath
@export var dragon_path: NodePath
@export var manager_path: NodePath

@onready var player_label: Label = $Root/PlayerHP
@onready var dragon_label: Label = $Root/DragonHP
@onready var status_label: Label = $Root/Status

func _ready() -> void:
	var manager := get_node_or_null(manager_path)
	if manager and manager.has_signal("message"):
		manager.message.connect(_set_status)
	var player := get_node_or_null(player_path)
	if player and player.has_signal("damaged"):
		player.damaged.connect(_on_player_hp)
	var dragon := get_node_or_null(dragon_path)
	if dragon and dragon.has_signal("damaged"):
		dragon.damaged.connect(_on_dragon_hp)
	_refresh()

func _refresh() -> void:
	var player := get_node_or_null(player_path)
	var dragon := get_node_or_null(dragon_path)
	if player and "health" in player and "max_health" in player:
		player_label.text = "Player  %d / %d" % [player.health, player.max_health]
	if dragon and "health" in dragon and "max_health" in dragon:
		dragon_label.text = "Dragon  %d / %d" % [dragon.health, dragon.max_health]

func _on_player_hp(_amount: int, current: int) -> void:
	var player := get_node_or_null(player_path)
	var max_hp := 100
	if player and "max_health" in player:
		max_hp = player.max_health
	player_label.text = "Player  %d / %d" % [current, max_hp]

func _on_dragon_hp(_amount: int, current: int) -> void:
	var dragon := get_node_or_null(dragon_path)
	var max_hp := 420
	if dragon and "max_health" in dragon:
		max_hp = dragon.max_health
	dragon_label.text = "Dragon  %d / %d" % [current, max_hp]

func _set_status(text: String) -> void:
	status_label.text = text
