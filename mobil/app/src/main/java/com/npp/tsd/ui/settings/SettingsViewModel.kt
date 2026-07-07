package com.npp.tsd.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.npp.tsd.data.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(private val repository: SettingsRepository) : ViewModel() {

    private val _baseUrl = MutableStateFlow("")
    val baseUrl: StateFlow<String> = _baseUrl.asStateFlow()

    private val _saved = MutableStateFlow(false)
    val saved: StateFlow<Boolean> = _saved.asStateFlow()

    init {
        viewModelScope.launch {
            _baseUrl.value = repository.currentBaseUrl()
        }
    }

    fun setUrl(value: String) {
        _baseUrl.value = value
        _saved.value = false
    }

    fun save() {
        viewModelScope.launch {
            repository.setBaseUrl(_baseUrl.value)
            _saved.value = true
        }
    }
}
