package com.npp.tsd.data.repo

import com.npp.tsd.data.SettingsRepository
import com.npp.tsd.data.api.ApiProvider
import com.npp.tsd.data.model.CreateDocumentBody
import com.npp.tsd.data.model.CreateReceiptBody
import com.npp.tsd.data.model.CreateShipmentBody
import com.npp.tsd.data.model.MarkShippedBody
import com.npp.tsd.data.model.MoveItemBody
import com.npp.tsd.data.model.PlaceItemBody
import com.npp.tsd.data.model.RemoveItemBody

class WarehouseRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    // Приёмка
    suspend fun getReceipts(requestId: Int) = api().getReceipts(requestId)
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
