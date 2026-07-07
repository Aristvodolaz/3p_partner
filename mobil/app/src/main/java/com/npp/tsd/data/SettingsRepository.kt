package com.npp.tsd.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "tsd_settings")

const val DEFAULT_BASE_URL = "http://10.171.12.36:3032/api/v1/"

class SettingsRepository(private val context: Context) {
    private val baseUrlKey = stringPreferencesKey("base_url")

    val baseUrlFlow: Flow<String> = context.dataStore.data.map { it[baseUrlKey] ?: DEFAULT_BASE_URL }

    suspend fun currentBaseUrl(): String = baseUrlFlow.first()

    suspend fun setBaseUrl(url: String) {
        context.dataStore.edit { it[baseUrlKey] = url }
    }
}
