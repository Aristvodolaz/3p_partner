package com.npp.tsd.core.model

import kotlinx.serialization.Serializable

@Serializable
data class ExecuteOperationBody(
    val done: Boolean? = null,
    val factQty: Int? = null,
    val isDefect: Boolean? = null,
    val comment: String? = null,
)

@Serializable
data class UpdateItemFactBody(
    val factQuantity: Int? = null,
    val actualArticle: String? = null,
)

@Serializable
data class UpdateStatusBody(
    val status: String,
)
