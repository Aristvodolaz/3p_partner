package com.npp.tsd.core.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/** Юнит-тесты friendlyMessage — человекочитаемые ошибки для ТСД. */
class ApiErrorTest {

    private fun httpError(code: Int, body: String): HttpException {
        val rb = body.toResponseBody("application/json".toMediaType())
        return HttpException(Response.error<Any>(code, rb))
    }

    @Test
    fun `достаёт строковое поле message из ответа NestJS`() {
        val e = httpError(409, """{"message":"Позиция уже отгружена","error":"Conflict"}""")
        assertEquals("Позиция уже отгружена", e.friendlyMessage())
    }

    @Test
    fun `склеивает message-массив ошибок валидации через точку с запятой`() {
        val e = httpError(400, """{"message":["article обязателен","quantity >= 1"]}""")
        assertEquals("article обязателен; quantity >= 1", e.friendlyMessage())
    }

    @Test
    fun `fallback, если тело не JSON`() {
        val e = httpError(500, "Internal Server Error")
        assertEquals("своя подсказка", e.friendlyMessage("своя подсказка"))
    }

    @Test
    fun `таймаут и неизвестный хост — подсказка про Wi-Fi`() {
        assertTrue(SocketTimeoutException().friendlyMessage().contains("Wi-Fi"))
        assertTrue(UnknownHostException().friendlyMessage().contains("Wi-Fi"))
    }

    @Test
    fun `прочий IOException — нет соединения`() {
        assertTrue(IOException("boom").friendlyMessage().contains("Нет соединения"))
    }

    @Test
    fun `обычное исключение отдаёт свой message`() {
        assertEquals("кастомная ошибка", RuntimeException("кастомная ошибка").friendlyMessage())
    }
}
