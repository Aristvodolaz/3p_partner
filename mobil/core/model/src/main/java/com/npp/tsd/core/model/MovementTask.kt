package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class MovementTaskItem(
    val id: Int,
    val taskId: Int,
    val article: String,
    val name: String? = null,
    val skuId: Int? = null,
    val outgoingDeliveryItemId: Int? = null,
    val sourceAddressId: Int? = null,
    val incomingDeliveryItemId: Int? = null,
    val targetAddressId: Int? = null,
    val quantity: Int,
    val status: String,
    val confirmedBy: String? = null,
    val confirmedAt: String? = null,
)

@Serializable
data class MovementTask(
    val id: Int,
    val number: String,
    val outgoingDeliveryId: Int? = null,
    val partnerId: Int,
    val status: String,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String,
    val items: List<MovementTaskItem> = emptyList(),
)

@Serializable
data class MovementTasksResponse(
    val data: List<MovementTask>,
    val total: Int,
)

@Serializable
data class ConfirmMovementTaskItemBody(
    val targetAddressCode: String,
)
