using System.Collections.Generic;
using UnityEngine;

public class NpcDirector : MonoBehaviour
{
    public Transform player;
    readonly List<DragonNPC> _dragons = new List<DragonNPC>();
    void Start()
    {
        _dragons.AddRange(FindObjectsByType<DragonNPC>(FindObjectsSortMode.None));
        if (player == null)
        {
            var p = GameObject.FindGameObjectWithTag("Player");
            if (p) player = p.transform;
        }
    }
    public int LivingCount()
    {
        int n = 0;
        foreach (var d in _dragons)
            if (d != null && d.Health > 0) n++;
        return n;
    }
}
