package com.npp.tsd.ui.documents

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.data.api.friendlyMessage
import com.npp.tsd.data.model.WarehouseDocument
import com.npp.tsd.data.repo.WarehouseRepository
import com.npp.tsd.ui.common.UiState
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
