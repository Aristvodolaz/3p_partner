package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class ReceiptItemBody(
    val requestItemId: Int? = null,
    val article: String,
    val expectedQty: Int,
    val acceptedQty: Int,
    val discrepancyType: String? = null,
    val discrepancyComment: String? = null,
)

@Serializable
data class CreateReceiptBody(
    val requestId: Int,
    val type: String,
    val receivedBy: String,
    val comment: String? = null,
    val items: List<ReceiptItemBody>,
)

@Serializable
data class CreateDocumentBody(val type: String)

@Serializable
data class PlaceItemBody(
    val partnerId: Int,
    val article: String,
    val address: String,
    val quantity: Int,
    val requestItemId: Int? = null,
    val comment: String? = null,
)

@Serializable
data class RemoveItemBody(
    val partnerId: Int,
    val article: String,
    val address: String,
    val quantity: Int,
    val comment: String? = null,
)

@Serializable
data class MoveItemBody(
    val partnerId: Int,
    val article: String,
    val fromAddress: String,
    val toAddress: String,
    val quantity: Int,
    val comment: String? = null,
)

@Serializable
data class ShipmentItemBody(
    val article: String,
    val name: String? = null,
    val quantity: Int,
)

@Serializable
data class CreateShipmentBody(
    val requestId: Int,
    val method: String,
    val vehicleInfo: String? = null,
    val driverName: String? = null,
    val plannedDate: String? = null,
    val comment: String? = null,
    val items: List<ShipmentItemBody>,
)

@Serializable
data class MarkShippedBody(val shippedBy: String)
