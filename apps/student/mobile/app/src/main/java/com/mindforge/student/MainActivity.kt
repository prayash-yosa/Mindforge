package com.mindforge.student

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * Loads the Mindforge Student web app in a WebView.
 *
 * Emulator: uses 10.0.2.2 (host machine). Ensure backend and Vite are running:
 *   - Backend: cd backend && npm run start:dev  (port 3000)
 *   - Client:  cd client && npm run dev        (port 5173)
 *
 * Physical device: change BASE_URL to your computer's LAN IP, e.g. http://192.168.1.5:5173
 */
@SuppressLint("SetJavaScriptEnabled")
class MainActivity : AppCompatActivity() {

    companion object {
        /** Emulator: 10.0.2.2 is the host machine. For physical device use your PC's IP (e.g. http://192.168.1.5:5173) */
        private const val BASE_URL = "http://10.0.2.2:5173/"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.webview)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.loadUrl(BASE_URL)
    }
}
