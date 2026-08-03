package com.npp.tsd.core.data

import com.npp.tsd.core.model.EmployeeInfo
import com.npp.tsd.core.model.LoginBody
import com.npp.tsd.core.network.ApiProvider

class AuthRepository(
    private val settings: SettingsRepository,
    private val session: SessionRepository,
) {
    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun login(employeeId: String): EmployeeInfo {
        val response = api().login(LoginBody(employeeId))
        session.save(response.token, response.employee)
        return response.employee
    }

    suspend fun logout() {
        session.clear()
    }

    suspend fun restoreSession() {
        session.restoreIntoHolder()
    }

    suspend fun currentEmployee(): EmployeeInfo? = session.currentSession()?.employee
}
