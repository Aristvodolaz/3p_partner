package com.npp.tsd

import android.content.Context
import com.npp.tsd.data.SettingsRepository
import com.npp.tsd.data.repo.RequestsRepository

/** Простой ручной DI-контейнер: один экземпляр на приложение. */
class AppContainer(context: Context) {
    val settingsRepository = SettingsRepository(context.applicationContext)
    val requestsRepository = RequestsRepository(settingsRepository)
}
