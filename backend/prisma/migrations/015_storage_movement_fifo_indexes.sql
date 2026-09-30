-- Составные индексы под горячие FIFO-запросы (fifoBatchesAtAddress,
-- fifoBatchesInZone/balanceInZone) — до этого каждый вызов сканировал
-- весь срез partnerId+article в StorageMovements, который только растёт
-- (append-only журнал).

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageMovements_Partner_Article_Address' AND object_id = OBJECT_ID('dbo.StorageMovements')
)
    CREATE INDEX [IX_StorageMovements_Partner_Article_Address] ON [dbo].[StorageMovements] ([partnerId] ASC, [article] ASC, [address] ASC);

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageMovements_Partner_Article_ZoneType' AND object_id = OBJECT_ID('dbo.StorageMovements')
)
    CREATE INDEX [IX_StorageMovements_Partner_Article_ZoneType] ON [dbo].[StorageMovements] ([partnerId] ASC, [article] ASC, [zoneType] ASC);
