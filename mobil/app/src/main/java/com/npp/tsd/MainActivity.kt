package com.npp.tsd

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.npp.tsd.core.designsystem.theme.TsdTheme
import com.npp.tsd.ui.AppNav

class MainActivity : ComponentActivity() {

    private lateinit var container: AppContainer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        container = AppContainer(this)

        setContent {
            TsdTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppNav(container)
                }
            }
        }
    }
}
