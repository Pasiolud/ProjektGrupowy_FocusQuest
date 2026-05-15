package com.example.focusguardian.api

import com.example.focusguardian.Config
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import java.time.LocalDate
import kotlin.math.max
import kotlin.math.pow

data class ProfileRow(
    @SerializedName("id") val id: String,
    @SerializedName("total_xp") val totalXp: Int = 0,
    @SerializedName("coins") val coins: Int = 0,
    @SerializedName("level") val level: Int = 1,
    @SerializedName("current_streak") val currentStreak: Int = 0,
    @SerializedName("longest_streak") val longestStreak: Int = 0,
    @SerializedName("weekly_focus_seconds") val weeklyFocusSeconds: Int = 0,
    @SerializedName("daily_focus_seconds") val dailyFocusSeconds: Int = 0,
    @SerializedName("total_sessions") val totalSessions: Int = 0,
    @SerializedName("email") val email: String? = null,
    @SerializedName("last_session_date") val lastSessionDate: String? = null,
    @SerializedName("garden_slots") val gardenSlotsRaw: Any? = null,
    @SerializedName("seed_inventory") val seedInventoryRaw: Any? = null,
    @SerializedName("active_session_start") val activeSessionStart: String? = null,
    @SerializedName("active_session_duration") val activeSessionDuration: Int? = null
)

data class ItemRow(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("icon") val icon: String,
    @SerializedName("rarity") val rarity: String,
    @SerializedName("category") val category: String,
    @SerializedName("css_value") val cssValue: String? = null
)

data class UserItemRow(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("item_id") val itemId: String,
    @SerializedName("items") val item: ItemRow? = null
)

sealed class RepoResult<out T> {
    data class Success<T>(val data: T) : RepoResult<T>()
    data class Error(val message: String) : RepoResult<Nothing>()
}

object SupabaseRepository {

    private val gson = Gson()
    private val JSON = "application/json".toMediaType()

    private val client: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
        OkHttpClient.Builder().addInterceptor(logging).build()
    }

    private fun restHeaders(token: String) = mapOf(
        "apikey" to Config.SUPABASE_ANON_KEY,
        "Authorization" to "Bearer $token",
        "Content-Type" to "application/json",
        "Prefer" to "return=representation"
    )

    private fun buildRequest(url: String, token: String): Request.Builder {
        val builder = Request.Builder().url(url)
        restHeaders(token).forEach { (k, v) -> builder.addHeader(k, v) }
        return builder
    }

    private fun <T> get(url: String, token: String, type: java.lang.reflect.Type): RepoResult<T> {
        return try {
            val req = buildRequest(url, token).get().build()
            val resp = client.newCall(req).execute()
            val body = resp.body?.string() ?: ""
            if (resp.isSuccessful) {
                RepoResult.Success(gson.fromJson(body, type))
            } else {
                RepoResult.Error("HTTP ${resp.code}: $body")
            }
        } catch (e: IOException) {
            RepoResult.Error(e.message ?: "Network error")
        }
    }

    private fun patch(url: String, token: String, payload: Map<String, Any?>): RepoResult<Unit> {
        return try {
            val body = gson.toJson(payload).toRequestBody(JSON)
            val req = buildRequest(url, token).patch(body).build()
            val resp = client.newCall(req).execute()
            if (resp.isSuccessful) RepoResult.Success(Unit)
            else RepoResult.Error("HTTP ${resp.code}: ${resp.body?.string()}")
        } catch (e: IOException) {
            RepoResult.Error(e.message ?: "Network error")
        }
    }

    private fun post(url: String, token: String, payload: Map<String, Any?>): RepoResult<String> {
        return try {
            val body = gson.toJson(payload).toRequestBody(JSON)
            val req = buildRequest(url, token).post(body).build()
            val resp = client.newCall(req).execute()
            val bodyStr = resp.body?.string() ?: ""
            if (resp.isSuccessful) RepoResult.Success(bodyStr)
            else RepoResult.Error("HTTP ${resp.code}: $bodyStr")
        } catch (e: IOException) {
            RepoResult.Error(e.message ?: "Network error")
        }
    }

    fun getProfile(token: String, userId: String): RepoResult<ProfileRow> {
        val url = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId&limit=1"
        val listType = object : TypeToken<List<ProfileRow>>() {}.type
        return when (val r = get<List<ProfileRow>>(url, token, listType)) {
            is RepoResult.Success -> {
                val row = r.data.firstOrNull()
                    ?: return RepoResult.Error("Profile not found")
                RepoResult.Success(row)
            }
            is RepoResult.Error -> r
        }
    }

    fun getGardenSlots(profile: ProfileRow): List<PlantData> {
        val raw = profile.gardenSlotsRaw ?: return emptyList()
        val json = when (raw) {
            is String -> raw
            else -> gson.toJson(raw)
        }
        if (json.isBlank() || json == "null") return emptyList()
        return try {
            gson.fromJson(json, object : TypeToken<List<PlantData>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    fun getSeedInventory(profile: ProfileRow): List<SeedData> {
        val raw = profile.seedInventoryRaw ?: return emptyList()
        val json = when (raw) {
            is String -> raw
            else -> gson.toJson(raw)
        }
        if (json.isBlank() || json == "null") return emptyList()
        return try {
            gson.fromJson(json, object : TypeToken<List<SeedData>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    data class SessionResult(val earnedXp: Int, val earnedCoins: Int, val newLevel: Int, val rewardSeed: SeedData)

    fun completeSession(token: String, userId: String, durationSeconds: Int, isTestMode: Boolean): RepoResult<SessionResult> {
        val profileResult = getProfile(token, userId)
        if (profileResult is RepoResult.Error) return profileResult

        val profile = (profileResult as RepoResult.Success).data

        val earnedXp = if (isTestMode) 1500 else durationSeconds
        val earnedCoins = if (isTestMode) 25 else durationSeconds / 60

        val today = LocalDate.now().toString()
        val lastDate = profile.lastSessionDate
        var newStreak = profile.currentStreak
        var newDailyFocus = profile.dailyFocusSeconds

        if (isTestMode) {
            newStreak += 1
        } else {
            if (lastDate == null) {
                newStreak = 1
                newDailyFocus = 0
            } else if (lastDate != today) {
                val last = LocalDate.parse(lastDate)
                val yesterday = LocalDate.now().minusDays(1)
                newStreak = if (last == yesterday) newStreak + 1 else 1
                newDailyFocus = 0
            }
        }

        val progressToAdd = if (isTestMode) 30000 else durationSeconds
        val actualDuration = if (isTestMode) 1500 else durationSeconds

        val newTotalXp = profile.totalXp + earnedXp
        val newCoins = profile.coins + earnedCoins
        val newWeekly = profile.weeklyFocusSeconds + actualDuration
        newDailyFocus += actualDuration
        val newSessions = profile.totalSessions + 1
        val newLevel = calcLevel(newTotalXp)

        val garden = getGardenSlots(profile).map { plant ->
            plant.copy(progress = plant.progress + progressToAdd)
        }

        val seedPool = listOf(
            SeedData("oak", "Dąb Mądrości", "common", 7200, 2000),
            SeedData("fire", "Ognisty Kwiat", "rare", 14400, 5000),
            SeedData("star", "Gwiezdne Pnącze", "legendary", 28800, 12000)
        )
        val weights = listOf(70.0, 25.0, 5.0)
        val newSeed = weightedRandom(seedPool, weights)

        val seeds = getSeedInventory(profile).toMutableList().also { it.add(newSeed) }

        val updatePayload = mapOf(
            "total_xp" to newTotalXp,
            "coins" to newCoins,
            "level" to newLevel,
            "weekly_focus_seconds" to newWeekly,
            "daily_focus_seconds" to newDailyFocus,
            "total_sessions" to newSessions,
            "current_streak" to newStreak,
            "last_session_date" to today,
            "longest_streak" to max(newStreak, profile.longestStreak),
            "garden_slots" to gson.toJson(garden),
            "seed_inventory" to gson.toJson(seeds)
        )

        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val patchResult = patch(patchUrl, token, updatePayload)
        if (patchResult is RepoResult.Error) return patchResult

        try {
            val sessionUrl = "${Config.SUPABASE_URL}/rest/v1/sessions"
            post(sessionUrl, token, mapOf("user_id" to userId, "duration_seconds" to durationSeconds))
        } catch (_: Exception) {}

        return RepoResult.Success(SessionResult(earnedXp, earnedCoins, newLevel, newSeed))
    }

    fun getLeaderboard(token: String, orderByField: String): RepoResult<List<ProfileRow>> {
        val url = "${Config.SUPABASE_URL}/rest/v1/profiles?select=id,level,total_sessions,coins,current_streak&order=$orderByField.desc&limit=50"
        val listType = object : TypeToken<List<ProfileRow>>() {}.type
        return get<List<ProfileRow>>(url, token, listType)
    }

    data class OpenBoxResult(val item: ShopItem, val isDuplicate: Boolean, val newCoins: Int)

    fun openBox(token: String, userId: String, boxType: String, cost: Int): RepoResult<OpenBoxResult> {
        val profileResult = getProfile(token, userId)
        if (profileResult is RepoResult.Error) return profileResult
        val profile = (profileResult as RepoResult.Success).data

        if (profile.coins < cost) return RepoResult.Error("Nie masz wystarczającej ilości monet!")

        val itemsUrl = "${Config.SUPABASE_URL}/rest/v1/items?select=*"
        val itemListType = object : TypeToken<List<ItemRow>>() {}.type
        val itemsResult = get<List<ItemRow>>(itemsUrl, token, itemListType)
        if (itemsResult is RepoResult.Error) return itemsResult
        val allItems = (itemsResult as RepoResult.Success).data
        if (allItems.isEmpty()) return RepoResult.Error("Brak przedmiotów w bazie!")

        val drawn = allItems.random()

        val userItemsUrl = "${Config.SUPABASE_URL}/rest/v1/user_items?user_id=eq.$userId&item_id=eq.${drawn.id}"
        val userItemListType = object : TypeToken<List<UserItemRow>>() {}.type
        val userItemsResult = get<List<UserItemRow>>(userItemsUrl, token, userItemListType)
        if (userItemsResult is RepoResult.Error) return userItemsResult
        val isDuplicate = (userItemsResult as RepoResult.Success).data.isNotEmpty()

        var newCoins = profile.coins - cost
        if (isDuplicate) {
            newCoins += cost / 2
        } else {
            val insertUrl = "${Config.SUPABASE_URL}/rest/v1/user_items"
            post(insertUrl, token, mapOf("user_id" to userId, "item_id" to drawn.id))
        }

        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val patchResult = patch(patchUrl, token, mapOf("coins" to newCoins))
        if (patchResult is RepoResult.Error) return patchResult

        val shopItem = ShopItem(drawn.name, drawn.rarity, drawn.category, drawn.icon, isDuplicate)
        return RepoResult.Success(OpenBoxResult(shopItem, isDuplicate, newCoins))
    }

    fun getInventory(token: String, userId: String): RepoResult<List<ShopItem>> {
        val url = "${Config.SUPABASE_URL}/rest/v1/user_items?user_id=eq.$userId&select=*,items(*)"
        val listType = object : TypeToken<List<UserItemRow>>() {}.type
        return when (val r = get<List<UserItemRow>>(url, token, listType)) {
            is RepoResult.Success -> RepoResult.Success(
                r.data.mapNotNull { row ->
                    row.item?.let { ShopItem(it.name, it.rarity, it.category, it.icon, false) }
                }
            )
            is RepoResult.Error -> r
        }
    }

    fun plantSeed(token: String, userId: String, seedIndex: Int): RepoResult<Unit> {
        val profileResult = getProfile(token, userId)
        if (profileResult is RepoResult.Error) return profileResult
        val profile = (profileResult as RepoResult.Success).data

        val garden = getGardenSlots(profile).toMutableList()
        val seeds = getSeedInventory(profile).toMutableList()

        if (garden.size >= 3) return RepoResult.Error("Ogród jest pełny (max 3 rośliny)")
        if (seedIndex < 0 || seedIndex >= seeds.size) return RepoResult.Error("Nieprawidłowy indeks nasiona")

        val seed = seeds.removeAt(seedIndex)
        val newPlant = PlantData(
            id = System.currentTimeMillis().toString(),
            type = seed.type,
            name = seed.name,
            rarity = seed.rarity,
            progress = 0,
            target = seed.target,
            value = seed.value
        )
        garden.add(newPlant)

        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        return patch(patchUrl, token, mapOf(
            "garden_slots" to gson.toJson(garden),
            "seed_inventory" to gson.toJson(seeds)
        ))
    }

    fun sellPlant(token: String, userId: String, plantId: String): RepoResult<Int> {
        val profileResult = getProfile(token, userId)
        if (profileResult is RepoResult.Error) return profileResult
        val profile = (profileResult as RepoResult.Success).data

        val garden = getGardenSlots(profile).toMutableList()
        val plantIndex = garden.indexOfFirst { it.id == plantId }
        if (plantIndex == -1) return RepoResult.Error("Roślina nie znaleziona")

        val plant = garden[plantIndex]
        if (plant.progress < plant.target) return RepoResult.Error("Roślina jeszcze nie wyrosła")

        garden.removeAt(plantIndex)
        val newCoins = profile.coins + plant.value

        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val result = patch(patchUrl, token, mapOf(
            "garden_slots" to gson.toJson(garden),
            "coins" to newCoins
        ))
        return when (result) {
            is RepoResult.Success -> RepoResult.Success(plant.value)
            is RepoResult.Error -> result
        }
    }

    fun getInventoryFull(token: String, userId: String): RepoResult<List<ItemRow>> {
        val url = "${Config.SUPABASE_URL}/rest/v1/user_items?user_id=eq.$userId&select=*,items(*)"
        val listType = object : TypeToken<List<UserItemRow>>() {}.type
        return when (val r = get<List<UserItemRow>>(url, token, listType)) {
            is RepoResult.Success -> RepoResult.Success(r.data.mapNotNull { it.item })
            is RepoResult.Error -> r
        }
    }

    fun getEquippedTheme(profile: ProfileRow): Map<String, String> {
        val raw = try {
            val field = profile.javaClass.getDeclaredField("equipped_theme")
            field.isAccessible = true
            field.get(profile)
        } catch (_: Exception) { null }
        val json = when {
            raw is String -> raw
            raw != null -> gson.toJson(raw)
            else -> null
        }
        if (json.isNullOrBlank() || json == "null") return emptyMap()
        return try {
            gson.fromJson(json, object : TypeToken<Map<String, String>>() {}.type)
        } catch (_: Exception) { emptyMap() }
    }

    fun getEquippedThemeDirectly(token: String, userId: String): RepoResult<Map<String, String>> {
        val url = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId&select=equipped_theme&limit=1"
        val listType = object : TypeToken<List<Map<String, Any?>>>() {}.type
        val result = get<List<Map<String, Any?>>>(url, token, listType)
        if (result is RepoResult.Error) return result
        val raw = (result as RepoResult.Success).data.firstOrNull()?.get("equipped_theme")
        val json = when (raw) {
            is String -> raw
            null -> null
            else -> gson.toJson(raw)
        }
        if (json.isNullOrBlank() || json == "null") return RepoResult.Success(emptyMap())
        return try {
            RepoResult.Success(gson.fromJson(json, object : TypeToken<Map<String, String>>() {}.type))
        } catch (_: Exception) { RepoResult.Success(emptyMap()) }
    }

    fun getEquippedThemeFromRaw(profile: ProfileRow): Map<String, String> {
        val mapType = object : TypeToken<Map<String, String>>() {}.type
        return try {
            val url = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}&select=equipped_theme&limit=1"
            val req = buildRequest(url, "placeholder").get().build()
            emptyMap()
        } catch (_: Exception) { emptyMap() }
    }

    fun equipItem(token: String, userId: String, category: String, cssValue: String): RepoResult<Map<String, String>> {
        val profileResult = getProfile(token, userId)
        if (profileResult is RepoResult.Error) return profileResult
        val rawUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId&select=equipped_theme&limit=1"
        val listType = object : TypeToken<List<Map<String, Any?>>>() {}.type
        val rawResult = get<List<Map<String, Any?>>>(rawUrl, token, listType)
        val existingTheme: MutableMap<String, String> = mutableMapOf()
        if (rawResult is RepoResult.Success) {
            val raw = rawResult.data.firstOrNull()?.get("equipped_theme")
            val json = when (raw) {
                is String -> raw
                null -> null
                else -> gson.toJson(raw)
            }
            if (!json.isNullOrBlank() && json != "null") {
                try {
                    val parsed: Map<String, String> = gson.fromJson(json, object : TypeToken<Map<String, String>>() {}.type)
                    existingTheme.putAll(parsed)
                } catch (_: Exception) {}
            }
        }
        existingTheme[category] = cssValue
        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val result = patch(patchUrl, token, mapOf("equipped_theme" to gson.toJson(existingTheme)))
        return when (result) {
            is RepoResult.Success -> RepoResult.Success(existingTheme)
            is RepoResult.Error -> result
        }
    }

    fun unequipItem(token: String, userId: String, category: String): RepoResult<Map<String, String>> {
        val rawUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId&select=equipped_theme&limit=1"
        val listType = object : TypeToken<List<Map<String, Any?>>>() {}.type
        val rawResult = get<List<Map<String, Any?>>>(rawUrl, token, listType)
        val existingTheme: MutableMap<String, String> = mutableMapOf()
        if (rawResult is RepoResult.Success) {
            val raw = rawResult.data.firstOrNull()?.get("equipped_theme")
            val json = when (raw) {
                is String -> raw
                null -> null
                else -> gson.toJson(raw)
            }
            if (!json.isNullOrBlank() && json != "null") {
                try {
                    val parsed: Map<String, String> = gson.fromJson(json, object : TypeToken<Map<String, String>>() {}.type)
                    existingTheme.putAll(parsed)
                } catch (_: Exception) {}
            }
        }
        existingTheme.remove(category)
        val patchUrl = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val result = patch(patchUrl, token, mapOf("equipped_theme" to gson.toJson(existingTheme)))
        return when (result) {
            is RepoResult.Success -> RepoResult.Success(existingTheme)
            is RepoResult.Error -> result
        }
    }

    fun cssValueToAndroidColor(cssValue: String?): Int? {
        return when (cssValue) {
            "theme-timer-neon" -> 0xFFFF00FF.toInt()
            "theme-timer-gold" -> 0xFFFFD700.toInt()
            "theme-timer-emerald" -> 0xFF50C878.toInt()
            "theme-timer-magma" -> 0xFFFF4500.toInt()
            "theme-timer-matrix" -> 0xFF00FF00.toInt()
            "theme-timer-cosmic" -> 0xFFBDE0FE.toInt()
            "theme-timer-hitech" -> 0xFF00F2FF.toInt()
            "theme-timer-legendary-pulse" -> 0xFFFFBD00.toInt()
            else -> null
        }
    }

    fun startActiveSession(token: String, userId: String, durationSeconds: Int): RepoResult<Unit> {
        val url = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val nowIso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", java.util.Locale.US).format(java.util.Date())
        val payload = mapOf(
            "active_session_start" to nowIso,
            "active_session_duration" to durationSeconds
        )
        return patch(url, token, payload)
    }

    fun clearActiveSession(token: String, userId: String): RepoResult<Unit> {
        val url = "${Config.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId"
        val payload = mapOf(
            "active_session_start" to null,
            "active_session_duration" to null
        )
        return patch(url, token, payload)
    }

    private fun calcLevel(xp: Int): Int {
        var lvl = 1
        var needed = 1000.0 * lvl.toDouble().pow(1.5)
        var remaining = xp.toDouble()
        while (remaining >= needed) {
            remaining -= needed
            lvl++
            needed = 1000.0 * lvl.toDouble().pow(1.5)
        }
        return lvl
    }

    private fun <T> weightedRandom(items: List<T>, weights: List<Double>): T {
        val total = weights.sum()
        var r = Math.random() * total
        for (i in items.indices) {
            r -= weights[i]
            if (r <= 0) return items[i]
        }
        return items.last()
    }
}
