package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

// --- Приёмка ---

@Serializable
data class ReceiptItem(
    val id: Int,
    val receiptId: Int,
    val requestItemId: Int? = null,
    val article: String,
    val expectedQty: Int,
    val acceptedQty: Int,
    val discrepancyType: String? = null,
    val discrepancyComment: String? = null,
)

/**
 * Сводка по позиции заявки: сколько заявлено, сколько уже принято
 * (по всем прошлым приёмкам) и сколько осталось. Используется, чтобы не
 * показывать и не позволять повторно принимать уже полностью принятые
 * позиции — сервер и так это отклонит, но UI не должен вводить в заблуждение.
 */
@Serializable
data class ReceivingSummaryItem(
    val requestItemId: Int,
    val article: String,
    val name: String? = null,
    val expectedQty: Int,
    val receivedQty: Int,
    val remainingQty: Int,
    val fullyReceived: Boolean,
)

@Serializable
data class Receipt(
    val id: Int,
    val requestId: Int,
    val type: String,
    val isPartial: Boolean,
    val receivedBy: String,
    val comment: String? = null,
    val createdAt: String,
    val items: List<ReceiptItem> = emptyList(),
)

object ReceiptType {
    const val PALLET = "PALLET"
    const val BOX = "BOX"
    const val UNIT = "UNIT"
    val ALL = listOf(PALLET, BOX, UNIT)
    fun label(code: String) = when (code) {
        PALLET -> "Паллетная"
        BOX -> "Коробочная"
        UNIT -> "Поштучная"
        else -> code
    }
}

object DiscrepancyType {
    const val QUALITY = "QUALITY"
    const val NAME = "NAME"
    const val QUANTITY = "QUANTITY"
    const val PACKAGING = "PACKAGING"
    const val DEFECT = "DEFECT"
    val ALL = listOf(QUALITY, NAME, QUANTITY, PACKAGING, DEFECT)
    fun label(code: String) = when (code) {
        QUALITY -> "Качество"
        NAME -> "Наименование"
        QUANTITY -> "Количество"
        PACKAGING -> "Упаковка"
        DEFECT -> "Дефект"
        else -> code
    }
}

// --- Хранение ---

@Serializable
data class StorageBalanceByAddress(val address: String, val quantity: Int)

@Serializable
data class StorageBalanceByArticle(val article: String, val partnerId: Int, val quantity: Int)

@Serializable
data class StorageMovement(
    val id: Int,
    val partnerId: Int,
    val article: String,
    val requestItemId: Int? = null,
    val address: String,
    val quantity: Int,
    val type: String,
    val comment: String? = null,
    val createdBy: String,
    val createdAt: String,
)

object MovementType {
    fun label(code: String) = when (code) {
        "PLACE" -> "Размещение"
        "REMOVE" -> "Списание"
        "MOVE_OUT" -> "Перемещение (откуда)"
        "MOVE_IN" -> "Перемещение (куда)"
        else -> code
    }
}

// --- Отгрузка ---

@Serializable
data class ShipmentItem(
    val id: Int,
    val shipmentId: Int,
    val article: String,
    val name: String? = null,
    val quantity: Int,
)

@Serializable
data class Shipment(
    val id: Int,
    val requestId: Int,
    val method: String,
    val vehicleInfo: String? = null,
    val driverName: String? = null,
    val plannedDate: String? = null,
    val shippedAt: String? = null,
    val shippedBy: String? = null,
    val comment: String? = null,
    val createdAt: String,
    val items: List<ShipmentItem> = emptyList(),
)

object ShipmentMethod {
    const val SELF = "SELF"
    const val PARTNER = "PARTNER"
    val ALL = listOf(SELF, PARTNER)
    fun label(code: String) = when (code) {
        SELF -> "Собственными силами"
        PARTNER -> "Силами партнёра"
        else -> code
    }
}

// --- Обработка: паллеты и короба ---

@Serializable
data class PackingUnitItem(
    val id: Int,
    val packingUnitId: Int,
    val requestItemId: Int,
    val article: String,
    val quantity: Int,
    val isDefect: Boolean = false,
    val comment: String? = null,
)

@Serializable
data class PackingUnit(
    val id: Int,
    val requestItemId: Int,
    val type: String,
    val code: String,
    val parentPalletId: Int? = null,
    val expiryDate: String? = null,
    val nestingQty: Int? = null,
    val status: String,
    val createdBy: String,
    val createdAt: String,
    val completedAt: String? = null,
    val items: List<PackingUnitItem> = emptyList(),
    val boxes: List<PackingUnit> = emptyList(),
)

object PackingUnitType {
    const val BOX = "BOX"
    const val PALLET = "PALLET"
    val ALL = listOf(PALLET, BOX)
    fun label(code: String) = when (code) {
        PALLET -> "Паллета"
        BOX -> "Короб"
        else -> code
    }
}

// --- Документы ---

@Serializable
data class WarehouseDocument(
    val id: Int,
    val requestId: Int,
    val type: String,
    val number: String,
    val createdBy: String,
    val createdAt: String,
)

object DocumentType {
    const val MX1 = "MX1"
    const val TORG2 = "TORG2"
    const val TTN = "TTN"
    const val MX3 = "MX3"
    fun label(code: String) = when (code) {
        MX1 -> "МХ-1"
        TORG2 -> "ТОРГ-2"
        TTN -> "ТТН"
        MX3 -> "МХ-3"
        else -> code
    }
}
