package com.npp.tsd.feature.receiving

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.network.friendlyMessage
import com.npp.tsd.core.model.CreateReceiptBody
import com.npp.tsd.core.model.Receipt
import com.npp.tsd.core.model.ReceiptItemBody
import com.npp.tsd.core.model.RequestDetailed
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReceivingViewModel(
    private val requestsRepo: RequestsRepository,
    private val warehouseRepo: WarehouseRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<UiState<RequestDetailed>>(UiState.Loading)
    val state: StateFlow<UiState<RequestDetailed>> = _state.asStateFlow()

    private val _receipts = MutableStateFlow<List<Receipt>>(emptyList())
    val receipts: StateFlow<List<Receipt>> = _receipts.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private var requestId = 0

    fun load(requestId: Int) {
        this.requestId = requestId
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            _state.value = UiState.Success(requestsRepo.getRequestDetailed(requestId))
            _receipts.value = warehouseRepo.getReceipts(requestId)
        } catch (e: Exception) {
            _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить данные"))
        }
    }

    fun submitReceipt(type: String, receivedBy: String, items: List<ReceiptItemBody>) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.createReceipt(
                    CreateReceiptBody(requestId, type, receivedBy, null, items),
                )
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось оформить приёмку")
            } finally {
                _saving.value = false
            }
        }
    }

    fun generateDocument(receiptId: Int, type: String) {
        viewModelScope.launch {
            _actionError.value = null
            try {
                warehouseRepo.createReceiptDocument(receiptId, type)
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось сформировать документ")
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
