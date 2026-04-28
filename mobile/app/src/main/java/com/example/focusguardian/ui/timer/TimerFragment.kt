package com.example.focusguardian.ui.timer

import android.os.Bundle
import android.os.CountDownTimer
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.focusguardian.R
import com.example.focusguardian.api.BackendService
import com.example.focusguardian.api.RetrofitClient
import com.example.focusguardian.api.SessionCompleteRequest
import com.example.focusguardian.api.SessionResponse
import com.example.focusguardian.auth.AuthManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class TimerFragment : Fragment() {

    private var timer: CountDownTimer? = null
    private var isTimerRunning = false
    
    // Testing mode variables
    private var isTestMode = false
    private val PROD_TIME = 1500000L // 25 min
    private val TEST_TIME = 60000L // 1 min
    private var timeLeftInMillis: Long = PROD_TIME 
    
    private lateinit var timerDisplay: TextView
    private lateinit var startButton: Button
    private lateinit var authManager: AuthManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_timer, container, false)
        
        timerDisplay = root.findViewById(R.id.timer_display)
        startButton = root.findViewById(R.id.startButton)
        authManager = AuthManager(requireContext())
        
        val titleText = root.findViewById<TextView>(R.id.timer_title)

        // Developer Test Toggle (Long click on title)
        titleText.setOnLongClickListener {
            if (!isTimerRunning) {
                isTestMode = !isTestMode
                timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
                updateCountDownText()
                Toast.makeText(context, if (isTestMode) "TEST MODE: 1 min" else "PROD MODE: 25 min", Toast.LENGTH_SHORT).show()
            }
            true
        }

        startButton.setOnClickListener {
            if (isTimerRunning) {
                stopTimer()
            } else {
                startTimer()
            }
        }

        updateCountDownText()
        return root
    }

    private fun startTimer() {
        val durationToSave = if (isTestMode) 60 else 1500

        timer = object : CountDownTimer(timeLeftInMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                timeLeftInMillis = millisUntilFinished
                updateCountDownText()
            }

            override fun onFinish() {
                isTimerRunning = false
                startButton.text = "Start"
                timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
                sendSessionCompleted(durationToSave)
            }
        }.start()

        isTimerRunning = true
        startButton.text = "Stop"
    }

    private fun stopTimer() {
        timer?.cancel()
        isTimerRunning = false
        startButton.text = "Start"
        timeLeftInMillis = if (isTestMode) TEST_TIME else PROD_TIME
        updateCountDownText()
        Toast.makeText(context, "Sesja przerwana", Toast.LENGTH_SHORT).show()
    }

    private fun updateCountDownText() {
        val minutes = (timeLeftInMillis / 1000).toInt() / 60
        val seconds = (timeLeftInMillis / 1000).toInt() % 60
        val timeLeftFormatted = String.format("%02d:%02d", minutes, seconds)
        timerDisplay.text = timeLeftFormatted
    }

    private fun sendSessionCompleted(duration: Int) {
        val token = authManager.getAuthToken() ?: return
        val request = SessionCompleteRequest(duration)
        
        RetrofitClient.backendService.completeSession("Bearer $token", request)
            .enqueue(object : Callback<SessionResponse> {
                override fun onResponse(call: Call<SessionResponse>, response: Response<SessionResponse>) {
                    if (response.isSuccessful) {
                        val data = response.body()
                        Toast.makeText(context, "Brawo! Zdobyto ${data?.earned?.xp} XP i ${data?.earned?.coins} monet!", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(context, "Błąd sesji: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<SessionResponse>, t: Throwable) {
                    Toast.makeText(context, "Błąd połączenia: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        timer?.cancel()
    }
}
