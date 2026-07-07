package com.npp.tsd.data.api

import com.npp.tsd.data.model.ExecuteOperationBody
import com.npp.tsd.data.model.ItemExecution
import com.npp.tsd.data.model.PartnerRequest
import com.npp.tsd.data.model.RequestDetailed
import com.npp.tsd.data.model.RequestItem
import com.npp.tsd.data.model.RequestsResponse
import com.npp.tsd.data.model.UpdateItemFactBody
import com.npp.tsd.data.model.UpdateStatusBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
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
}
