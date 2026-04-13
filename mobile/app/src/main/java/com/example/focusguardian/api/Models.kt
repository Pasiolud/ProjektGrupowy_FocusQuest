package com.example.focusguardian.api

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("expires_in") val expiresIn: Int,
    @SerializedName("user") val user: UserData
)

data class UserData(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class RegisterRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("data") val data: Map<String, String> = emptyMap()
)

// --- Backend Models ---
data class SessionCompleteRequest(
    @SerializedName("duration_seconds") val durationSeconds: Int
)

data class SessionResponse(
    @SerializedName("status") val status: String,
    @SerializedName("earned") val earned: EarnedPoints,
    @SerializedName("new_level") val newLevel: Int
)

data class EarnedPoints(
    @SerializedName("xp") val xp: Int,
    @SerializedName("coins") val coins: Int
)

data class ProfileResponse(
    @SerializedName("status") val status: String,
    @SerializedName("profile") val profile: ProfileData
)

data class ProfileData(
    @SerializedName("id") val id: String,
    @SerializedName("total_xp") val totalXp: Int,
    @SerializedName("coins") val coins: Int,
    @SerializedName("level") val level: Int,
    @SerializedName("current_streak") val currentStreak: Int
)
