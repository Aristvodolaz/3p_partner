package com.npp.tsd.core.network

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Ловит 401 от защищённых эндпоинтов (просроченный/невалидный JWT — токен
 * живёт 12 часов, поэтому это рутинная ситуация, а не край) и оповещает
 * приложение через SessionHolder.sessionExpired — AppNav разлогинивает и
 * возвращает на экран входа вместо того, чтобы каждый экран молча падал в
 * generic-ошибку. Не трогает сам /auth/login — там 401 означает "сотрудник
 * не найден", а не "сессия истекла", и пользователь и так уже на экране входа.
 */
class SessionExpiryInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        if (response.code == 401 && !response.request.url.encodedPath.endsWith("/auth/login")) {
            SessionHolder.notifySessionExpired()
        }
        return response
    }
}
