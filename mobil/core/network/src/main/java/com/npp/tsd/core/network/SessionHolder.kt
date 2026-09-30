package com.npp.tsd.core.network

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Синхронный in-memory кэш токена сессии — читается интерцептором на каждый
 * запрос без блокировки (DataStore асинхронный, а OkHttp-интерцептор — нет).
 * Источник истины — DataStore (core:data SessionRepository), этот объект —
 * лишь его быстрый снимок, загружаемый один раз при старте приложения.
 */
object SessionHolder {
    @Volatile
    var token: String? = null

    private val _sessionExpired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

    /** Сигнал "сервер ответил 401" — экран логина слушает и разлогинивает. */
    val sessionExpired: SharedFlow<Unit> = _sessionExpired.asSharedFlow()

    fun notifySessionExpired() {
        token = null
        _sessionExpired.tryEmit(Unit)
    }
}
