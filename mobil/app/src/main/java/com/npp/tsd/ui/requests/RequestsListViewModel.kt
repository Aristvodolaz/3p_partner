package com.npp.tsd.ui.requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.data.model.PartnerRequest
import com.npp.tsd.data.model.RequestStatus
import com.npp.tsd.data.repo.RequestsRepository
import com.npp.tsd.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RequestsListViewModel(private val repository: RequestsRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<List<PartnerRequest>>>(UiState.Loading)
    val state: StateFlow<UiState<List<PartnerRequest>>> = _state.asStateFlow()

    private val _showCompleted = MutableStateFlow(false)
    val showCompleted: StateFlow<Boolean> = _showCompleted.asStateFlow()

    private val _search = MutableStateFlow("")
    val search: StateFlow<String> = _search.asStateFlow()

    init {
        load()
    }

    fun setSearch(value: String) {
        _search.value = value
    }

    fun toggleShowCompleted() {
        _showCompleted.value = !_showCompleted.value
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                val all = repository.getRequests(search = _search.value.ifBlank { null })
                val filtered = if (_showCompleted.value) {
                    all
                } else {
                    all.filter { it.status != RequestStatus.CLOSED && it.status != RequestStatus.DEFECT }
                }
                _state.value = UiState.Success(filtered)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Не удалось загрузить заявки")
            }
        }
    }

    fun applySearch() = load()
}
