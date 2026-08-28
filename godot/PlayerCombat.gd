class_name PlayerCombat
extends CharacterBody3D

signal died
signal damaged(amount: int, current: int)

@export var max_health: int = 100
@export var move_speed: float = 7.0
@export var attack_damage: int = 18
@export var attack_range: float = 3.2
@export var attack_cooldown: float = 0.45

var health: int
var _cooldown: float = 0.0

func _ready() -> void:
	health = max_health
	add_to_group("player")

func _physics_process(delta: float) -> void:
	_cooldown = maxf(0.0, _cooldown - delta)
	var input := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var dir := Vector3(input.x, 0.0, input.y)
	velocity.x = dir.x * move_speed
	velocity.z = dir.z * move_speed
	if not is_on_floor():
		velocity.y -= 18.0 * delta
	move_and_slide()
	if Input.is_action_just_pressed("ui_accept"):
		attack()

func attack() -> void:
	if _cooldown > 0.0:
		return
	_cooldown = attack_cooldown
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if enemy is Node3D and global_position.distance_to(enemy.global_position) <= attack_range:
			if enemy.has_method("apply_damage"):
				enemy.apply_damage(attack_damage, self)

func apply_damage(amount: int, _from: Node = null) -> void:
	health = maxi(0, health - amount)
	damaged.emit(amount, health)
	if health <= 0:
		died.emit()
		queue_free()
