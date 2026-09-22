package com.npp.tsd.feature.outgoing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.OutgoingDeliveriesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.DocumentStatus
import com.npp.tsd.core.model.OutgoingDelivery
import com.npp.tsd.core.network.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class OutgoingDeliveriesListViewModel(private val repository: OutgoingDeliveriesRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<List<OutgoingDelivery>>>(UiState.Loading)
    val state: StateFlow<UiState<List<OutgoingDelivery>>> = _state.asStateFlow()

    private val _showCompleted = MutableStateFlow(false)
    val showCompleted: StateFlow<Boolean> = _showCompleted.asStateFlow()

    init {
        load()
    }

    fun toggleShowCompleted() {
        _showCompleted.value = !_showCompleted.value
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                val all = repository.getDeliveries()
                val filtered = if (_showCompleted.value) {
                    all
                } else {
                    all.filter { it.status != DocumentStatus.DONE && it.status != DocumentStatus.CANCELLED }
                }
                _state.value = UiState.Success(filtered)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить ИСП"))
            }
        }
    }
}
