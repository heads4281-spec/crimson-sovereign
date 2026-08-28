using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class DragonNPC : MonoBehaviour
{
    public enum State { Idle, Lift, Circle, Swoop, Spit, Bite, Stun, Dead }
    public Transform model;
    public GameObject fireboltPrefab;
    public int maxHealth = 420;
    public float cruiseHeight = 7.5f;
    public float circleRadius = 11f;
    public float flySpeed = 10f;
    public float swoopSpeed = 16f;
    public float turnSpeed = 2.2f;
    public float detectRange = 28f;
    public float loseRange = 40f;
    public float spitRange = 18f;
    public float spitMinRange = 6f;
    public float biteRange = 4.6f;
    public int spitDamage = 16;
    public int biteDamage = 28;
    public float spitCooldown = 2.1f;
    public float biteCooldown = 1.4f;
    public float stunTime = 0.55f;
    public string playerTag = "Player";
    public State Current { get; private set; } = State.Idle;
    public int Health { get; private set; }
    CharacterController _cc;
    Vector3 _home;
    Transform _target;
    float _spitCd, _biteCd, _stun, _angle;
    bool _alive = true;
    void Awake()
    {
        _cc = GetComponent<CharacterController>();
        Health = maxHealth;
        _home = transform.position;
        if (model == null && transform.childCount > 0) model = transform.GetChild(0);
    }
    void Update()
    {
        if (!_alive) { _cc.Move(Vector3.down * 2f * Time.deltaTime); return; }
        float dt = Time.deltaTime;
        _spitCd = Mathf.Max(0f, _spitCd - dt);
        _biteCd = Mathf.Max(0f, _biteCd - dt);
        FindTarget();
        switch (Current)
        {
            case State.Idle:
                FlyTo(new Vector3(transform.position.x, _home.y + cruiseHeight * 0.45f, transform.position.z), flySpeed * 0.45f, dt);
                if (_target != null) Current = State.Lift;
                break;
            case State.Lift:
                FlyTo(new Vector3(_home.x, _home.y + cruiseHeight, _home.z), flySpeed, dt);
                if (Mathf.Abs(transform.position.y - (_home.y + cruiseHeight)) < 0.8f) Current = State.Circle;
                break;
            case State.Circle: TickCircle(dt); break;
            case State.Swoop: TickSwoop(dt); break;
            case State.Spit: TickSpit(); break;
            case State.Bite: TickBite(); break;
            case State.Stun:
                _stun -= dt;
                if (_stun <= 0f) Current = _target != null ? State.Circle : State.Idle;
                break;
        }
        FaceFlight(dt);
        Flap();
    }
    public void ApplyDamage(int amount)
    {
        if (!_alive || amount <= 0) return;
        Health = Mathf.Max(0, Health - amount);
        _stun = stunTime;
        Current = State.Stun;
        if (Health <= 0) Die();
    }
    void FindTarget()
    {
        Transform best = null;
        float bestD = detectRange;
        foreach (var p in GameObject.FindGameObjectsWithTag(playerTag))
        {
            float d = Vector3.Distance(transform.position, p.transform.position);
            if (d < bestD) { bestD = d; best = p.transform; }
        }
        if (best == null && _target != null && Vector3.Distance(transform.position, _target.position) > loseRange)
            _target = null;
        else if (best != null) _target = best;
    }
    void TickCircle(float dt)
    {
        if (_target == null) { Current = State.Idle; return; }
        _angle += dt * 0.85f;
        FlyTo(_target.position + new Vector3(Mathf.Cos(_angle) * circleRadius, cruiseHeight, Mathf.Sin(_angle) * circleRadius), flySpeed, dt);
        float dist = Vector3.Distance(transform.position, _target.position);
        if (dist <= biteRange && _biteCd <= 0f) Current = State.Bite;
        else if (dist <= spitRange && dist >= spitMinRange && _spitCd <= 0f) Current = State.Spit;
        else if (dist < spitMinRange) Current = State.Swoop;
    }
    void TickSwoop(float dt)
    {
        if (_target == null) { Current = State.Lift; return; }
        FlyTo(_target.position + Vector3.up * 1.2f, swoopSpeed, dt);
        if (Vector3.Distance(transform.position, _target.position) <= biteRange) Current = State.Bite;
        else if (transform.position.y < _target.position.y + 1.4f) Current = State.Lift;
    }
    void TickSpit()
    {
        if (_target == null) { Current = State.Idle; return; }
        SpawnFire();
        _spitCd = spitCooldown;
        Current = State.Circle;
    }
    void TickBite()
    {
        if (_target != null && Vector3.Distance(transform.position, _target.position) <= biteRange + 1f)
        {
            var player = _target.GetComponent<PlayerCombat>();
            if (player != null) player.ApplyDamage(biteDamage);
        }
        _biteCd = biteCooldown;
        Current = State.Lift;
    }
    void SpawnFire()
    {
        if (_target == null) return;
        Vector3 origin = transform.position + transform.forward * 1.8f + Vector3.up * 0.4f;
        Vector3 dir = (_target.position + Vector3.up - origin).normalized;
        GameObject go = fireboltPrefab != null
            ? Instantiate(fireboltPrefab, origin, Quaternion.LookRotation(dir))
            : GameObject.CreatePrimitive(PrimitiveType.Sphere);
        if (fireboltPrefab == null) { go.transform.position = origin; go.transform.localScale = Vector3.one * 0.4f; }
        var bolt = go.GetComponent<Firebolt>() ?? go.AddComponent<Firebolt>();
        bolt.direction = dir;
        bolt.damage = spitDamage;
    }
    void FlyTo(Vector3 point, float speed, float dt)
    {
        Vector3 offset = point - transform.position;
        if (offset.sqrMagnitude < 0.02f) return;
        _cc.Move(offset.normalized * speed * dt);
    }
    void FaceFlight(float dt)
    {
        Vector3 flat = _target != null ? _target.position - transform.position : transform.forward;
        flat.y = 0f;
        if (flat.sqrMagnitude < 0.05f) return;
        transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(flat), turnSpeed * dt);
    }
    void Flap()
    {
        if (model == null || !_alive) return;
        Vector3 p = model.localPosition;
        p.y = Mathf.Sin(Time.time * 8f) * 0.12f;
        model.localPosition = p;
    }
    void Die()
    {
        _alive = false;
        Current = State.Dead;
        if (_cc) _cc.enabled = false;
    }
}
