package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.ExecuteOperationBody
import com.npp.tsd.core.model.ItemExecution
import com.npp.tsd.core.model.PartnerRequest
import com.npp.tsd.core.model.RequestDetailed
import com.npp.tsd.core.model.RequestItem
import com.npp.tsd.core.model.UpdateItemFactBody
import com.npp.tsd.core.model.UpdateStatusBody

class RequestsRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getRequests(status: String? = null, search: String? = null): List<PartnerRequest> =
        api().getRequests(status = status, search = search).data

    suspend fun getRequestDetailed(id: Int): RequestDetailed = api().getRequestDetailed(id)

    suspend fun updateStatus(id: Int, status: String) = api().updateRequestStatus(id, UpdateStatusBody(status))

    suspend fun executeOperation(
        itemId: Int,
        operationId: Int,
        done: Boolean? = null,
        factQty: Int? = null,
        isDefect: Boolean? = null,
        comment: String? = null,
    ): ItemExecution = api().executeOperation(
        itemId,
        operationId,
        ExecuteOperationBody(done = done, factQty = factQty, isDefect = isDefect, comment = comment),
    )

    suspend fun updateItemFact(
        itemId: Int,
        factQuantity: Int? = null,
        actualArticle: String? = null,
    ): RequestItem = api().updateItemFact(itemId, UpdateItemFactBody(factQuantity, actualArticle))
}
