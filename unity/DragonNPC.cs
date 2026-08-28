using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class DragonNPC : MonoBehaviour
{
    public enum State { Idle, Patrol, Alert, Chase, Attack, Stun, Dead }
    public Transform model;
    public int maxHealth = 420;
    public float moveSpeed = 6.5f;
    public float flySpeed = 9f;
    public float turnSpeed = 2.4f;
    public float patrolRadius = 14f;
    public float detectRange = 22f;
    public float loseRange = 32f;
    public float attackRange = 4.8f;
    public int attackDamage = 28;
    public float attackCooldown = 1.6f;
    public float lungeForce = 10f;
    public float stunTime = 0.7f;
    public float flyHeight = 2.2f;
    public string playerTag = "Player";
    public State Current { get; private set; } = State.Idle;
    public int Health { get; private set; }
    CharacterController _cc;
    Vector3 _home;
    Vector3 _patrol;
    Transform _target;
    float _cooldown;
    float _stun;
    float _idle;
    bool _alive = true;
    void Awake()
    {
        _cc = GetComponent<CharacterController>();
        Health = maxHealth;
        _home = transform.position;
        if (model == null && transform.childCount > 0) model = transform.GetChild(0);
        PickPatrol();
    }
    void Update()
    {
        if (!_alive) return;
        float dt = Time.deltaTime;
        _cooldown = Mathf.Max(0f, _cooldown - dt);
        FindTarget();
        switch (Current)
        {
            case State.Idle: TickIdle(dt); break;
            case State.Patrol: TickPatrol(dt); break;
            case State.Alert: TickAlert(); break;
            case State.Chase: TickChase(dt); break;
            case State.Attack: TickAttack(); break;
            case State.Stun: TickStun(dt); break;
        }
        Bob();
    }
    public void ApplyDamage(int amount)
    {
        if (!_alive) return;
        Health = Mathf.Max(0, Health - amount);
        _stun = stunTime;
        Current = State.Stun;
        if (Health <= 0) Die();
    }
    void FindTarget()
    {
        var players = GameObject.FindGameObjectsWithTag(playerTag);
        Transform best = null;
        float bestD = detectRange;
        foreach (var p in players)
        {
            float d = Vector3.Distance(transform.position, p.transform.position);
            if (d < bestD) { bestD = d; best = p.transform; }
        }
        _target = best;
    }
    void TickIdle(float dt)
    {
        _idle -= dt;
        if (_target != null) Current = State.Alert;
        else if (_idle <= 0f) { PickPatrol(); Current = State.Patrol; }
    }
    void TickPatrol(float dt)
    {
        if (_target != null) { Current = State.Alert; return; }
        MoveToward(_patrol, moveSpeed, dt);
        Vector3 a = transform.position; a.y = 0f;
        Vector3 b = _patrol; b.y = 0f;
        if (Vector3.Distance(a, b) < 1.6f) { _idle = Random.Range(1.2f, 2.8f); Current = State.Idle; }
    }
    void TickAlert()
    {
        if (_target == null) { Current = State.Idle; return; }
        Face(_target.position);
        Current = State.Chase;
    }
    void TickChase(float dt)
    {
        if (_target == null) { Current = State.Idle; return; }
        float dist = Vector3.Distance(transform.position, _target.position);
        if (dist > loseRange) { _target = null; Current = State.Patrol; return; }
        if (dist <= attackRange && _cooldown <= 0f) { Current = State.Attack; return; }
        Vector3 aim = _target.position;
        aim.y = _home.y + flyHeight;
        MoveToward(aim, flySpeed, dt);
    }
    void TickAttack()
    {
        if (_target == null) { Current = State.Idle; return; }
        Face(_target.position);
        Vector3 dir = _target.position - transform.position; dir.y = 0f;
        if (dir.sqrMagnitude > 0.01f) _cc.Move(dir.normalized * lungeForce * Time.deltaTime);
        if (Vector3.Distance(transform.position, _target.position) <= attackRange + 1.2f)
        {
            var combat = _target.GetComponent<PlayerCombat>();
            if (combat != null) combat.ApplyDamage(attackDamage);
        }
        _cooldown = attackCooldown;
        Current = State.Chase;
    }
    void TickStun(float dt)
    {
        _stun -= dt;
        if (_stun <= 0f) Current = _target != null ? State.Chase : State.Idle;
    }
    void Die()
    {
        _alive = false;
        Current = State.Dead;
        if (_cc) _cc.enabled = false;
    }
    void MoveToward(Vector3 point, float speed, float dt)
    {
        Vector3 offset = point - transform.position; offset.y = 0f;
        if (offset.sqrMagnitude < 0.0025f) return;
        Vector3 step = offset.normalized * speed * dt;
        step.y = Mathf.Clamp(point.y - transform.position.y, -4f, 4f) * dt;
        _cc.Move(step);
        Face(transform.position + offset);
    }
    void Face(Vector3 world)
    {
        world.y = transform.position.y;
        Vector3 dir = world - transform.position;
        if (dir.sqrMagnitude < 0.01f) return;
        transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(dir), turnSpeed * Time.deltaTime);
    }
    void PickPatrol()
    {
        float ang = Random.Range(0f, Mathf.PI * 2f);
        float r = Random.Range(patrolRadius * 0.35f, patrolRadius);
        _patrol = _home + new Vector3(Mathf.Cos(ang) * r, 0f, Mathf.Sin(ang) * r);
    }
    void Bob()
    {
        if (model == null || !_alive) return;
        Vector3 p = model.localPosition;
        p.y = Mathf.Sin(Time.time * 2.4f) * (Current == State.Chase ? 0.08f : 0.04f);
        model.localPosition = p;
    }
}
