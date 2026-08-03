package com.npp.tsd.core.network

import okhttp3.Interceptor
import okhttp3.Response

/** Добавляет заголовок Authorization из текущей сессии, если пользователь вошёл. */
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = SessionHolder.token
        val request = chain.request()
        return if (token != null) {
            chain.proceed(request.newBuilder().addHeader("Authorization", "Bearer $token").build())
        } else {
            chain.proceed(request)
        }
    }
}
