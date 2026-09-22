package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.ShipOutgoingDeliveryBody
import com.npp.tsd.core.model.ShipOutgoingDeliveryItemBody

class OutgoingDeliveriesRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getDeliveries(partnerId: Int? = null, status: String? = null) =
        api().getOutgoingDeliveries(partnerId, status).data

    suspend fun getDelivery(id: Int) = api().getOutgoingDelivery(id)

    suspend fun getHistory(id: Int) = api().getOutgoingDeliveryHistory(id)

    suspend fun ship(id: Int, items: List<ShipOutgoingDeliveryItemBody>) =
        api().shipOutgoingDelivery(id, ShipOutgoingDeliveryBody(items))
}
