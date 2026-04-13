package com.example.focusguardian.api

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface BackendService {

    @GET("/api/me")
    fun getMyProfile(
        @Header("Authorization") token: String
    ): Call<ProfileResponse>

    @POST("/api/session/complete")
    fun completeSession(
        @Header("Authorization") token: String,
        @Body request: SessionCompleteRequest
    ): Call<SessionResponse>

    @POST("/api/garden/plant")
    fun plantSeed(
        @Header("Authorization") token: String,
        @Body request: Map<String, Int> // {"seed_index": 0}
    ): Call<Map<String, Any>>

    @POST("/api/garden/sell")
    fun sellPlant(
        @Header("Authorization") token: String,
        @Body request: Map<String, String> // {"plant_id": "..."}
    ): Call<Map<String, Any>>
}
