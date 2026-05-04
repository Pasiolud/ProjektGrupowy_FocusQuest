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

data class PlantData(
    @SerializedName("id") val id: String?,
    @SerializedName("type") val type: String,
    @SerializedName("name") val name: String,
    @SerializedName("rarity") val rarity: String,
    @SerializedName("progress") val progress: Int,
    @SerializedName("target") val target: Int,
    @SerializedName("value") val value: Int
)

data class SeedData(
    @SerializedName("type") val type: String,
    @SerializedName("name") val name: String,
    @SerializedName("rarity") val rarity: String,
    @SerializedName("target") val target: Int,
    @SerializedName("value") val value: Int
)

data class ShopItem(
    @SerializedName("name") val name: String,
    @SerializedName("rarity") val rarity: String,
    @SerializedName("type") val type: String,
    @SerializedName("icon") val icon: String,
    @SerializedName("is_duplicate") val isDuplicate: Boolean = false
)
