using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GameManager : MonoBehaviour
{
    public PlayerCombat player;
    public DragonNPC dragon;
    public PalaceLevel palace;
    public Text statusText;
    public Text playerHpText;
    public Text dragonHpText;
    public bool reloadOnEnd;
    bool _running = true;
    void Start()
    {
        SetStatus("Enter the palace. Reach the throne.");
        RefreshHp();
    }
    void Update()
    {
        RefreshHp();
        if (!_running) return;
        if (player != null && player.Health <= 0)
        {
            _running = false;
            SetStatus("You fell in the palace.");
            if (reloadOnEnd) SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }
        if (dragon != null && dragon.Health <= 0)
        {
            _running = false;
            SetStatus("The palace is yours.");
        }
    }
    void RefreshHp()
    {
        if (playerHpText && player) playerHpText.text = $"Player  {player.Health} / {player.maxHealth}";
        if (dragonHpText && dragon) dragonHpText.text = $"Dragon  {dragon.Health} / {dragon.maxHealth}";
    }
    void SetStatus(string text)
    {
        if (statusText) statusText.text = text;
        Debug.Log(text);
    }
}
