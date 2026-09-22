package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.CountInventoryItemBody
import com.npp.tsd.core.model.CountInventoryTaskBody

class InventoryRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getTasks(partnerId: Int? = null, status: String? = null) =
        api().getInventoryTasks(partnerId, status).data

    suspend fun getTask(id: Int) = api().getInventoryTask(id)

    suspend fun getHistory(id: Int) = api().getInventoryTaskHistory(id)

    suspend fun count(id: Int, items: List<CountInventoryItemBody>) =
        api().countInventoryTask(id, CountInventoryTaskBody(items))
}
