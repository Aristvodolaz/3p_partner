package com.npp.tsd.feature.requests.packing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.AddPackingUnitItemBody
import com.npp.tsd.core.model.CreatePackingUnitBody
import com.npp.tsd.core.model.PackingUnit
import com.npp.tsd.core.model.UpdatePackingUnitBody
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class PackingScreenData(
    val article: String,
    val allowMixedBox: Boolean,
    val units: List<PackingUnit>,
)

class PackingViewModel(
    private val warehouseRepository: WarehouseRepository,
    private val requestsRepository: RequestsRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<UiState<PackingScreenData>>(UiState.Loading)
    val state: StateFlow<UiState<PackingScreenData>> = _state

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError

    private var requestId: Int = 0
    private var itemId: Int = 0

    fun load(requestId: Int, itemId: Int) {
        this.requestId = requestId
        this.itemId = itemId
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                _state.value = UiState.Success(fetchData())
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Не удалось загрузить упаковку")
            }
        }
    }

    private suspend fun fetchData(): PackingScreenData {
        val detailed = requestsRepository.getRequestDetailed(requestId)
        val item = detailed.items.first { it.id == itemId }
        val units = warehouseRepository.getPackingUnits(requestId)
        return PackingScreenData(
            article = item.article,
            allowMixedBox = item.sku?.allowMixedBox ?: false,
            units = units,
        )
    }

    private fun refresh() = viewModelScope.launch {
        try {
            _state.value = UiState.Success(fetchData())
        } catch (e: Exception) {
            _actionError.value = e.message
        }
    }

    fun createUnit(
        requestItemId: Int,
        type: String,
        code: String?,
        expiryDate: String?,
        nestingQty: Int?,
    ) = runAction {
        warehouseRepository.createPackingUnit(
            CreatePackingUnitBody(requestItemId, type, code, expiryDate, nestingQty),
        )
    }

    fun addItem(unitId: Int, requestItemId: Int, article: String, quantity: Int) = runAction {
        warehouseRepository.addPackingUnitItem(
            unitId,
            AddPackingUnitItemBody(requestItemId, article, quantity),
        )
    }

    fun complete(unitId: Int) = runAction {
        warehouseRepository.updatePackingUnit(unitId, UpdatePackingUnitBody(status = "COMPLETED"))
    }

    fun bindParent(boxId: Int, parentPalletId: Int) = runAction {
        warehouseRepository.bindPackingUnitParent(boxId, parentPalletId)
    }

    fun clearError() {
        _actionError.value = null
    }

    private fun runAction(block: suspend () -> Unit) {
        viewModelScope.launch {
            _saving.value = true
            try {
                block()
                refresh().join()
            } catch (e: Exception) {
                _actionError.value = e.message ?: "Не удалось выполнить действие"
            } finally {
                _saving.value = false
            }
        }
    }
}
