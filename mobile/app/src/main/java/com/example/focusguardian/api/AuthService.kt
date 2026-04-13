package com.example.focusguardian.api

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthService {

    @POST("/auth/v1/token?grant_type=password")
    fun login(
        @Header("apikey") apiKey: String,
        @Body request: LoginRequest
    ): Call<AuthResponse>

    @POST("/auth/v1/signup")
    fun register(
        @Header("apikey") apiKey: String,
        @Body request: RegisterRequest
    ): Call<AuthResponse>
}
