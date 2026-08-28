using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerCombat : MonoBehaviour
{
    public int maxHealth = 100;
    public float moveSpeed = 7f;
    public int attackDamage = 18;
    public float attackRange = 3.2f;
    public float attackCooldown = 0.45f;
    public int Health { get; private set; }
    float _cooldown;
    CharacterController _cc;
    void Awake()
    {
        _cc = GetComponent<CharacterController>();
        Health = maxHealth;
        gameObject.tag = "Player";
    }
    void Update()
    {
        _cooldown = Mathf.Max(0f, _cooldown - Time.deltaTime);
        Vector3 input = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
        if (input.sqrMagnitude > 1f) input.Normalize();
        Vector3 move = input * moveSpeed * Time.deltaTime;
        if (!_cc.isGrounded) move.y -= 18f * Time.deltaTime;
        _cc.Move(move);
        if (Input.GetButtonDown("Fire1") || Input.GetKeyDown(KeyCode.Space)) Attack();
    }
    public void Attack()
    {
        if (_cooldown > 0f) return;
        _cooldown = attackCooldown;
        foreach (var dragon in FindObjectsByType<DragonNPC>(FindObjectsSortMode.None))
        {
            if (Vector3.Distance(transform.position, dragon.transform.position) <= attackRange)
                dragon.ApplyDamage(attackDamage);
        }
    }
    public void ApplyDamage(int amount)
    {
        Health = Mathf.Max(0, Health - amount);
        if (Health <= 0) Destroy(gameObject);
    }
}
