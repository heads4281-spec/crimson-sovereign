class_name Firebolt
extends Area3D

@export var speed: float = 22.0
@export var lifetime: float = 3.2
@export var damage: int = 16
@export var radius: float = 0.28

var direction: Vector3 = Vector3.FORWARD

func _ready() -> void:
	monitoring = true
	monitorable = false
	body_entered.connect(_on_body)
	if get_node_or_null("CollisionShape3D") == null:
		var shape := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = radius
		shape.shape = sphere
		add_child(shape)
	if get_node_or_null("Mesh") == null:
		var mesh := MeshInstance3D.new()
		mesh.name = "Mesh"
		var sphere_mesh := SphereMesh.new()
		sphere_mesh.radius = radius
		sphere_mesh.height = radius * 2.0
		mesh.mesh = sphere_mesh
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(1.0, 0.22, 0.05)
		mat.emission_enabled = true
		mat.emission = Color(1.0, 0.35, 0.05)
		mat.emission_energy_multiplier = 4.0
		mesh.material_override = mat
		add_child(mesh)
	get_tree().create_timer(lifetime).timeout.connect(queue_free)

func _physics_process(delta: float) -> void:
	global_position += direction * speed * delta

func _on_body(body: Node) -> void:
	if body.is_in_group("dragon"):
		return
	if body.has_method("apply_damage"):
		body.apply_damage(damage, self)
	queue_free()
