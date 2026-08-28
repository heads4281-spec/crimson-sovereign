class_name DragonNPC
extends CharacterBody3D
## Flying dragon bot: hover, circle, swoop, bite, spit fire.

enum State { IDLE, PATROL, LIFT, CIRCLE, SWOOP, SPIT, BITE, STUN, DEAD }

signal roared
signal attacked(target: Node)
signal spit_fire(bolt: Node)
signal died
signal damaged(amount: int, current: int)

@export var model_path: NodePath = NodePath("Model")
@export var max_health: int = 420
@export var cruise_height: float = 7.5
@export var circle_radius: float = 11.0
@export var fly_speed: float = 10.0
@export var swoop_speed: float = 16.0
@export var turn_speed: float = 2.2
@export var detect_range: float = 28.0
@export var lose_range: float = 40.0
@export var spit_range: float = 18.0
@export var spit_min_range: float = 6.0
@export var bite_range: float = 4.6
@export var spit_damage: int = 16
@export var bite_damage: int = 28
@export var spit_cooldown: float = 2.1
@export var bite_cooldown: float = 1.4
@export var stun_time: float = 0.55
@export var player_group: String = "player"

var state: State = State.IDLE
var health: int
var _home: Vector3
var _target: Node3D
var _spit_cd: float = 0.0
var _bite_cd: float = 0.0
var _stun_left: float = 0.0
var _circle_angle: float = 0.0
var _alive: bool = true

@onready var model: Node3D = get_node_or_null(model_path)

func _ready() -> void:
	health = max_health
	_home = global_position
	motion_mode = MOTION_MODE_FLOATING
	add_to_group("enemy")
	add_to_group("dragon")
	if model == null:
		model = get_node_or_null("Model")

func _physics_process(delta: float) -> void:
	if not _alive:
		velocity = velocity.lerp(Vector3(0.0, -2.0, 0.0), 2.0 * delta)
		move_and_slide()
		return
	_spit_cd = maxf(0.0, _spit_cd - delta)
	_bite_cd = maxf(0.0, _bite_cd - delta)
	_find_target()
	match state:
		State.IDLE:
			_hold_air(delta)
			if _target:
				roar()
				state = State.LIFT
		State.LIFT:
			_fly_to(_hover_point(), fly_speed, delta)
			if absf(global_position.y - (_home.y + cruise_height)) < 0.8:
				state = State.CIRCLE
		State.CIRCLE:
			_tick_circle(delta)
		State.SWOOP:
			_tick_swoop(delta)
		State.SPIT:
			_tick_spit(delta)
		State.BITE:
			_tick_bite()
		State.STUN:
			_stun_left -= delta
			velocity = velocity.lerp(Vector3.ZERO, 4.0 * delta)
			if _stun_left <= 0.0:
				state = State.CIRCLE if _target else State.IDLE
		State.DEAD:
			pass
	move_and_slide()
	_face_flight(delta)
	_animate_wings(delta)

func apply_damage(amount: int, _from: Node = null) -> void:
	if not _alive or amount <= 0:
		return
	health = maxi(0, health - amount)
	damaged.emit(amount, health)
	_stun_left = stun_time
	state = State.STUN
	if health <= 0:
		_die()

func roar() -> void:
	roared.emit()
	_pulse(1.08)

func _find_target() -> void:
	var best: Node3D = null
	var best_d := detect_range
	for node in get_tree().get_nodes_in_group(player_group):
		if node is Node3D:
			var d := global_position.distance_to(node.global_position)
			if d < best_d:
				best_d = d
				best = node
	if best == null and _target and is_instance_valid(_target):
		if global_position.distance_to(_target.global_position) > lose_range:
			_target = null
			return
	_target = best

func _hover_point() -> Vector3:
	return Vector3(_home.x, _home.y + cruise_height, _home.z)

func _hold_air(delta: float) -> void:
	_fly_to(Vector3(global_position.x, _home.y + cruise_height * 0.45, global_position.z), fly_speed * 0.45, delta)

func _tick_circle(delta: float) -> void:
	if _target == null:
		state = State.IDLE
		return
	_circle_angle += delta * 0.85
	var orbit := _target.global_position
	var point := orbit + Vector3(cos(_circle_angle) * circle_radius, cruise_height, sin(_circle_angle) * circle_radius)
	_fly_to(point, fly_speed, delta)
	var dist := global_position.distance_to(_target.global_position)
	if dist <= bite_range and _bite_cd <= 0.0:
		state = State.BITE
	elif dist <= spit_range and dist >= spit_min_range and _spit_cd <= 0.0:
		state = State.SPIT
	elif dist < spit_min_range:
		state = State.SWOOP

func _tick_swoop(delta: float) -> void:
	if _target == null:
		state = State.LIFT
		return
	_fly_to(_target.global_position + Vector3(0, 1.2, 0), swoop_speed, delta)
	if global_position.distance_to(_target.global_position) <= bite_range:
		state = State.BITE
	elif global_position.y < _target.global_position.y + 1.4:
		state = State.LIFT

func _tick_spit(delta: float) -> void:
	if _target == null:
		state = State.IDLE
		return
	velocity = velocity.lerp(Vector3.ZERO, 6.0 * delta)
	_look_at_target(delta)
	_spawn_firebolt()
	_spit_cd = spit_cooldown
	state = State.CIRCLE

func _tick_bite() -> void:
	if _target and global_position.distance_to(_target.global_position) <= bite_range + 1.0:
		if _target.has_method("apply_damage"):
			_target.apply_damage(bite_damage, self)
		attacked.emit(_target)
		_pulse(1.16)
	_bite_cd = bite_cooldown
	state = State.LIFT

func _spawn_firebolt() -> void:
	if _target == null:
		return
	var bolt := Area3D.new()
	var script := load("res://scripts/Firebolt.gd")
	if script:
		bolt.set_script(script)
	var origin := global_position + (-global_transform.basis.z) * 1.8 + Vector3(0, 0.4, 0)
	get_parent().add_child(bolt)
	bolt.global_position = origin
	var aim := _target.global_position + Vector3(0, 1.0, 0)
	if "direction" in bolt:
		bolt.direction = (aim - origin).normalized()
	if "damage" in bolt:
		bolt.damage = spit_damage
	spit_fire.emit(bolt)
	roared.emit()

func _fly_to(point: Vector3, speed: float, delta: float) -> void:
	var offset := point - global_position
	if offset.length() < 0.15:
		velocity = velocity.lerp(Vector3.ZERO, 4.0 * delta)
		return
	velocity = velocity.lerp(offset.normalized() * speed, clampf(4.0 * delta, 0.0, 1.0))

func _look_at_target(delta: float) -> void:
	if _target == null:
		return
	var look := _target.global_position
	look.y = global_position.y
	if look.distance_to(global_position) < 0.05:
		return
	var xform := global_transform.looking_at(look, Vector3.UP)
	global_transform.basis = global_transform.basis.slerp(xform.basis, turn_speed * delta)

func _face_flight(delta: float) -> void:
	var flat := Vector3(velocity.x, 0.0, velocity.z)
	if flat.length() < 0.4:
		if _target:
			_look_at_target(delta)
		return
	var look := global_position + flat
	var xform := global_transform.looking_at(look, Vector3.UP)
	global_transform.basis = global_transform.basis.slerp(xform.basis, turn_speed * delta)

func _animate_wings(delta: float) -> void:
	if model == null or not _alive:
		return
	var t := Time.get_ticks_msec() * 0.001
	var flap := 1.0 if state in [State.LIFT, State.CIRCLE, State.SWOOP] else 0.45
	model.position.y = sin(t * 8.0 * flap) * 0.12
	var bank := clampf(-velocity.x * 0.035, -0.35, 0.35)
	var pitch := clampf(-velocity.y * 0.04, -0.25, 0.25)
	model.rotation.z = lerp_angle(model.rotation.z, bank, 5.0 * delta)
	model.rotation.x = lerp_angle(model.rotation.x, pitch, 4.0 * delta)

func _pulse(scale_to: float) -> void:
	if model == null:
		return
	var tw := create_tween()
	tw.tween_property(model, "scale", Vector3.ONE * scale_to, 0.07)
	tw.tween_property(model, "scale", Vector3.ONE, 0.16)

func _die() -> void:
	_alive = false
	state = State.DEAD
	collision_layer = 0
	collision_mask = 0
	died.emit()
	if model:
		var tw := create_tween()
		tw.tween_property(model, "rotation_degrees:z", 95.0, 1.1)
