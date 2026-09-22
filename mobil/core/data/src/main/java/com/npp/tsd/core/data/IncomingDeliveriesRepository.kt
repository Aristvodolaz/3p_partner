package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.ReceiveIncomingDeliveryBody
import com.npp.tsd.core.model.ReceiveIncomingDeliveryItemBody

class IncomingDeliveriesRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getDeliveries(partnerId: Int? = null, status: String? = null) =
        api().getIncomingDeliveries(partnerId, status).data

    suspend fun getDelivery(id: Int) = api().getIncomingDelivery(id)

    suspend fun getHistory(id: Int) = api().getIncomingDeliveryHistory(id)

    suspend fun receive(id: Int, items: List<ReceiveIncomingDeliveryItemBody>) =
        api().receiveIncomingDelivery(id, ReceiveIncomingDeliveryBody(items))
}
