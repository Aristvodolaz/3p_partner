package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.ConfirmMovementTaskItemBody

class MovementTasksRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getTasks(partnerId: Int? = null, status: String? = null) =
        api().getMovementTasks(partnerId, status).data

    suspend fun getTask(id: Int) = api().getMovementTask(id)

    suspend fun getHistory(id: Int) = api().getMovementTaskHistory(id)

    suspend fun confirmItem(taskId: Int, itemId: Int, targetAddressCode: String) =
        api().confirmMovementTaskItem(taskId, itemId, ConfirmMovementTaskItemBody(targetAddressCode))

    suspend fun cancel(id: Int) = api().cancelMovementTask(id)
}
