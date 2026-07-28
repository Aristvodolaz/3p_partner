package com.npp.tsd.feature.documents

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.network.friendlyMessage
import com.npp.tsd.core.model.WarehouseDocument
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DocumentsViewModel(private val warehouseRepo: WarehouseRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<List<WarehouseDocument>>>(UiState.Loading)
    val state: StateFlow<UiState<List<WarehouseDocument>>> = _state.asStateFlow()

    private var requestId = 0

    fun load(requestId: Int) {
        this.requestId = requestId
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                _state.value = UiState.Success(warehouseRepo.getDocuments(requestId))
            } catch (e: Exception) {
                _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить документы"))
            }
        }
    }
}
