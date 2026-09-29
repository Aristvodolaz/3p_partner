package com.npp.tsd.core.network

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

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
        return fallback
    }
    // Сбой на уровне соединения (нет Wi-Fi, сервер недоступен, таймаут) —
    // здесь message() это сырой текст вида "failed to connect to /10.x.x.x
    // (port 3032) ... ETIMEDOUT", который ничего не скажет складскому
    // работнику. Показываем понятную причину вместо технического текста.
    if (this is SocketTimeoutException || this is UnknownHostException) {
        return "Сервер не отвечает. Проверьте подключение к Wi-Fi и повторите попытку."
    }
    if (this is IOException) {
        return "Нет соединения с сервером. Проверьте подключение к Wi-Fi и повторите попытку."
    }
    return message ?: fallback
}
