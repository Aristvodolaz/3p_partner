package com.npp.tsd.data.api

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

/**
 * Повторяет запрос при сетевых сбоях (обрыв Wi-Fi, таймаут соединения) —
 * частая ситуация на складском ТСД. Не трогает обычные HTTP-ошибки
 * (404/500 и т.д.) — повтор того же запроса их не исправит.
 */
class RetryInterceptor(private val maxRetries: Int = 2) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var lastException: IOException? = null

        for (attempt in 0..maxRetries) {
            try {
                return chain.proceed(request)
            } catch (e: IOException) {
                lastException = e
                if (attempt == maxRetries) break
                Thread.sleep(500L * (attempt + 1))
            }
        }
        throw lastException ?: IOException("Не удалось выполнить запрос")
    }
}
