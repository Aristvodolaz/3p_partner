package com.npp.tsd.core.network

import com.npp.tsd.core.model.AddPackingUnitItemBody
import com.npp.tsd.core.model.BindParentPalletBody
import com.npp.tsd.core.model.CreateDocumentBody
import com.npp.tsd.core.model.CreatePackingUnitBody
import com.npp.tsd.core.model.CreateReceiptBody
import com.npp.tsd.core.model.CreateShipmentBody
import com.npp.tsd.core.model.CountInventoryTaskBody
import com.npp.tsd.core.model.ExecuteOperationBody
import com.npp.tsd.core.model.IncomingDelivery
import com.npp.tsd.core.model.IncomingDeliveriesResponse
import com.npp.tsd.core.model.InventoryTask
import com.npp.tsd.core.model.InventoryTasksResponse
import com.npp.tsd.core.model.ItemExecution
import com.npp.tsd.core.model.LoginBody
import com.npp.tsd.core.model.LoginResponse
import com.npp.tsd.core.model.MarkShippedBody
import com.npp.tsd.core.model.MoveItemBody
import com.npp.tsd.core.model.OutgoingDelivery
import com.npp.tsd.core.model.OutgoingDeliveriesResponse
import com.npp.tsd.core.model.PartnerRequest
import com.npp.tsd.core.model.PlaceItemBody
import com.npp.tsd.core.model.Receipt
import com.npp.tsd.core.model.ReceiveIncomingDeliveryBody
import com.npp.tsd.core.model.ReceivingSummaryItem
import com.npp.tsd.core.model.PackingUnit
import com.npp.tsd.core.model.RemoveItemBody
import com.npp.tsd.core.model.RequestDetailed
import com.npp.tsd.core.model.RequestItem
import com.npp.tsd.core.model.RequestsResponse
import com.npp.tsd.core.model.Shipment
import com.npp.tsd.core.model.ShipOutgoingDeliveryBody
import com.npp.tsd.core.model.StatusChangeEntry
import com.npp.tsd.core.model.StorageBalanceByAddress
import com.npp.tsd.core.model.StorageBalanceByArticle
import com.npp.tsd.core.model.StorageMovement
import com.npp.tsd.core.model.UpdateItemFactBody
import com.npp.tsd.core.model.UpdatePackingUnitBody
import com.npp.tsd.core.model.UpdateStatusBody
import com.npp.tsd.core.model.WarehouseDocument
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TsdApi {

    @POST("auth/login")
    suspend fun login(@Body body: LoginBody): LoginResponse

    @GET("requests")
    suspend fun getRequests(
        @Query("partnerId") partnerId: Int? = null,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
    ): RequestsResponse

    @GET("requests/{id}/detailed")
    suspend fun getRequestDetailed(@Path("id") id: Int): RequestDetailed

    @PATCH("requests/{id}")
    suspend fun updateRequestStatus(
        @Path("id") id: Int,
        @Body body: UpdateStatusBody,
    ): PartnerRequest

    @PATCH("requests/items/{itemId}/operations/{operationId}")
    suspend fun executeOperation(
        @Path("itemId") itemId: Int,
        @Path("operationId") operationId: Int,
        @Body body: ExecuteOperationBody,
    ): ItemExecution

    @PATCH("requests/items/{itemId}/fact")
    suspend fun updateItemFact(
        @Path("itemId") itemId: Int,
        @Body body: UpdateItemFactBody,
    ): RequestItem

    // --- Приёмка ---

    @GET("receiving")
    suspend fun getReceipts(@Query("requestId") requestId: Int): List<Receipt>

    @GET("receiving/summary")
    suspend fun getReceivingSummary(@Query("requestId") requestId: Int): List<ReceivingSummaryItem>

    @POST("receiving")
    suspend fun createReceipt(@Body body: CreateReceiptBody): Receipt

    @POST("receiving/{id}/documents")
    suspend fun createReceiptDocument(
        @Path("id") id: Int,
        @Body body: CreateDocumentBody,
    ): WarehouseDocument

    // --- Хранение ---

    @POST("storage/place")
    suspend fun placeItem(@Body body: PlaceItemBody): List<StorageBalanceByAddress>

    @POST("storage/remove")
    suspend fun removeItem(@Body body: RemoveItemBody): List<StorageBalanceByAddress>

    @POST("storage/move")
    suspend fun moveItem(@Body body: MoveItemBody): List<StorageBalanceByAddress>

    @GET("storage/balance/by-article")
    suspend fun balanceByArticle(
        @Query("partnerId") partnerId: Int,
        @Query("article") article: String,
    ): List<StorageBalanceByAddress>

    @GET("storage/balance/by-address")
    suspend fun balanceByAddress(
        @Query("address") address: String,
        @Query("partnerId") partnerId: Int? = null,
    ): List<StorageBalanceByArticle>

    @GET("storage/history")
    suspend fun storageHistory(
        @Query("partnerId") partnerId: Int? = null,
        @Query("article") article: String? = null,
        @Query("address") address: String? = null,
    ): List<StorageMovement>

    // --- Отгрузка ---

    @GET("shipping")
    suspend fun getShipments(@Query("requestId") requestId: Int): List<Shipment>

    @POST("shipping")
    suspend fun createShipment(@Body body: CreateShipmentBody): Shipment

    @PATCH("shipping/{id}/ship")
    suspend fun markShipped(
        @Path("id") id: Int,
        @Body body: MarkShippedBody,
    ): Shipment

    @POST("shipping/{id}/documents")
    suspend fun createShipmentDocument(
        @Path("id") id: Int,
        @Body body: CreateDocumentBody,
    ): WarehouseDocument

    // --- Документы ---

    @GET("documents")
    suspend fun getDocuments(@Query("requestId") requestId: Int): List<WarehouseDocument>

    // --- Обработка: паллеты и короба ---

    @GET("packing/units")
    suspend fun getPackingUnits(@Query("requestId") requestId: Int): List<PackingUnit>

    @POST("packing/units")
    suspend fun createPackingUnit(@Body body: CreatePackingUnitBody): PackingUnit

    @POST("packing/units/{id}/items")
    suspend fun addPackingUnitItem(
        @Path("id") id: Int,
        @Body body: AddPackingUnitItemBody,
    ): PackingUnit

    @PATCH("packing/units/{id}")
    suspend fun updatePackingUnit(
        @Path("id") id: Int,
        @Body body: UpdatePackingUnitBody,
    ): PackingUnit

    @PATCH("packing/units/{id}/bind-parent")
    suspend fun bindPackingUnitParent(
        @Path("id") id: Int,
        @Body body: BindParentPalletBody,
    ): PackingUnit

    // --- ВХП ---

    @GET("incoming-deliveries")
    suspend fun getIncomingDeliveries(
        @Query("partnerId") partnerId: Int? = null,
        @Query("status") status: String? = null,
    ): IncomingDeliveriesResponse

    @GET("incoming-deliveries/{id}")
    suspend fun getIncomingDelivery(@Path("id") id: Int): IncomingDelivery

    @GET("incoming-deliveries/{id}/history")
    suspend fun getIncomingDeliveryHistory(@Path("id") id: Int): List<StatusChangeEntry>

    @POST("incoming-deliveries/{id}/receive")
    suspend fun receiveIncomingDelivery(
        @Path("id") id: Int,
        @Body body: ReceiveIncomingDeliveryBody,
    ): IncomingDelivery

    // --- ИСП ---

    @GET("outgoing-deliveries")
    suspend fun getOutgoingDeliveries(
        @Query("partnerId") partnerId: Int? = null,
        @Query("status") status: String? = null,
    ): OutgoingDeliveriesResponse

    @GET("outgoing-deliveries/{id}")
    suspend fun getOutgoingDelivery(@Path("id") id: Int): OutgoingDelivery

    @GET("outgoing-deliveries/{id}/history")
    suspend fun getOutgoingDeliveryHistory(@Path("id") id: Int): List<StatusChangeEntry>

    @POST("outgoing-deliveries/{id}/ship")
    suspend fun shipOutgoingDelivery(
        @Path("id") id: Int,
        @Body body: ShipOutgoingDeliveryBody,
    ): OutgoingDelivery

    // --- Инвентаризация ---

    @GET("inventory")
    suspend fun getInventoryTasks(
        @Query("partnerId") partnerId: Int? = null,
        @Query("status") status: String? = null,
    ): InventoryTasksResponse

    @GET("inventory/{id}")
    suspend fun getInventoryTask(@Path("id") id: Int): InventoryTask

    @GET("inventory/{id}/history")
    suspend fun getInventoryTaskHistory(@Path("id") id: Int): List<StatusChangeEntry>

    @POST("inventory/{id}/count")
    suspend fun countInventoryTask(
        @Path("id") id: Int,
        @Body body: CountInventoryTaskBody,
    ): InventoryTask
}
