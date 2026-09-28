package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

/** I — приёмка, S — хранение, W — обработка, O — отгрузка. */
object ZoneType {
    const val RECEIVING = "I"
    const val STORAGE = "S"
    const val PROCESSING = "W"
    const val SHIPPING = "O"

    fun label(type: String): String = when (type) {
        RECEIVING -> "Приёмка"
        STORAGE -> "Хранение"
        PROCESSING -> "Обработка"
        SHIPPING -> "Отгрузка"
        else -> type
    }
}

@Serializable
data class WarehouseZone(
    val id: Int,
    val code: String,
    val name: String,
    val type: String,
    val warehouseCode: String? = null,
)

@Serializable
data class StorageAddress(
    val id: Int,
    val code: String,
    val zoneId: Int,
    val warehouseCode: String? = null,
    val isActive: Boolean = true,
    val zone: WarehouseZone,
)

@Serializable
data class StorageReportRow(
    val partnerId: Int,
    val partnerName: String,
    val article: String,
    val batchNumber: String? = null,
    val address: String,
    val zoneType: String? = null,
    val quantity: Int,
)
