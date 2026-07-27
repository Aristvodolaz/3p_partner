package com.npp.tsd.data.api

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException

private val errorJson = Json { ignoreUnknownKeys = true }

/** Достаёт человекочитаемое сообщение об ошибке из ответа backend (NestJS-исключения). */
fun Throwable.friendlyMessage(fallback: String = "Не удалось выполнить операцию"): String {
    if (this is HttpException) {
        val body = try {
            response()?.errorBody()?.string()
        } catch (_: Exception) {
            null
        }
        if (!body.isNullOrBlank()) {
            try {
                val obj = errorJson.parseToJsonElement(body).jsonObject
                val msgElement = obj["message"] ?: return fallback
                return if (msgElement is JsonArray) {
                    msgElement.joinToString("; ") { it.jsonPrimitive.content }
                } else {
                    msgElement.jsonPrimitive.content
                }
            } catch (_: Exception) {
                // тело не JSON — используем fallback
            }
        }
    }
    return message ?: fallback
}
