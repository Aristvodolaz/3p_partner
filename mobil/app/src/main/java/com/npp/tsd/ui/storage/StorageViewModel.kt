package com.npp.tsd.ui.storage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.data.api.friendlyMessage
import com.npp.tsd.data.model.MoveItemBody
import com.npp.tsd.data.model.PlaceItemBody
import com.npp.tsd.data.model.RemoveItemBody
import com.npp.tsd.data.model.RequestDetailed
import com.npp.tsd.data.model.StorageBalanceByAddress
import com.npp.tsd.data.repo.RequestsRepository
import com.npp.tsd.data.repo.WarehouseRepository
import com.npp.tsd.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class StorageViewModel(
    private val requestsRepo: RequestsRepository,
    private val warehouseRepo: WarehouseRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<UiState<RequestDetailed>>(UiState.Loading)
    val state: StateFlow<UiState<RequestDetailed>> = _state.asStateFlow()

    private val _balances = MutableStateFlow<Map<String, List<StorageBalanceByAddress>>>(emptyMap())
    val balances: StateFlow<Map<String, List<StorageBalanceByAddress>>> = _balances.asStateFlow()

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private var requestId = 0
    private var partnerId = 0

    fun load(requestId: Int) {
        this.requestId = requestId
        viewModelScope.launch {
            _state.value = UiState.Loading
            fetch()
        }
    }

    private suspend fun fetch() {
        try {
            val request = requestsRepo.getRequestDetailed(requestId)
            partnerId = request.partnerId
            _state.value = UiState.Success(request)
            val articles = request.items.map { it.article }.distinct()
            _balances.value = articles.associateWith { warehouseRepo.balanceByArticle(partnerId, it) }
        } catch (e: Exception) {
            _state.value = UiState.Error(e.friendlyMessage("Не удалось загрузить данные"))
        }
    }

    fun place(article: String, address: String, quantity: Int, requestItemId: Int?) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.placeItem(PlaceItemBody(partnerId, article, address, quantity, requestItemId))
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось разместить товар")
            } finally {
                _saving.value = false
            }
        }
    }

    fun remove(article: String, address: String, quantity: Int) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.removeItem(RemoveItemBody(partnerId, article, address, quantity))
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось снять товар")
            } finally {
                _saving.value = false
            }
        }
    }

    fun move(article: String, fromAddress: String, toAddress: String, quantity: Int) {
        viewModelScope.launch {
            _saving.value = true
            _actionError.value = null
            try {
                warehouseRepo.moveItem(MoveItemBody(partnerId, article, fromAddress, toAddress, quantity))
                fetch()
            } catch (e: Exception) {
                _actionError.value = e.friendlyMessage("Не удалось переместить товар")
            } finally {
                _saving.value = false
            }
        }
    }

    fun clearError() {
        _actionError.value = null
    }
}
