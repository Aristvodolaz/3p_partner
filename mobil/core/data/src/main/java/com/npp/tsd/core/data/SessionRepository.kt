package com.npp.tsd.core.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.npp.tsd.core.model.EmployeeInfo
import com.npp.tsd.core.network.SessionHolder
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

data class Session(val token: String, val employee: EmployeeInfo)

class SessionRepository(private val context: Context) {
    private val tokenKey = stringPreferencesKey("session_token")
    private val employeeIdKey = intPreferencesKey("session_employee_id")
    private val employeeCodeKey = stringPreferencesKey("session_employee_code")
    private val fullNameKey = stringPreferencesKey("session_full_name")
    private val roleKey = stringPreferencesKey("session_role")

    val sessionFlow: Flow<Session?> = context.dataStore.data.map { prefs ->
        val token = prefs[tokenKey] ?: return@map null
        val id = prefs[employeeIdKey] ?: return@map null
        val code = prefs[employeeCodeKey] ?: return@map null
        val fullName = prefs[fullNameKey] ?: return@map null
        Session(token, EmployeeInfo(id, code, fullName, prefs[roleKey]))
    }

    suspend fun currentSession(): Session? = sessionFlow.first()

    /** Загружает токен в синхронный кэш при старте приложения — вызывать один раз. */
    suspend fun restoreIntoHolder() {
        SessionHolder.token = currentSession()?.token
    }

    suspend fun save(token: String, employee: EmployeeInfo) {
        context.dataStore.edit { prefs ->
            prefs[tokenKey] = token
            prefs[employeeIdKey] = employee.id
            prefs[employeeCodeKey] = employee.employeeId
            prefs[fullNameKey] = employee.fullName
            val role = employee.role
            if (role != null) prefs[roleKey] = role else prefs.remove(roleKey)
        }
        SessionHolder.token = token
    }

    suspend fun clear() {
        context.dataStore.edit { prefs ->
            prefs.remove(tokenKey)
            prefs.remove(employeeIdKey)
            prefs.remove(employeeCodeKey)
            prefs.remove(fullNameKey)
            prefs.remove(roleKey)
        }
        SessionHolder.token = null
    }
}
