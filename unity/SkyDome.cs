using UnityEngine;

public class SkyDome : MonoBehaviour
{
    public Transform model;
    public float spinDegreesPerSecond = 1.4f;
    void Awake()
    {
        if (model == null && transform.childCount > 0)
            model = transform.GetChild(0);
    }
    void Update()
    {
        if (model != null)
            model.Rotate(0f, spinDegreesPerSecond * Time.deltaTime, 0f, Space.World);
    }
}
