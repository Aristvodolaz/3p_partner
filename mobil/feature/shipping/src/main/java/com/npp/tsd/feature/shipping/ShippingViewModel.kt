package com.npp.tsd.feature.shipping

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.core.network.friendlyMessage
import com.npp.tsd.core.model.CreateShipmentBody
import com.npp.tsd.core.model.RequestDetailed
import com.npp.tsd.core.model.Shipment
import com.npp.tsd.core.model.ShipmentItemBody
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ShippingViewModel(
    private val requestsRepo: RequestsRepository,
    private val warehouseRepo: WarehouseRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<UiState<RequestDetailed>>(UiState.Loading)
    val state: StateFlow<UiState<RequestDetailed>> = _state.asStateFlow()

    private val _shipments = MutableStateFlow<List<Shipment>>(emptyList())
    val shipments: StateFlow<List<Shipment>> = _shipments.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private var requestId = 0

    fun load(requestId: Int) {
        this.requestId = requestId
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            _state.value = UiState.Success(requestsRepo.getRequestDetailed(requestId))
            _shipments.value = warehouseRepo.getShipments(requestId)
        } catch (e: Exception) {
            _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить данные"))
        }
    }

    fun submitShipment(
        method: String,
        vehicleInfo: String?,
        driverName: String?,
        items: List<ShipmentItemBody>,
    ) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.createShipment(
                    CreateShipmentBody(requestId, method, vehicleInfo, driverName, null, null, items),
                )
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось создать отгрузку")
            } finally {
                _saving.value = false
            }
        }
    }

    fun markShipped(shipmentId: Int, shippedBy: String) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.markShipped(shipmentId, shippedBy)
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось отметить отгрузку")
            } finally {
                _saving.value = false
            }
        }
    }

    fun generateDocument(shipmentId: Int, type: String) {
        viewModelScope.launch {
            _actionError.value = null
            try {
                warehouseRepo.createShipmentDocument(shipmentId, type)
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось сформировать документ")
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
