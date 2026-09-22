package com.npp.tsd.feature.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.InventoryRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.CountInventoryItemBody
import com.npp.tsd.core.model.InventoryTask
import com.npp.tsd.core.network.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InventoryTaskViewModel(private val repository: InventoryRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<InventoryTask>>(UiState.Loading)
    val state: StateFlow<UiState<InventoryTask>> = _state.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private var taskId = 0

    fun load(id: Int) {
        taskId = id
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            _state.value = UiState.Success(repository.getTask(taskId))
        } catch (e: Exception) {
            _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить задание"))
        }
    }

    fun submitCount(items: List<CountInventoryItemBody>) {
        if (items.isEmpty()) return
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                repository.count(taskId, items)
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось сохранить пересчёт")
            } finally {
                _saving.value = false
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
