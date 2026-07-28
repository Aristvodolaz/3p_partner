package com.npp.tsd.core.network

import com.npp.tsd.core.model.CreateDocumentBody
import com.npp.tsd.core.model.CreateReceiptBody
import com.npp.tsd.core.model.CreateShipmentBody
import com.npp.tsd.core.model.ExecuteOperationBody
import com.npp.tsd.core.model.ItemExecution
import com.npp.tsd.core.model.MarkShippedBody
import com.npp.tsd.core.model.MoveItemBody
import com.npp.tsd.core.model.PartnerRequest
import com.npp.tsd.core.model.PlaceItemBody
import com.npp.tsd.core.model.Receipt
import com.npp.tsd.core.model.RemoveItemBody
import com.npp.tsd.core.model.RequestDetailed
import com.npp.tsd.core.model.RequestItem
import com.npp.tsd.core.model.RequestsResponse
import com.npp.tsd.core.model.Shipment
import com.npp.tsd.core.model.StorageBalanceByAddress
import com.npp.tsd.core.model.StorageBalanceByArticle
import com.npp.tsd.core.model.StorageMovement
import com.npp.tsd.core.model.UpdateItemFactBody
import com.npp.tsd.core.model.UpdateStatusBody
import com.npp.tsd.core.model.WarehouseDocument
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TsdApi {

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
}
