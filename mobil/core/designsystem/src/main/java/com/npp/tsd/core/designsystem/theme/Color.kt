package com.npp.tsd.core.designsystem.theme

import androidx.compose.ui.graphics.Color

// Фирменный красный Комус (совпадает с веб-версией, tailwind.config.ts
// `primary`) — основной акцент. Раньше здесь был синий; имена Blue* сохранены
// для минимального диффа, значения — новая красная шкала.
val Blue40 = Color(0xFFD40F1E)
val Blue30 = Color(0xFFAC0C18)
val Blue80 = Color(0xFFF5A3A8)
val Blue90 = Color(0xFFFBD0D2)
val Blue10 = Color(0xFF330306)

// Бирюзовый — третичный акцент (статус "Процесс"/в работе), намеренно НЕ
// красный, чтобы не сливаться с новым primary.
val Teal40 = Color(0xFF0D9488)
val Teal30 = Color(0xFF0B7A70)
val Teal80 = Color(0xFF8FD6CC)
val Teal90 = Color(0xFFCCEEEA)
val Teal10 = Color(0xFF04302B)

// Тёплое золото — точечный акцент, используется скупо: разделители, статы,
// единичные декоративные детали.
val Gold40 = Color(0xFFC99A3B)
val Gold80 = Color(0xFFE8D2A0)
val Gold90 = Color(0xFFF5E9CF)

// Material `error` role — умышленно другой красный, чем primary (ближе к
// стандартному predупреждающему), чтобы деструктивные состояния не сливались
// с обычными фирменными кнопками, которые теперь тоже красные.
val Red40 = Color(0xFFB3261E)
val Red80 = Color(0xFFFFB4AB)
val Red90 = Color(0xFFFDE2E1)
val Red10 = Color(0xFF410E0B)
val Red20 = Color(0xFF690005)
val Red30 = Color(0xFF93000A)

// Тёплая нейтральная шкала — тот же тон, что и web (переопределённый
// Tailwind `gray`), чтобы сайт и приложение читались одной системой.
val Neutral99 = Color(0xFFFAF9F6)
val Neutral95 = Color(0xFFF2F0E9)
val Neutral90 = Color(0xFFE4E0D4)
val Neutral50 = Color(0xFF8C8574)
val Neutral30 = Color(0xFF5A5443)
val Neutral20 = Color(0xFF413C2E)
val Neutral10 = Color(0xFF1B1815)

val NeutralDark10 = Color(0xFF17140F)
val NeutralDark20 = Color(0xFF211D17)
val NeutralDark30 = Color(0xFF2F2A22)
