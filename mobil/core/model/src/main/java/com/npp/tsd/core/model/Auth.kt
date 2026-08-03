package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class LoginBody(
    val employeeId: String,
)

@Serializable
data class EmployeeInfo(
    val id: Int,
    val employeeId: String,
    val fullName: String,
    val role: String? = null,
)

@Serializable
data class LoginResponse(
    val token: String,
    val employee: EmployeeInfo,
)
