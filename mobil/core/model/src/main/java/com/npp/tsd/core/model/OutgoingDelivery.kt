package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class OutgoingItemOperation(
    val id: Int,
    val itemId: Int,
    val operationId: Int,
    val value: String? = null,
    val done: Boolean = false,
    val factQty: Int? = null,
    val executedBy: String? = null,
    val executedAt: String? = null,
    val operation: OperationDto,
)

@Serializable
data class OutgoingDeliveryItem(
    val id: Int,
    val deliveryId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val quantity: Int,
    val factQuantity: Int? = null,
    val weight: String? = null,
    val volume: String? = null,
    val unitCost: String? = null,
    val totalCost: String? = null,
    val sku: SkuRef? = null,
    val operations: List<OutgoingItemOperation> = emptyList(),
)

@Serializable
data class OutgoingDelivery(
    val id: Int,
    val number: String,
    val partnerId: Int,
    val warehouseCode: String? = null,
    val isCrossDock: Boolean = false,
    val sourceIncomingDeliveryId: Int? = null,
    val status: String,
    val shipDate: String? = null,
    val actualDate: String? = null,
    val comment: String? = null,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String,
    val partner: PartnerRef,
    val items: List<OutgoingDeliveryItem> = emptyList(),
)

@Serializable
data class OutgoingDeliveriesResponse(
    val data: List<OutgoingDelivery>,
    val total: Int,
)

@Serializable
data class ShipOutgoingDeliveryItemBody(
    val itemId: Int,
    val factQuantity: Int,
)

@Serializable
data class ShipOutgoingDeliveryBody(
    val items: List<ShipOutgoingDeliveryItemBody>,
)
