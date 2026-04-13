package com.example.focusguardian.ui.garden

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.example.focusguardian.R

class GardenFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val root = inflater.inflate(R.layout.fragment_garden, container, false)
        val title = root.findViewById<TextView>(R.id.garden_title)
        title.text = "Twój Ogród"
        return root
    }
}
