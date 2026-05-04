package com.example.focusguardian

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.focusguardian.ui.garden.GardenFragment
import com.example.focusguardian.ui.inventory.InventoryFragment
import com.example.focusguardian.ui.profile.ProfileFragment
import com.example.focusguardian.ui.shop.ShopFragment
import com.example.focusguardian.ui.timer.TimerFragment
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navView: BottomNavigationView = findViewById(R.id.bottom_navigation)

        if (savedInstanceState == null) {
            loadFragment(TimerFragment())
        }

        navView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_timer -> { loadFragment(TimerFragment()); true }
                R.id.navigation_garden -> { loadFragment(GardenFragment()); true }
                R.id.navigation_profile -> { loadFragment(ProfileFragment()); true }
                R.id.navigation_inventory -> { loadFragment(InventoryFragment()); true }
                R.id.navigation_shop -> { loadFragment(ShopFragment()); true }
                else -> false
            }
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.nav_host_fragment, fragment)
            .commit()
    }
}