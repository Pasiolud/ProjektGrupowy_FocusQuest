package com.example.focusguardian.ui.timer

import android.graphics.Color
import android.os.Bundle
import android.os.CountDownTimer
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.focusguardian.R
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.CircularProgressIndicator
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit
import java.util.concurrent.Executors

class TimerFragment : Fragment() {

    private var timer: CountDownTimer? = null
    private var isTimerRunning = false

    private var isTestMode = false
    private val PROD_TIME = 1500000L
    private val TEST_TIME = 60000L
    private val PROD_SECONDS = 1500
    private val TEST_SECONDS = 60
    private var timeLeftInMillis: Long = PROD_TIME
    private var totalMillis: Long = PROD_TIME

    private lateinit var timerDisplay: TextView
    private lateinit var timerStatusLabel: TextView
    private lateinit var timerAvatarLabel: TextView
    private lateinit var startButton: MaterialButton
    private lateinit var timerProgress: CircularProgressIndicator
    private lateinit var timerRewardPreview: TextView
    private lateinit var authManager: AuthManager

    private val executor = Executors.newSingleThreadExecutor()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_timer, container, false)

        timerDisplay = root.findViewById(R.id.timer_display)
        timerStatusLabel = root.findViewById(R.id.timer_status_label)
        timerAvatarLabel = root.findViewById(R.id.timer_avatar_label)
        startButton = root.findViewById(R.id.startButton)
        timerProgress = root.findViewById(R.id.timer_progress)
        timerRewardPreview = root.findViewById(R.id.timer_reward_preview)
        authManager = AuthManager(requireContext())

        val titleText = root.findViewById<TextView>(R.id.timer_title)

        titleText.setOnLongClickListener {
            if (!isTimerRunning) {
                isTestMode = !isTestMode
                timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
                totalMillis = timeLeftInMillis
                updateCountDownText()
                updateRewardPreview()
                Toast.makeText(context, if (isTestMode) "TEST MODE: 1 min" else "PROD MODE: 25 min", Toast.LENGTH_SHORT).show()
            }
            true
        }

        startButton.setOnClickListener {
            if (isTimerRunning) stopTimer() else attemptStartTimer()
        }

        checkActiveSession()
        loadEquippedTheme()
        updateCountDownText()
        updateRewardPreview()
        return root
    }

    private fun checkActiveSession() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val profileResult = SupabaseRepository.getProfile(token, userId)
            activity?.runOnUiThread {
                if (profileResult is RepoResult.Success) {
                    val p = profileResult.data
                    if (p.activeSessionStart != null && p.activeSessionDuration != null) {
                        try {
                            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
                            val startDate = sdf.parse(p.activeSessionStart)
                            val now = java.util.Date()
                            
                            val secondsPassed = (now.time - startDate.time) / 1000
                            val secondsRemaining = p.activeSessionDuration - secondsPassed

                            if (secondsRemaining > 0) {
                                timeLeftInMillis = secondsRemaining * 1000
                                totalMillis = p.activeSessionDuration.toLong() * 1000
                                startTimerLocally(p.activeSessionDuration)
                            } else {
                                SupabaseRepository.clearActiveSession(token, userId)
                            }
                        } catch (e: Exception) {
                            executor.execute { SupabaseRepository.clearActiveSession(token, userId) }
                        }
                    }
                }
            }
        }
    }

    private fun loadEquippedTheme() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val themeResult = SupabaseRepository.getEquippedThemeDirectly(token, userId)
            activity?.runOnUiThread {
                if (themeResult is RepoResult.Success) {
                    val theme = themeResult.data
                    val timerCssValue = theme["timer_color"]
                    val color = SupabaseRepository.cssValueToAndroidColor(timerCssValue)
                    if (color != null) {
                        timerProgress.setIndicatorColor(color)
                    }
                    val avatarSkin = theme["avatar_skin"]
                    if (!avatarSkin.isNullOrBlank()) {
                        timerAvatarLabel.text = avatarSkin
                    }
                }
            }
        }
    }

    private fun attemptStartTimer() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return
        val durationSeconds = if (isTestMode) TEST_SECONDS else PROD_SECONDS

        startButton.isEnabled = false
        executor.execute {
            val profileResult = SupabaseRepository.getProfile(token, userId)
            if (profileResult is RepoResult.Success) {
                val p = profileResult.data
                if (p.activeSessionStart != null) {
                    activity?.runOnUiThread {
                        startButton.isEnabled = true
                        Toast.makeText(context, "Sesja już trwa na innym urządzeniu!", Toast.LENGTH_LONG).show()
                    }
                    return@execute
                }
            }

            val startResult = SupabaseRepository.startActiveSession(token, userId, durationSeconds)
            activity?.runOnUiThread {
                startButton.isEnabled = true
                if (startResult is RepoResult.Success) {
                    totalMillis = timeLeftInMillis
                    startTimerLocally(durationSeconds)
                } else {
                    Toast.makeText(context, "Błąd startu sesji", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun startTimerLocally(durationSeconds: Int) {
        timer?.cancel()
        timer = object : CountDownTimer(timeLeftInMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                timeLeftInMillis = millisUntilFinished
                updateCountDownText()
                val progressVal = ((millisUntilFinished.toFloat() / totalMillis) * 100).toInt()
                timerProgress.progress = progressVal
            }

            override fun onFinish() {
                isTimerRunning = false
                startButton.text = "Start"
                timerStatusLabel.text = "gotowy"
                timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
                totalMillis = timeLeftInMillis
                timerProgress.progress = 100
                updateCountDownText()
                
                val token = authManager.getAuthToken() ?: return
                val userId = authManager.getUserId() ?: return
                executor.execute { SupabaseRepository.clearActiveSession(token, userId) }
                
                sendSessionCompleted(durationSeconds)
            }
        }.start()

        isTimerRunning = true
        startButton.text = "Stop"
        timerStatusLabel.text = "skupienie"
    }

    private fun stopTimer() {
        timer?.cancel()
        isTimerRunning = false
        startButton.text = "Start"
        timerStatusLabel.text = "przerwano"
        timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
        totalMillis = timeLeftInMillis
        timerProgress.progress = 100
        updateCountDownText()
        
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return
        executor.execute { SupabaseRepository.clearActiveSession(token, userId) }
        
        Toast.makeText(context, "Sesja przerwana", Toast.LENGTH_SHORT).show()
    }

    private fun updateCountDownText() {
        val minutes = (timeLeftInMillis / 1000).toInt() / 60
        val seconds = (timeLeftInMillis / 1000).toInt() % 60
        timerDisplay.text = String.format("%02d:%02d", minutes, seconds)
    }

    private fun updateRewardPreview() {
        val seconds = if (isTestMode) TEST_SECONDS else PROD_SECONDS
        val coins = seconds / 60
        val xp = seconds
        timerRewardPreview.text = "+$coins monet  +$xp XP"
    }

    private fun sendSessionCompleted(duration: Int) {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.completeSession(token, userId, duration, isTestMode)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        val d = result.data
                        Toast.makeText(context, "Brawo! +${d.earnedCoins} monet  +${d.earnedXp} XP  🌱 ${d.rewardSeed.name}", Toast.LENGTH_LONG).show()
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd sesji: ${result.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        timer?.cancel()
        executor.shutdown()
    }
}
