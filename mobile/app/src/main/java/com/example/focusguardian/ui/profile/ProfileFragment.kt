package com.example.focusguardian.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.focusguardian.R
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import com.example.focusguardian.auth.LoginActivity
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

class ProfileFragment : Fragment() {

    private lateinit var authManager: AuthManager
    private lateinit var levelText: TextView
    private lateinit var xpProgressBar: ProgressBar
    private lateinit var xpCurrentText: TextView
    private lateinit var xpNeededText: TextView
    private lateinit var profileAvatar: TextView
    private lateinit var profileCoins: TextView
    private lateinit var statStreak: TextView
    private lateinit var statSessions: TextView
    private lateinit var statWeekly: TextView
    private lateinit var statBestStreak: TextView

    private val executor = Executors.newSingleThreadExecutor()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_profile, container, false)
        authManager = AuthManager(requireContext())

        levelText = root.findViewById(R.id.levelText)
        xpProgressBar = root.findViewById(R.id.progressBar)
        xpCurrentText = root.findViewById(R.id.xp_current_text)
        xpNeededText = root.findViewById(R.id.xp_needed_text)
        profileAvatar = root.findViewById(R.id.profile_avatar)
        profileCoins = root.findViewById(R.id.profile_coins_text)
        statStreak = root.findViewById(R.id.stat_streak)
        statSessions = root.findViewById(R.id.stat_sessions)
        statWeekly = root.findViewById(R.id.stat_weekly)
        statBestStreak = root.findViewById(R.id.stat_best_streak)

        root.findViewById<Button>(R.id.logoutButton).setOnClickListener {
            authManager.logout()
            startActivity(Intent(requireContext(), LoginActivity::class.java))
            requireActivity().finish()
        }

        fetchProfileData()
        return root
    }

    private fun fetchProfileData() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val profileResult = SupabaseRepository.getProfile(token, userId)
            val themeResult = SupabaseRepository.getEquippedThemeDirectly(token, userId)

            activity?.runOnUiThread {
                when (profileResult) {
                    is RepoResult.Success -> {
                        val p = profileResult.data
                        updateUI(p.level, p.totalXp, p.coins, p.currentStreak, p.longestStreak, p.totalSessions, p.weeklyFocusSeconds)

                        if (themeResult is RepoResult.Success) {
                            val avatarSkin = themeResult.data["avatar_skin"]
                            if (!avatarSkin.isNullOrBlank()) profileAvatar.text = avatarSkin
                        }
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd połączenia: ${profileResult.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updateUI(level: Int, xp: Int, coins: Int, streak: Int, bestStreak: Int, sessions: Int, weeklySeconds: Int) {
        levelText.text = "LEVEL $level"
        profileCoins.text = "🪙 $coins"
        statStreak.text = streak.toString()
        statSessions.text = sessions.toString()
        statBestStreak.text = "$bestStreak dni"
        statWeekly.text = "${weeklySeconds / 60} min"

        val xpNeededForNext = (1000 * level.toDouble().pow(1.5)).toInt()
        var previousXpSum = 0
        for (i in 1 until level) {
            previousXpSum += (1000 * i.toDouble().pow(1.5)).toInt()
        }
        val progressXp = xp - previousXpSum
        val progressPercent = if (xpNeededForNext > 0) ((progressXp.toFloat() / xpNeededForNext) * 100).toInt() else 0
        xpProgressBar.progress = min(100, max(0, progressPercent))
        xpCurrentText.text = "$progressXp XP"
        xpNeededText.text = "/ $xpNeededForNext XP"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        executor.shutdown()
    }
}
