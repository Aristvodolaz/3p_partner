package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class InventoryTaskItem(
    val id: Int,
    val taskId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val address: String? = null,
    val expectedQty: Int,
    val countedQty: Int? = null,
    val countedBy: String? = null,
    val countedAt: String? = null,
    val sku: SkuRef? = null,
)

@Serializable
data class InventoryTaskExecutor(
    val id: Int,
    val taskId: Int,
    val employeeId: String,
    val addedAt: String,
)

@Serializable
data class InventoryTask(
    val id: Int,
    val number: String,
    val partnerId: Int? = null,
    val source: String,
    val status: String,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String,
    val partner: PartnerRef? = null,
    val items: List<InventoryTaskItem> = emptyList(),
    val executors: List<InventoryTaskExecutor> = emptyList(),
)

@Serializable
data class InventoryTasksResponse(
    val data: List<InventoryTask>,
    val total: Int,
)

@Serializable
data class CountInventoryItemBody(
    val itemId: Int,
    val countedQty: Int,
)

@Serializable
data class CountInventoryTaskBody(
    val items: List<CountInventoryItemBody>,
)
