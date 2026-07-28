package com.npp.tsd.feature.storage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
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
}
