using UnityEngine;

public class Firebolt : MonoBehaviour
{
    public float speed = 22f;
    public float lifetime = 3.2f;
    public int damage = 16;
    public Vector3 direction = Vector3.forward;
    void Start()
    {
        Destroy(gameObject, lifetime);
        if (GetComponent<Collider>() == null)
        {
            var col = gameObject.AddComponent<SphereCollider>();
            col.isTrigger = true;
            col.radius = 0.28f;
        }
        if (GetComponent<Rigidbody>() == null)
        {
            var rb = gameObject.AddComponent<Rigidbody>();
            rb.isKinematic = true;
            rb.useGravity = false;
        }
    }
    void Update()
    {
        transform.position += direction.normalized * speed * Time.deltaTime;
    }
    void OnTriggerEnter(Collider other)
    {
        if (other.GetComponentInParent<DragonNPC>()) return;
        var player = other.GetComponentInParent<PlayerCombat>();
        if (player != null) player.ApplyDamage(damage);
        Destroy(gameObject);
    }
}
