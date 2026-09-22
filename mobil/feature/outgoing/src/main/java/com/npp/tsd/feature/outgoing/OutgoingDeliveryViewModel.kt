package com.npp.tsd.feature.outgoing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.data.OutgoingDeliveriesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.model.OutgoingDelivery
import com.npp.tsd.core.model.ShipOutgoingDeliveryItemBody
import com.npp.tsd.core.network.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class OutgoingDeliveryViewModel(private val repository: OutgoingDeliveriesRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<OutgoingDelivery>>(UiState.Loading)
    val state: StateFlow<UiState<OutgoingDelivery>> = _state.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private var deliveryId = 0

    fun load(id: Int) {
        deliveryId = id
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            _state.value = UiState.Success(repository.getDelivery(deliveryId))
        } catch (e: Exception) {
            _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить ИСП"))
        }
    }

    fun submitShipment(items: List<ShipOutgoingDeliveryItemBody>) {
        if (items.isEmpty()) return
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                repository.ship(deliveryId, items)
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось оформить отгрузку")
            } finally {
                _saving.value = false
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
