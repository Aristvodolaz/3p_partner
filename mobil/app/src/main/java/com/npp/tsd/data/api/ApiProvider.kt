package com.npp.tsd.data.api

import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/** Кэширует Retrofit-клиент по адресу сервера, чтобы не пересоздавать его на каждый вызов. */
object ApiProvider {
    @OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
    private val cache = mutableMapOf<String, TsdApi>()

    fun get(baseUrl: String): TsdApi = cache.getOrPut(normalize(baseUrl)) { build(normalize(baseUrl)) }

    private fun normalize(url: String): String {
        var u = url.trim()
        if (!u.startsWith("http://") && !u.startsWith("https://")) u = "http://$u"
        if (!u.endsWith("/")) u += "/"
        return u
    }

    private fun build(baseUrl: String): TsdApi {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(TsdApi::class.java)
    }
}
