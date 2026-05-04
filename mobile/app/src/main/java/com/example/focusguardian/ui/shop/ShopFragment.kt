package com.example.focusguardian.ui.shop

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
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.ShopItem
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import java.util.concurrent.Executors

class ShopFragment : Fragment() {

    private lateinit var authManager: AuthManager
    private lateinit var coinsText: TextView
    private lateinit var resultIcon: TextView
    private lateinit var resultText: TextView
    private lateinit var resultCard: com.google.android.material.card.MaterialCardView
    private lateinit var inventoryContainer: LinearLayout
    private lateinit var noInventoryText: TextView

    private val executor = Executors.newSingleThreadExecutor()
    private var currentCoins = 0

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_shop, container, false)

        authManager = AuthManager(requireContext())
        coinsText = root.findViewById(R.id.shop_coins_text)
        resultIcon = root.findViewById(R.id.shop_result_icon)
        resultText = root.findViewById(R.id.shop_result_text)
        resultCard = root.findViewById(R.id.shop_result_card)
        inventoryContainer = root.findViewById(R.id.inventory_container)
        noInventoryText = root.findViewById(R.id.no_inventory_text)

        root.findViewById<Button>(R.id.btn_buy_wood).setOnClickListener { openBox("wood", 500) }
        root.findViewById<Button>(R.id.btn_buy_nature).setOnClickListener { openBox("nature", 1500) }

        loadProfileData()
        loadInventory()

        return root
    }

    private fun loadProfileData() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.getProfile(token, userId)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        currentCoins = result.data.coins
                        coinsText.text = "Twoje monety: $currentCoins 🟡"
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd ładowania monet", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun loadInventory() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.getInventory(token, userId)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> renderInventory(result.data)
                    is RepoResult.Error -> {}
                }
            }
        }
    }

    private fun renderInventory(inventory: List<ShopItem>) {
        inventoryContainer.removeAllViews()
        if (inventory.isEmpty()) {
            inventoryContainer.addView(noInventoryText)
            noInventoryText.visibility = View.VISIBLE
        } else {
            noInventoryText.visibility = View.GONE
            for (item in inventory) {
                inventoryContainer.addView(createInventoryItemView(item))
            }
        }
    }

    private fun createInventoryItemView(item: ShopItem): View {
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            setBackgroundResource(android.R.drawable.dialog_holo_light_frame)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 16, 0) }
            gravity = android.view.Gravity.CENTER
        }
        val icon = TextView(context).apply {
            text = item.icon
            textSize = 48f
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(0, 0, 0, 16)
        }
        val text = TextView(context).apply {
            text = "${item.name}\n${item.rarity.uppercase()}"
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            textSize = 14f
            setTextColor(resources.getColor(android.R.color.black, null))
        }
        layout.addView(icon)
        layout.addView(text)
        return layout
    }

    private fun openBox(boxType: String, cost: Int) {
        if (currentCoins < cost) {
            Toast.makeText(context, "Nie masz wystarczającej ilości monet!", Toast.LENGTH_SHORT).show()
            return
        }
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        resultCard.visibility = View.VISIBLE
        resultIcon.text = "⏳"
        resultText.text = "Otwieranie..."

        executor.execute {
            val result = SupabaseRepository.openBox(token, userId, boxType, cost)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        val r = result.data
                        currentCoins = r.newCoins
                        coinsText.text = "Twoje monety: $currentCoins 🟡"
                        resultIcon.text = r.item.icon
                        val dupText = if (r.isDuplicate) "\n(Duplikat! Zwrot 50%)" else ""
                        resultText.text = "Zdobyto:\n${r.item.name}\n${r.item.rarity.uppercase()}$dupText"
                        loadInventory()
                    }
                    is RepoResult.Error -> {
                        resultIcon.text = "❌"
                        resultText.text = result.message
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        executor.shutdown()
    }
}
