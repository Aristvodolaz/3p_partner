package com.npp.tsd.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PartnerRef(
    val id: Int,
    val name: String,
)

@Serializable
data class SkuRef(
    val id: Int,
    val article: String,
    val name: String,
)

@Serializable
data class RequestItem(
    val id: Int,
    val requestId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val quantity: Int,
    val factQuantity: Int? = null,
    val actualArticle: String? = null,
    val arrivalDate: String? = null,
    val shipmentDate: String? = null,
    val unitCost: String? = null,
    val totalCost: String? = null,
    val sku: SkuRef? = null,
)

@Serializable
data class PartnerRequest(
    val id: Int,
    val partnerId: Int,
    val number: String,
    val status: String,
    val requestDate: String? = null,
    val comment: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val partner: PartnerRef,
    val items: List<RequestItem> = emptyList(),
)

@Serializable
data class RequestsResponse(
    val data: List<PartnerRequest>,
    val total: Int,
)

@Serializable
data class OperationDto(
    val id: Int,
    val code: String,
    val name: String,
    val description: String? = null,
    val unit: String? = null,
    val tariff: String? = null,
    val applySizeCoef: Boolean = false,
    val sortOrder: Int = 0,
)

@Serializable
data class SkuOperationDetail(
    val id: Int,
    val skuId: Int,
    val operationId: Int,
    val value: String? = null,
    val operation: OperationDto,
)

@Serializable
data class SkuDetail(
    val id: Int,
    val article: String,
    val name: String,
    val sumOfSides: String? = null,
    val specialMarks: String? = null,
    val operations: List<SkuOperationDetail> = emptyList(),
)

@Serializable
data class ItemExecution(
    val id: Int,
    val requestItemId: Int,
    val operationId: Int,
    val done: Boolean = false,
    val factQty: Int? = null,
    val isDefect: Boolean = false,
    val comment: String? = null,
    val executedBy: String? = null,
    val executedAt: String? = null,
    val operation: OperationDto,
)

@Serializable
data class RequestItemDetailed(
    val id: Int,
    val requestId: Int,
    val skuId: Int? = null,
    val article: String,
    val name: String? = null,
    val quantity: Int,
    val factQuantity: Int? = null,
    val actualArticle: String? = null,
    val arrivalDate: String? = null,
    val shipmentDate: String? = null,
    val unitCost: String? = null,
    val totalCost: String? = null,
    val sku: SkuDetail? = null,
    val executions: List<ItemExecution> = emptyList(),
) {
    /** Список операций SKU с текущим состоянием выполнения, если оно есть */
    fun operationsWithState(): List<Pair<SkuOperationDetail, ItemExecution?>> {
        val execByOp = executions.associateBy { it.operationId }
        return sku?.operations?.map { it to execByOp[it.operationId] } ?: emptyList()
    }

    val opsTotal: Int get() = sku?.operations?.size ?: 0
    val opsDone: Int get() = executions.count { it.done }
}

@Serializable
data class RequestDetailed(
    val id: Int,
    val partnerId: Int,
    val number: String,
    val status: String,
    val requestDate: String? = null,
    val comment: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val partner: PartnerRef,
    val items: List<RequestItemDetailed> = emptyList(),
    val progress: Int = 0,
    val totalOps: Int = 0,
    val doneOps: Int = 0,
)

object RequestStatus {
    const val NEW = "Новая"
    const val IN_PROGRESS = "В обработке"
    const val DONE = "Выполнена"
    const val CANCELLED = "Отменена"

    val ALL = listOf(NEW, IN_PROGRESS, DONE, CANCELLED)
}
