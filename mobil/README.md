# 3P Partner ТСД

Нативное Android-приложение (Kotlin + Jetpack Compose) для ТСД-сканеров склада. Реализует модуль «Обработка товара»: список заявок партнёров, операции по каждому артикулу из справочника SKU, отметка выполнения, факт. количество, брак, комментарии, процент готовности заявки.

## Стек

- Kotlin, Jetpack Compose (Material 3), Navigation Compose
- Retrofit + kotlinx.serialization + OkHttp
- DataStore Preferences (хранение адреса сервера)
- ZXing (сканирование штрих-кодов, embedded)
- minSdk 26, compileSdk/targetSdk 34

## Как открыть и собрать

1. Открыть папку `mobil` в Android Studio (Koala/Ladybug или новее).
2. Дождаться Gradle sync (использует Gradle 8.7, JDK 17).
3. Указать адрес backend-сервера в приложении: экран «Настройки» → `http://<IP-сервера>:3032/api/v1/` (по умолчанию `http://10.171.12.36:3032/api/v1/`).
4. Собрать и запустить на ТСД или эмуляторе: Run ▶ или `./gradlew :app:assembleDebug`, APK в `app/build/outputs/apk/debug/app-debug.apk`.

Сервер должен быть доступен по сети с устройства (одна локальная сеть/VPN). Так как backend работает по HTTP без TLS, в манифесте включён `usesCleartextTraffic`.

## Экраны

- **Заявки** — список всех заявок партнёров с фильтром «К выполнению / Все заявки» и поиском по номеру/артикулу.
- **Заявка** — позиции (артикулы), статус заявки (Новая / В обработке / Выполнена / Отменена), общий процент готовности операций.
- **Позиция** — атрибуты SKU (спецотметки, ШДВ), факт. количество и артикул при пересорте, чек-лист операций из справочника SKU (только они — ограничение по ТЗ) с отметкой выполнения, факт. количеством по операции, флагом брака и комментарием.
- **Настройки** — адрес backend-сервера.

## Backend API, который использует приложение

- `GET /api/v1/requests` — список заявок (фильтры `partnerId`, `status`, `search`)
- `GET /api/v1/requests/{id}/detailed` — заявка с операциями SKU, их выполнением и `progress`
- `PATCH /api/v1/requests/{id}` — смена статуса заявки
- `PATCH /api/v1/requests/items/{itemId}/operations/{operationId}` — фиксация выполнения операции (done, factQty, isDefect, comment)
- `PATCH /api/v1/requests/items/{itemId}/fact` — факт. количество и артикул при пересорте на уровне позиции

Полная документация — Swagger backend'а: `http://<IP-сервера>:3032/api/docs`.
