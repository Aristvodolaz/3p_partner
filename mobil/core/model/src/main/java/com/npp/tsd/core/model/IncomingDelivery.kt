package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class IncomingDeliveryItem(
    val id: Int,
    val deliveryId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val barcode: String? = null,
    val quantity: Int,
    val factQuantity: Int? = null,
    val weight: String? = null,
    val volume: String? = null,
    val sku: SkuRef? = null,
)

@Serializable
data class IncomingDelivery(
    val id: Int,
    val number: String,
    val partnerId: Int,
    val warehouseCode: String? = null,
    val isCrossDock: Boolean = false,
    val status: String,
    val plannedDate: String? = null,
    val actualDate: String? = null,
    val comment: String? = null,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String,
    val partner: PartnerRef,
    val items: List<IncomingDeliveryItem> = emptyList(),
)

@Serializable
data class IncomingDeliveriesResponse(
    val data: List<IncomingDelivery>,
    val total: Int,
)

@Serializable
data class ReceiveIncomingDeliveryItemBody(
    val itemId: Int,
    val factQuantity: Int,
)

@Serializable
data class ReceiveIncomingDeliveryBody(
    val items: List<ReceiveIncomingDeliveryItemBody>,
)
