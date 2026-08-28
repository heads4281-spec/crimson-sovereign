class_name PlayerCombat
extends CharacterBody3D

signal died
signal damaged(amount: int, current: int)
signal attacked

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
	if dir.length() > 0.1:
		var look := global_position + dir
		look.y = global_position.y
		look_at(look, Vector3.UP)
	if not is_on_floor():
		velocity.y -= 18.0 * delta
	else:
		velocity.y = 0.0
	move_and_slide()
	if Input.is_action_just_pressed("ui_accept"):
		attack()

func attack() -> void:
	if _cooldown > 0.0:
		return
	_cooldown = attack_cooldown
	var dmg := _weapon_damage()
	attacked.emit()
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if enemy is Node3D and global_position.distance_to(enemy.global_position) <= attack_range:
			if enemy.has_method("apply_damage"):
				enemy.apply_damage(dmg, self)

func apply_damage(amount: int, _from: Node = null) -> void:
	if health <= 0:
		return
	health = maxi(0, health - amount)
	damaged.emit(amount, health)
	if health <= 0:
		died.emit()
		collision_layer = 0
		set_physics_process(false)

func _weapon_damage() -> int:
	var hold := get_node_or_null("WeaponHold")
	if hold and "damage" in hold:
		return int(hold.damage)
	return attack_damage
