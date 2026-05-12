package com.example.focusguardian.ui.leaderboard

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.focusguardian.R
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import java.util.concurrent.Executors

class LeaderboardActivity : AppCompatActivity() {

    private lateinit var authManager: AuthManager
    private lateinit var leaderboardContainer: LinearLayout
    private lateinit var loadingBar: ProgressBar
    private lateinit var btnLevel: Button
    private lateinit var btnSessions: Button
    private lateinit var btnCoins: Button
    
    private val executor = Executors.newSingleThreadExecutor()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_leaderboard)

        authManager = AuthManager(this)
        
        leaderboardContainer = findViewById(R.id.leaderboard_container)
        loadingBar = findViewById(R.id.leaderboard_loading)
        btnLevel = findViewById(R.id.btn_sort_level)
        btnSessions = findViewById(R.id.btn_sort_sessions)
        btnCoins = findViewById(R.id.btn_sort_coins)

        findViewById<ImageView>(R.id.btn_back).setOnClickListener {
            finish()
        }

        btnLevel.setOnClickListener { fetchLeaderboard("level") }
        btnSessions.setOnClickListener { fetchLeaderboard("total_sessions") }
        btnCoins.setOnClickListener { fetchLeaderboard("coins") }

        fetchLeaderboard("level")
    }

    private fun fetchLeaderboard(orderBy: String) {
        val token = authManager.getAuthToken() ?: return
        
        // Update button styles
        btnLevel.alpha = if (orderBy == "level") 1.0f else 0.5f
        btnSessions.alpha = if (orderBy == "total_sessions") 1.0f else 0.5f
        btnCoins.alpha = if (orderBy == "coins") 1.0f else 0.5f

        loadingBar.visibility = View.VISIBLE
        leaderboardContainer.removeAllViews()

        executor.execute {
            val result = SupabaseRepository.getLeaderboard(token, orderBy)
            
            runOnUiThread {
                loadingBar.visibility = View.GONE
                if (result is RepoResult.Success) {
                    val data = result.data
                    if (data.isEmpty()) {
                        Toast.makeText(this, "Brak danych.", Toast.LENGTH_SHORT).show()
                    } else {
                        data.forEachIndexed { index, profile ->
                            val rowView = LayoutInflater.from(this).inflate(R.layout.item_leaderboard_row, leaderboardContainer, false)
                            val rankText = rowView.findViewById<TextView>(R.id.row_rank)
                            val nameText = rowView.findViewById<TextView>(R.id.row_name)
                            val scoreText = rowView.findViewById<TextView>(R.id.row_score)

                            rankText.text = "#${index + 1}"
                            
                            val name = if (!profile.email.isNullOrBlank()) profile.email else profile.id.take(8) + "..."
                            nameText.text = name

                            val scoreStr = when (orderBy) {
                                "level" -> "Lvl ${profile.level}"
                                "total_sessions" -> "${profile.totalSessions} sesji"
                                "coins" -> "${profile.coins} monet"
                                else -> ""
                            }
                            scoreText.text = scoreStr

                            if (index == 0) rankText.setTextColor(Color.parseColor("#FFD700"))
                            else if (index == 1) rankText.setTextColor(Color.parseColor("#C0C0C0"))
                            else if (index == 2) rankText.setTextColor(Color.parseColor("#CD7F32"))
                            else rankText.setTextColor(Color.GRAY)

                            leaderboardContainer.addView(rowView)
                        }
                    }
                } else if (result is RepoResult.Error) {
                    Toast.makeText(this, "Błąd: ${result.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        executor.shutdown()
    }
}
