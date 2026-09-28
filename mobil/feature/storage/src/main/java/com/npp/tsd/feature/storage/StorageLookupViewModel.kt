package com.npp.tsd.feature.storage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.MoveItemBody
import com.npp.tsd.core.model.StorageBalanceByArticle
import com.npp.tsd.core.model.StorageMovement
import com.npp.tsd.core.network.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class StorageLookupViewModel(private val warehouseRepository: WarehouseRepository) : ViewModel() {

    private val _address = MutableStateFlow("")
    val address: StateFlow<String> = _address.asStateFlow()

    private val _balanceState = MutableStateFlow<UiState<List<StorageBalanceByArticle>>>(UiState.Success(emptyList()))
    val balanceState: StateFlow<UiState<List<StorageBalanceByArticle>>> = _balanceState.asStateFlow()

    private val _history = MutableStateFlow<List<StorageMovement>>(emptyList())
    val history: StateFlow<List<StorageMovement>> = _history.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    init {
        loadHistory()
    }

    fun setAddress(value: String) {
        _address.value = value
    }

    fun search() {
        val addr = _address.value.trim()
        if (addr.isEmpty()) return
        viewModelScope.launch {
            _balanceState.value = UiState.Loading
            try {
                _balanceState.value = UiState.Success(warehouseRepository.balanceByAddress(addr))
            } catch (e: Exception) {
                _balanceState.value = UiState.Error(e.friendlyMessage("Не удалось загрузить остатки"))
            }
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            try {
                _history.value = warehouseRepository.storageHistory()
            } catch (_: Exception) {
                // история — вспомогательная лента, ошибку молча игнорируем при неудаче
            }
        }
    }

    /** Перемещение с текущего искомого адреса на другой — например, из зоны приёмки в хранение. */
    fun move(partnerId: Int, article: String, toAddress: String, quantity: Int) {
        val fromAddress = _address.value.trim()
        if (fromAddress.isEmpty()) return
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepository.moveItem(MoveItemBody(partnerId, article, fromAddress, toAddress, quantity))
                search()
                loadHistory()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось переместить товар")
            } finally {
                _saving.value = false
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
