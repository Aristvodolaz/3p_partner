-- Накопленное количество по частичным подтверждениям позиции ИСП с ТСД
-- (кнопка "Подтвердить" — штучная история без закрытия позиции; "Завершить"
-- фиксирует factQuantity финально).

IF COL_LENGTH('dbo.OutgoingDeliveryItems', 'confirmedQuantity') IS NULL
    ALTER TABLE [dbo].[OutgoingDeliveryItems] ADD [confirmedQuantity] INT NOT NULL CONSTRAINT DF_OutgoingDeliveryItems_ConfirmedQuantity DEFAULT (0);
