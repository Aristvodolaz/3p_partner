package com.npp.tsd.feature.movementtasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.MovementTasksRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.MovementTask
import com.npp.tsd.core.network.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MovementTaskViewModel(private val repository: MovementTasksRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<MovementTask>>(UiState.Loading)
    val state: StateFlow<UiState<MovementTask>> = _state.asStateFlow()

    /** ID позиции, которая сейчас сохраняется — чтобы блокировать только её кнопку, а не весь экран. */
    private val _confirmingItemId = MutableStateFlow<Int?>(null)
    val confirmingItemId: StateFlow<Int?> = _confirmingItemId.asStateFlow()

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

    fun confirmItem(itemId: Int, targetAddressCode: String) {
        if (targetAddressCode.isBlank()) {
            _actionError.value = "Укажите адрес зоны обработки (W)"
            return
        }
        viewModelScope.launch {
            _confirmingItemId.value = itemId
            _actionError.value = null
            try {
                repository.confirmItem(taskId, itemId, targetAddressCode.trim())
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось подтвердить перемещение")
            } finally {
                _confirmingItemId.value = null
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
