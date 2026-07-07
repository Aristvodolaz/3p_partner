package com.npp.tsd.ui.requestdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.data.model.RequestDetailed
import com.npp.tsd.data.repo.RequestsRepository
import com.npp.tsd.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RequestDetailViewModel(private val repository: RequestsRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<RequestDetailed>>(UiState.Loading)
    val state: StateFlow<UiState<RequestDetailed>> = _state.asStateFlow()

    private var currentId: Int = 0

    fun load(requestId: Int) {
        currentId = requestId
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    fun refresh() {
        viewModelScope.launch { fetch() }
    }

    private suspend fun fetch() {
        try {
            _state.value = UiState.Success(repository.getRequestDetailed(currentId))
        } catch (e: Exception) {
            _state.value = UiState.Error(e.message ?: "Не удалось загрузить заявку")
        }
    }

    fun setStatus(status: String) {
        viewModelScope.launch {
            try {
                repository.updateStatus(currentId, status)
                fetch()
            } catch (_: Exception) {
                // статус не сохранился — повторный запрос покажет реальное состояние
                fetch()
            }
        }
    }
}
