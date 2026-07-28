package com.npp.tsd.feature.requests.itemdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.model.RequestItemDetailed
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.designsystem.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ItemDetailViewModel(private val repository: RequestsRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<RequestItemDetailed>>(UiState.Loading)
    val state: StateFlow<UiState<RequestItemDetailed>> = _state.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private var requestId: Int = 0
    private var itemId: Int = 0

    fun load(requestId: Int, itemId: Int) {
        this.requestId = requestId
        this.itemId = itemId
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            val request = repository.getRequestDetailed(requestId)
            val item = request.items.find { it.id == itemId }
            _state.value = if (item != null) {
                UiState.Success(item)
            } else {
                UiState.Error("Позиция не найдена в заявке")
            }
        } catch (e: Exception) {
            _state.value = UiState.Error(e.message ?: "Не удалось загрузить позицию")
        }
    }

    fun toggleOperation(operationId: Int, done: Boolean, factQty: Int?, isDefect: Boolean, comment: String?) {
        viewModelScope.launch {
            _saving.value = true
            try {
                repository.executeOperation(itemId, operationId, done, factQty, isDefect, comment)
                fetch()
            } catch (_: Exception) {
                fetch()
            } finally {
                _saving.value = false
            }
        }
    }

    fun saveFact(factQuantity: Int?, actualArticle: String?) {
        viewModelScope.launch {
            _saving.value = true
            try {
                repository.updateItemFact(itemId, factQuantity, actualArticle)
                fetch()
            } catch (_: Exception) {
                fetch()
            } finally {
                _saving.value = false
            }
        }
    }
}
