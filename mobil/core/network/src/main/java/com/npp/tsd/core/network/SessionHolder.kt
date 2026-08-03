package com.npp.tsd.core.network

/**
 * Синхронный in-memory кэш токена сессии — читается интерцептором на каждый
 * запрос без блокировки (DataStore асинхронный, а OkHttp-интерцептор — нет).
 * Источник истины — DataStore (core:data SessionRepository), этот объект —
 * лишь его быстрый снимок, загружаемый один раз при старте приложения.
 */
object SessionHolder {
    @Volatile
    var token: String? = null
}
