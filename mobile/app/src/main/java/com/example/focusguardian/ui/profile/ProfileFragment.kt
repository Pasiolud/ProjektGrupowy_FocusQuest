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
import com.example.focusguardian.api.ProfileResponse
import com.example.focusguardian.api.RetrofitClient
import com.example.focusguardian.auth.AuthManager
import com.example.focusguardian.auth.LoginActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ProfileFragment : Fragment() {

    private lateinit var authManager: AuthManager
    private lateinit var userNameText: TextView
    private lateinit var levelText: TextView
    private lateinit var xpProgressBar: ProgressBar

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_profile, container, false)
        authManager = AuthManager(requireContext())

        userNameText = root.findViewById(R.id.userNameText)
        levelText = root.findViewById(R.id.levelText)
        xpProgressBar = root.findViewById(R.id.progressBar)

        val logoutButton = root.findViewById<Button>(R.id.logoutButton)
        logoutButton.setOnClickListener {
            authManager.logout()
            startActivity(Intent(requireContext(), LoginActivity::class.java))
            requireActivity().finish()
        }

        fetchProfileData()

        return root
    }

    private fun fetchProfileData() {
        val token = authManager.getAuthToken() ?: return
        
        RetrofitClient.backendService.getMyProfile("Bearer $token")
            .enqueue(object : Callback<ProfileResponse> {
                override fun onResponse(call: Call<ProfileResponse>, response: Response<ProfileResponse>) {
                    if (response.isSuccessful) {
                        val profile = response.body()?.profile
                        if (profile != null) {
                            updateUI(profile.level, profile.totalXp, profile.coins)
                        }
                    } else {
                        Toast.makeText(context, "Błąd profilu: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<ProfileResponse>, t: Throwable) {
                    Toast.makeText(context, "Błąd połączenia: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun updateUI(level: Int, xp: Int, coins: Int) {
        levelText.text = "LEVEL $level"
        // In the layout, userNameText can stay as the player name
        
        // XP Progress logic: XP_needed = 1000 * current_level^1.5
        val needed = (1000 * Math.pow(level.toDouble(), 1.5)).toInt()
        val progress = if (needed > 0) (xp % needed * 100 / needed) else 0
        xpProgressBar.progress = progress
    }
}
