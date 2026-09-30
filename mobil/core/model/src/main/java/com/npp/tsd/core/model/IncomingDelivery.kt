package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class IncomingItemOperation(
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
data class IncomingDeliveryItem(
    val id: Int,
    val deliveryId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val barcode: String? = null,
    val quantity: Int,
    val factQuantity: Int? = null,
    val confirmedQuantity: Int = 0,
    val weight: String? = null,
    val volume: String? = null,
    val sku: SkuRef? = null,
    val operations: List<IncomingItemOperation> = emptyList(),
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
    val addressCode: String? = null,
)

@Serializable
data class ReceiveIncomingDeliveryBody(
    val items: List<ReceiveIncomingDeliveryItemBody>,
)

/** Штучная обработка операций позиции ВХП перед размещением: quantity — добавка, final требует полного количества. */
@Serializable
data class ConfirmIncomingItemBody(
    val quantity: Int,
    val final: Boolean = false,
)
