package com.example.focusguardian.ui.inventory

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.focusguardian.R
import com.example.focusguardian.api.ItemRow
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import java.util.concurrent.Executors

class InventoryFragment : Fragment() {

    private lateinit var authManager: AuthManager
    private val executor = Executors.newSingleThreadExecutor()

    private lateinit var emptyText: TextView
    private lateinit var categoryTimerLabel: TextView
    private lateinit var containerTimer: LinearLayout
    private lateinit var categoryBgLabel: TextView
    private lateinit var containerBg: LinearLayout
    private lateinit var categoryAvatarLabel: TextView
    private lateinit var containerAvatar: LinearLayout

    private var equippedTheme: MutableMap<String, String> = mutableMapOf()
    private var allItems: List<ItemRow> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_inventory, container, false)
        authManager = AuthManager(requireContext())

        emptyText = root.findViewById(R.id.inv_empty_text)
        categoryTimerLabel = root.findViewById(R.id.inv_category_timer)
        containerTimer = root.findViewById(R.id.inv_container_timer)
        categoryBgLabel = root.findViewById(R.id.inv_category_bg)
        containerBg = root.findViewById(R.id.inv_container_bg)
        categoryAvatarLabel = root.findViewById(R.id.inv_category_avatar)
        containerAvatar = root.findViewById(R.id.inv_container_avatar)

        loadData()
        return root
    }

    private fun loadData() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val itemsResult = SupabaseRepository.getInventoryFull(token, userId)
            val themeResult = SupabaseRepository.getEquippedThemeDirectly(token, userId)

            val equipped: MutableMap<String, String> = mutableMapOf()
            if (themeResult is RepoResult.Success) {
                equipped.putAll(themeResult.data)
            }

            activity?.runOnUiThread {
                equippedTheme = equipped
                when (itemsResult) {
                    is RepoResult.Success -> {
                        allItems = itemsResult.data
                        renderInventory()
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd ładowania ekwipunku", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun renderInventory() {
        containerTimer.removeAllViews()
        containerBg.removeAllViews()
        containerAvatar.removeAllViews()

        val timerItems = allItems.filter { it.category == "timer_color" }
        val bgItems = allItems.filter { it.category == "profile_bg" }
        val avatarItems = allItems.filter { it.category == "avatar_skin" }

        if (allItems.isEmpty()) {
            emptyText.visibility = View.VISIBLE
            return
        }
        emptyText.visibility = View.GONE

        if (timerItems.isNotEmpty()) {
            categoryTimerLabel.visibility = View.VISIBLE
            timerItems.forEach { item -> containerTimer.addView(createItemCard(item)) }
        }
        if (bgItems.isNotEmpty()) {
            categoryBgLabel.visibility = View.VISIBLE
            bgItems.forEach { item -> containerBg.addView(createItemCard(item)) }
        }
        if (avatarItems.isNotEmpty()) {
            categoryAvatarLabel.visibility = View.VISIBLE
            avatarItems.forEach { item -> containerAvatar.addView(createItemCard(item)) }
        }
    }

    private fun createItemCard(item: ItemRow): View {
        val isEquipped = equippedTheme[item.category] == item.cssValue
        val bg = if (isEquipped) R.drawable.bg_card_equipped else rarityDrawable(item.rarity)

        val card = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundResource(bg)
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 12) }
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        val iconText = TextView(context).apply {
            text = item.icon
            textSize = 36f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { marginEnd = 16 }
        }

        val infoLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val nameText = TextView(context).apply {
            text = item.name
            textSize = 15f
            setTextColor(Color.parseColor("#1A1C1C"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        val rarityText = TextView(context).apply {
            text = item.rarity.uppercase()
            textSize = 11f
            setTextColor(rarityColor(item.rarity))
            letterSpacing = 0.08f
        }

        if (isEquipped) {
            val equippedBadge = TextView(context).apply {
                text = "✓ Założone"
                textSize = 10f
                setTextColor(Color.parseColor("#006E1C"))
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }
            infoLayout.addView(nameText)
            infoLayout.addView(rarityText)
            infoLayout.addView(equippedBadge)
        } else {
            infoLayout.addView(nameText)
            infoLayout.addView(rarityText)
        }

        val actionBtn = Button(context).apply {
            text = if (isEquipped) "Zdejmij" else "Załóż"
            textSize = 13f
            isAllCaps = false
            setBackgroundResource(if (isEquipped) R.drawable.bg_card_rarity_rare else R.drawable.bg_primary_gradient)
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener {
                if (isEquipped) performUnequip(item.category)
                else performEquip(item)
            }
        }

        card.addView(iconText)
        card.addView(infoLayout)
        card.addView(actionBtn)
        return card
    }

    private fun performEquip(item: ItemRow) {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return
        val cssValue = item.cssValue ?: return

        executor.execute {
            val result = SupabaseRepository.equipItem(token, userId, item.category, cssValue)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        equippedTheme = result.data.toMutableMap()
                        renderInventory()
                        Toast.makeText(context, "Założono: ${item.name}", Toast.LENGTH_SHORT).show()
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd: ${result.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun performUnequip(category: String) {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.unequipItem(token, userId, category)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        equippedTheme = result.data.toMutableMap()
                        renderInventory()
                        Toast.makeText(context, "Zdjęto przedmiot", Toast.LENGTH_SHORT).show()
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd: ${result.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun rarityDrawable(rarity: String): Int = when (rarity.lowercase()) {
        "rare" -> R.drawable.bg_card_rarity_rare
        "epic" -> R.drawable.bg_card_rarity_epic
        "legendary" -> R.drawable.bg_card_rarity_legendary
        else -> R.drawable.bg_card_rarity_common
    }

    private fun rarityColor(rarity: String): Int = when (rarity.lowercase()) {
        "rare" -> Color.parseColor("#3B82F6")
        "epic" -> Color.parseColor("#8B5CF6")
        "legendary" -> Color.parseColor("#F59E0B")
        else -> Color.parseColor("#64748B")
    }

    override fun onDestroyView() {
        super.onDestroyView()
        executor.shutdown()
    }
}
