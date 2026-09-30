-- Чек-лист операций по позиции ВХП (обработка перед размещением на
-- складе) — зеркало OutgoingDeliveryItemOperations для симметричного шага
-- у приёмки, плюс confirmedQuantity для штучного подтверждения.

IF COL_LENGTH('dbo.IncomingDeliveryItems', 'confirmedQuantity') IS NULL
    ALTER TABLE [dbo].[IncomingDeliveryItems] ADD [confirmedQuantity] INT NOT NULL CONSTRAINT DF_IncomingDeliveryItems_ConfirmedQuantity DEFAULT (0);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncomingDeliveryItemOperations' AND xtype='U')
    CREATE TABLE [dbo].[IncomingDeliveryItemOperations] (
        [id]          INT           IDENTITY(1,1) NOT NULL,
        [itemId]      INT           NOT NULL,
        [operationId] INT           NOT NULL,
        [value]       NVARCHAR(100) NULL,
        [done]        BIT           NOT NULL CONSTRAINT [DF_IncomingDeliveryItemOperations_done] DEFAULT 0,
        [factQty]     INT           NULL,
        [executedBy]  NVARCHAR(255) NULL,
        [executedAt]  DATETIME2     NULL,
        CONSTRAINT [PK_IncomingDeliveryItemOperations] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_IncomingDeliveryItemOperations_ItemOperation] UNIQUE ([itemId], [operationId]),
        CONSTRAINT [FK_IncomingDeliveryItemOperations_Item]
            FOREIGN KEY ([itemId]) REFERENCES [dbo].[IncomingDeliveryItems]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_IncomingDeliveryItemOperations_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_IncomingDeliveryItemOperations_ItemId' AND object_id = OBJECT_ID('dbo.IncomingDeliveryItemOperations')
)
    CREATE INDEX [IX_IncomingDeliveryItemOperations_ItemId] ON [dbo].[IncomingDeliveryItemOperations] ([itemId] ASC);
