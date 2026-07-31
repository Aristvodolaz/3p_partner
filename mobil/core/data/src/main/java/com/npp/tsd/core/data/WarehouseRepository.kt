package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider
import com.npp.tsd.core.model.CreateDocumentBody
import com.npp.tsd.core.model.CreateReceiptBody
import com.npp.tsd.core.model.CreateShipmentBody
import com.npp.tsd.core.model.MarkShippedBody
import com.npp.tsd.core.model.MoveItemBody
import com.npp.tsd.core.model.PlaceItemBody
import com.npp.tsd.core.model.RemoveItemBody

class WarehouseRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    // Приёмка
    suspend fun getReceipts(requestId: Int) = api().getReceipts(requestId)
    suspend fun getReceivingSummary(requestId: Int) = api().getReceivingSummary(requestId)
    suspend fun createReceipt(body: CreateReceiptBody) = api().createReceipt(body)
    suspend fun createReceiptDocument(receiptId: Int, type: String) =
        api().createReceiptDocument(receiptId, CreateDocumentBody(type))

    // Хранение
    suspend fun placeItem(body: PlaceItemBody) = api().placeItem(body)
    suspend fun removeItem(body: RemoveItemBody) = api().removeItem(body)
    suspend fun moveItem(body: MoveItemBody) = api().moveItem(body)
    suspend fun balanceByArticle(partnerId: Int, article: String) =
        api().balanceByArticle(partnerId, article)
    suspend fun balanceByAddress(address: String, partnerId: Int? = null) =
        api().balanceByAddress(address, partnerId)
    suspend fun storageHistory(partnerId: Int? = null, article: String? = null, address: String? = null) =
        api().storageHistory(partnerId, article, address)

    // Отгрузка
    suspend fun getShipments(requestId: Int) = api().getShipments(requestId)
    suspend fun createShipment(body: CreateShipmentBody) = api().createShipment(body)
    suspend fun markShipped(id: Int, shippedBy: String) =
        api().markShipped(id, MarkShippedBody(shippedBy))
    suspend fun createShipmentDocument(shipmentId: Int, type: String) =
        api().createShipmentDocument(shipmentId, CreateDocumentBody(type))

    // Документы
    suspend fun getDocuments(requestId: Int) = api().getDocuments(requestId)
}
