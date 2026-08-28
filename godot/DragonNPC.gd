class_name DragonNPC
extends CharacterBody3D

enum State { IDLE, PATROL, ALERT, CHASE, ATTACK, STUN, DEAD }

signal roared
signal attacked(target: Node)
signal died
signal damaged(amount: int, current: int)

@export var catalog_id: String = "crimson_dragon"
@export var model_path: NodePath = NodePath("Model")
@export var max_health: int = 420
@export var move_speed: float = 6.5
@export var fly_speed: float = 9.0
@export var turn_speed: float = 2.4
@export var patrol_radius: float = 14.0
@export var detect_range: float = 22.0
@export var lose_range: float = 32.0
@export var attack_range: float = 4.8
@export var attack_damage: int = 28
@export var attack_cooldown: float = 1.6
@export var lunge_force: float = 10.0
@export var stun_time: float = 0.7
@export var fly_height: float = 2.2
@export var gravity: float = 18.0
@export var player_group: String = "player"

var state: State = State.IDLE
var health: int
var _home: Vector3
var _patrol_point: Vector3
var _target: Node3D
var _cooldown: float = 0.0
var _stun_left: float = 0.0
var _idle_timer: float = 0.0
var _alive: bool = true

@onready var model: Node3D = get_node_or_null(model_path)

func _ready() -> void:
	health = max_health
	_home = global_position
	add_to_group("enemy")
	add_to_group("dragon")
	_pick_patrol()
	if model == null:
		model = get_node_or_null("Model")

func _physics_process(delta: float) -> void:
	if not _alive:
		velocity = velocity.lerp(Vector3.ZERO, 4.0 * delta)
		move_and_slide()
		return
	_cooldown = maxf(0.0, _cooldown - delta)
	_find_target()
	match state:
		State.IDLE: _tick_idle(delta)
		State.PATROL: _tick_patrol(delta)
		State.ALERT: _tick_alert(delta)
		State.CHASE: _tick_chase(delta)
		State.ATTACK: _tick_attack(delta)
		State.STUN: _tick_stun(delta)
		State.DEAD: pass
	if not is_on_floor() and state != State.CHASE:
		velocity.y -= gravity * delta
	move_and_slide()
	_face_motion(delta)
	_bob_model(delta)

func apply_damage(amount: int, _from: Node = null) -> void:
	if not _alive:
		return
	health = maxi(0, health - amount)
	damaged.emit(amount, health)
	_stun_left = stun_time
	state = State.STUN
	if health <= 0:
		_die()

func roar() -> void:
	roared.emit()
	_pulse_model(1.12)

func _find_target() -> void:
	var players := get_tree().get_nodes_in_group(player_group)
	var best: Node3D = null
	var best_d := detect_range
	for node in players:
		if node is Node3D:
			var d := global_position.distance_to((node as Node3D).global_position)
			if d < best_d:
				best_d = d
				best = node
	_target = best

func _tick_idle(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 8.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 8.0 * delta)
	_idle_timer -= delta
	if _target:
		state = State.ALERT
		roar()
	elif _idle_timer <= 0.0:
		_pick_patrol()
		state = State.PATROL

func _tick_patrol(delta: float) -> void:
	if _target:
		state = State.ALERT
		roar()
		return
	_move_toward(_patrol_point, move_speed, delta)
	if global_position.distance_to(_patrol_point) < 1.6:
		_idle_timer = randf_range(1.2, 2.8)
		state = State.IDLE

func _tick_alert(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 6.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 6.0 * delta)
	if _target == null:
		state = State.IDLE
		return
	_look_at_target(delta)
	state = State.CHASE

func _tick_chase(delta: float) -> void:
	if _target == null:
		state = State.IDLE
		return
	var dist := global_position.distance_to(_target.global_position)
	if dist > lose_range:
		_target = null
		state = State.PATROL
		return
	if dist <= attack_range and _cooldown <= 0.0:
		state = State.ATTACK
		return
	var aim := _target.global_position
	aim.y = _home.y + fly_height
	_move_toward(aim, fly_speed, delta)

func _tick_attack(_delta: float) -> void:
	if _target == null:
		state = State.IDLE
		return
	_look_at_target(_delta)
	var dir := (_target.global_position - global_position)
	dir.y = 0.0
	if dir.length() > 0.01:
		dir = dir.normalized()
		velocity.x = dir.x * lunge_force
		velocity.z = dir.z * lunge_force
	_hit_target()
	_cooldown = attack_cooldown
	_pulse_model(1.18)
	state = State.CHASE

func _tick_stun(delta: float) -> void:
	_stun_left -= delta
	velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)
	if _stun_left <= 0.0:
		state = State.CHASE if _target else State.IDLE

func _hit_target() -> void:
	if _target == null:
		return
	if global_position.distance_to(_target.global_position) > attack_range + 1.2:
		return
	if _target.has_method("apply_damage"):
		_target.apply_damage(attack_damage, self)
	elif _target.has_method("take_damage"):
		_target.take_damage(attack_damage)
	attacked.emit(_target)

func _die() -> void:
	_alive = false
	state = State.DEAD
	collision_layer = 0
	collision_mask = 0
	died.emit()
	if model:
		var tw := create_tween()
		tw.tween_property(model, "rotation_degrees:z", 80.0, 0.8)
		tw.parallel().tween_property(model, "position:y", model.position.y - 0.6, 0.8)

func _move_toward(point: Vector3, speed: float, _delta: float) -> void:
	var offset := point - global_position
	offset.y = 0.0
	if offset.length() < 0.05:
		return
	var dir := offset.normalized()
	velocity.x = dir.x * speed
	velocity.z = dir.z * speed
	velocity.y = clampf(point.y - global_position.y, -4.0, 4.0)

func _look_at_target(delta: float) -> void:
	if _target == null:
		return
	var look := _target.global_position
	look.y = global_position.y
	var xform := global_transform.looking_at(look, Vector3.UP)
	global_transform.basis = global_transform.basis.slerp(xform.basis, turn_speed * delta)

func _face_motion(delta: float) -> void:
	var flat := Vector3(velocity.x, 0.0, velocity.z)
	if flat.length() < 0.4:
		return
	var look := global_position + flat
	var xform := global_transform.looking_at(look, Vector3.UP)
	global_transform.basis = global_transform.basis.slerp(xform.basis, turn_speed * delta)

func _pick_patrol() -> void:
	var angle := randf() * TAU
	var radius := randf_range(patrol_radius * 0.35, patrol_radius)
	_patrol_point = _home + Vector3(cos(angle) * radius, 0.0, sin(angle) * radius)

func _bob_model(delta: float) -> void:
	if model == null or not _alive:
		return
	var t := Time.get_ticks_msec() * 0.001
	var amp := 0.08 if state == State.CHASE else 0.04
	model.position.y = sin(t * 2.4) * amp
	var bank := clampf(-velocity.x * 0.04, -0.25, 0.25)
	model.rotation.z = lerp_angle(model.rotation.z, bank, 4.0 * delta)

func _pulse_model(scale_to: float) -> void:
	if model == null:
		return
	var tw := create_tween()
	tw.tween_property(model, "scale", Vector3.ONE * scale_to, 0.08)
	tw.tween_property(model, "scale", Vector3.ONE, 0.18)
