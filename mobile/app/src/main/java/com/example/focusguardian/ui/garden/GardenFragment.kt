package com.example.focusguardian.ui.garden

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
import com.example.focusguardian.api.PlantData
import com.example.focusguardian.api.RepoResult
import com.example.focusguardian.api.SeedData
import com.example.focusguardian.api.SupabaseRepository
import com.example.focusguardian.auth.AuthManager
import java.util.concurrent.Executors

class GardenFragment : Fragment() {

    private lateinit var authManager: AuthManager

    private lateinit var slot1Layout: LinearLayout
    private lateinit var slot1Text: TextView
    private lateinit var slot2Layout: LinearLayout
    private lateinit var slot2Text: TextView
    private lateinit var slot3Layout: LinearLayout
    private lateinit var slot3Text: TextView
    private lateinit var seedsContainer: LinearLayout
    private lateinit var noSeedsText: TextView

    private val executor = Executors.newSingleThreadExecutor()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_garden, container, false)
        authManager = AuthManager(requireContext())

        slot1Layout = root.findViewById(R.id.layout_slot_1)
        slot1Text = root.findViewById(R.id.text_slot_1)
        slot2Layout = root.findViewById(R.id.layout_slot_2)
        slot2Text = root.findViewById(R.id.text_slot_2)
        slot3Layout = root.findViewById(R.id.layout_slot_3)
        slot3Text = root.findViewById(R.id.text_slot_3)
        seedsContainer = root.findViewById(R.id.seeds_container)
        noSeedsText = root.findViewById(R.id.no_seeds_text)

        loadGardenData()
        return root
    }

    private fun loadGardenData() {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.getProfile(token, userId)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        val profile = result.data
                        val plants = SupabaseRepository.getGardenSlots(profile)
                        val seeds = SupabaseRepository.getSeedInventory(profile)
                        displayData(plants, seeds)
                    }
                    is RepoResult.Error -> Toast.makeText(context, "Błąd ładowania ogrodu", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun displayData(plants: List<PlantData>, seeds: List<SeedData>) {
        renderSlot(slot1Layout, slot1Text, plants.getOrNull(0))
        renderSlot(slot2Layout, slot2Text, plants.getOrNull(1))
        renderSlot(slot3Layout, slot3Text, plants.getOrNull(2))

        seedsContainer.removeAllViews()
        if (seeds.isEmpty()) {
            seedsContainer.addView(noSeedsText)
            noSeedsText.visibility = View.VISIBLE
        } else {
            noSeedsText.visibility = View.GONE
            for ((index, seed) in seeds.withIndex()) {
                seedsContainer.addView(createSeedView(seed, index))
            }
        }
    }

    private fun renderSlot(layout: LinearLayout, textView: TextView, plant: PlantData?) {
        layout.removeAllViews()

        if (plant == null) {
            textView.text = "Puste miejsce\nKliknij nasiono poniżej, by zasadzić"
            layout.addView(textView)
        } else {
            val isReady = plant.progress >= plant.target
            val emoji = getPlantEmoji(plant.type, isReady)

            val plantText = TextView(context).apply {
                text = "$emoji\n${plant.name}\n${plant.progress}/${plant.target} sek"
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                textSize = 16f
                setTextColor(resources.getColor(android.R.color.black, null))
            }
            layout.addView(plantText)

            if (isReady && plant.id != null) {
                val sellBtn = Button(context).apply {
                    text = "Sprzedaj (+${plant.value} monet)"
                    setOnClickListener { sellPlant(plant.id) }
                }
                layout.addView(sellBtn)
            }
        }
    }

    private fun createSeedView(seed: SeedData, index: Int): View {
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 16)
            setBackgroundResource(android.R.drawable.dialog_holo_light_frame)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 16, 0) }
        }
        val seedTitle = TextView(context).apply {
            text = "🌱 ${seed.name}\n${seed.rarity.uppercase()}"
            textAlignment = View.TEXT_ALIGNMENT_CENTER
        }
        val plantBtn = Button(context).apply {
            text = "Zasadź"
            setOnClickListener { plantSeed(index) }
        }
        layout.addView(seedTitle)
        layout.addView(plantBtn)
        return layout
    }

    private fun plantSeed(seedIndex: Int) {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.plantSeed(token, userId, seedIndex)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        Toast.makeText(context, "Posadzono nasiono!", Toast.LENGTH_SHORT).show()
                        loadGardenData()
                    }
                    is RepoResult.Error -> Toast.makeText(context, result.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun sellPlant(plantId: String) {
        val token = authManager.getAuthToken() ?: return
        val userId = authManager.getUserId() ?: return

        executor.execute {
            val result = SupabaseRepository.sellPlant(token, userId, plantId)
            activity?.runOnUiThread {
                when (result) {
                    is RepoResult.Success -> {
                        Toast.makeText(context, "Sprzedano! +${result.data} monet", Toast.LENGTH_SHORT).show()
                        loadGardenData()
                    }
                    is RepoResult.Error -> Toast.makeText(context, result.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun getPlantEmoji(type: String, isReady: Boolean): String {
        return if (!isReady) "🌱" else when (type) {
            "oak" -> "🌳"
            "fire" -> "🔥🌺"
            "star" -> "⭐🌿"
            else -> "🌲"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        executor.shutdown()
    }
}
