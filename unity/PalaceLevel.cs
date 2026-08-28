using UnityEngine;

public class PalaceLevel : MonoBehaviour
{
    public GameObject palacePrefab;
    public Transform player;
    public Transform dragon;
    public Vector3 gateSpawn = new Vector3(0f, 1.2f, 8f);
    public Vector3 thronePoint = new Vector3(0f, 6.2f, -4f);
    public Vector3 roofPoint = new Vector3(0f, 10.2f, 0f);
    public float throneRadius = 3.5f;
    public float gateRadius = 4f;
    public bool putDragonOnRoof = true;
    bool _gateFired;
    bool _throneFired;
    void Start()
    {
        if (palacePrefab != null)
            Instantiate(palacePrefab, Vector3.zero, Quaternion.identity, transform);
        if (player != null) player.position = gateSpawn;
        if (dragon != null && putDragonOnRoof) dragon.position = roofPoint;
    }
    void Update()
    {
        if (player == null) return;
        if (!_gateFired && Vector3.Distance(player.position, gateSpawn) < gateRadius)
            _gateFired = true;
        if (!_throneFired && Vector3.Distance(player.position, thronePoint) < throneRadius)
        {
            _throneFired = true;
            var npc = dragon != null ? dragon.GetComponent<DragonNPC>() : null;
        }
    }
}
