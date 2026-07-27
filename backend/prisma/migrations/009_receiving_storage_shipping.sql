IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Receipts' AND xtype='U')
    CREATE TABLE [dbo].[Receipts] (
        [id]         INT            IDENTITY(1,1) NOT NULL,
        [requestId]  INT            NOT NULL,
        [type]       NVARCHAR(20)   NOT NULL,
        [isPartial]  BIT            NOT NULL CONSTRAINT [DF_Receipts_isPartial] DEFAULT 0,
        [receivedBy] NVARCHAR(255)  NOT NULL,
        [comment]    NVARCHAR(MAX)  NULL,
        [createdAt]  DATETIME2      NOT NULL CONSTRAINT [DF_Receipts_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Receipts] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_Receipts_Request]
            FOREIGN KEY ([requestId]) REFERENCES [dbo].[PartnerRequests]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_Receipts_RequestId' AND object_id = OBJECT_ID('dbo.Receipts')
)
    CREATE INDEX [IX_Receipts_RequestId] ON [dbo].[Receipts] ([requestId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ReceiptItems' AND xtype='U')
    CREATE TABLE [dbo].[ReceiptItems] (
        [id]                 INT            IDENTITY(1,1) NOT NULL,
        [receiptId]          INT            NOT NULL,
        [requestItemId]      INT            NULL,
        [article]            NVARCHAR(100)  NOT NULL,
        [expectedQty]        INT            NOT NULL,
        [acceptedQty]        INT            NOT NULL,
        [discrepancyType]    NVARCHAR(30)   NULL,
        [discrepancyComment] NVARCHAR(MAX)  NULL,
        CONSTRAINT [PK_ReceiptItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_ReceiptItems_Receipt]
            FOREIGN KEY ([receiptId]) REFERENCES [dbo].[Receipts]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_ReceiptItems_RequestItem]
            FOREIGN KEY ([requestItemId]) REFERENCES [dbo].[RequestItems]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_ReceiptItems_ReceiptId' AND object_id = OBJECT_ID('dbo.ReceiptItems')
)
    CREATE INDEX [IX_ReceiptItems_ReceiptId] ON [dbo].[ReceiptItems] ([receiptId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StorageMovements' AND xtype='U')
    CREATE TABLE [dbo].[StorageMovements] (
        [id]            INT            IDENTITY(1,1) NOT NULL,
        [partnerId]     INT            NOT NULL,
        [article]       NVARCHAR(100)  NOT NULL,
        [requestItemId] INT            NULL,
        [address]       NVARCHAR(100)  NOT NULL,
        [quantity]      INT            NOT NULL,
        [type]          NVARCHAR(20)   NOT NULL,
        [comment]       NVARCHAR(MAX)  NULL,
        [createdBy]     NVARCHAR(255)  NOT NULL,
        [createdAt]     DATETIME2      NOT NULL CONSTRAINT [DF_StorageMovements_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_StorageMovements] PRIMARY KEY CLUSTERED ([id] ASC)
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageMovements_Partner_Article' AND object_id = OBJECT_ID('dbo.StorageMovements')
)
    CREATE INDEX [IX_StorageMovements_Partner_Article] ON [dbo].[StorageMovements] ([partnerId] ASC, [article] ASC);

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageMovements_Address' AND object_id = OBJECT_ID('dbo.StorageMovements')
)
    CREATE INDEX [IX_StorageMovements_Address] ON [dbo].[StorageMovements] ([address] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Shipments' AND xtype='U')
    CREATE TABLE [dbo].[Shipments] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [requestId]   INT            NOT NULL,
        [method]      NVARCHAR(20)   NOT NULL,
        [vehicleInfo] NVARCHAR(255)  NULL,
        [driverName]  NVARCHAR(255)  NULL,
        [plannedDate] DATETIME2      NULL,
        [shippedAt]   DATETIME2      NULL,
        [shippedBy]   NVARCHAR(255)  NULL,
        [comment]     NVARCHAR(MAX)  NULL,
        [createdAt]   DATETIME2      NOT NULL CONSTRAINT [DF_Shipments_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Shipments] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_Shipments_Request]
            FOREIGN KEY ([requestId]) REFERENCES [dbo].[PartnerRequests]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_Shipments_RequestId' AND object_id = OBJECT_ID('dbo.Shipments')
)
    CREATE INDEX [IX_Shipments_RequestId] ON [dbo].[Shipments] ([requestId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ShipmentItems' AND xtype='U')
    CREATE TABLE [dbo].[ShipmentItems] (
        [id]         INT            IDENTITY(1,1) NOT NULL,
        [shipmentId] INT            NOT NULL,
        [article]    NVARCHAR(100)  NOT NULL,
        [name]       NVARCHAR(500)  NULL,
        [quantity]   INT            NOT NULL,
        CONSTRAINT [PK_ShipmentItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_ShipmentItems_Shipment]
            FOREIGN KEY ([shipmentId]) REFERENCES [dbo].[Shipments]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_ShipmentItems_ShipmentId' AND object_id = OBJECT_ID('dbo.ShipmentItems')
)
    CREATE INDEX [IX_ShipmentItems_ShipmentId] ON [dbo].[ShipmentItems] ([shipmentId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WarehouseDocuments' AND xtype='U')
    CREATE TABLE [dbo].[WarehouseDocuments] (
        [id]        INT            IDENTITY(1,1) NOT NULL,
        [requestId] INT            NOT NULL,
        [type]      NVARCHAR(20)   NOT NULL,
        [number]    NVARCHAR(100)  NOT NULL,
        [data]      NVARCHAR(MAX)  NOT NULL,
        [createdBy] NVARCHAR(255)  NOT NULL,
        [createdAt] DATETIME2      NOT NULL CONSTRAINT [DF_WarehouseDocuments_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_WarehouseDocuments] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_WarehouseDocuments_Request]
            FOREIGN KEY ([requestId]) REFERENCES [dbo].[PartnerRequests]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_WarehouseDocuments_RequestId' AND object_id = OBJECT_ID('dbo.WarehouseDocuments')
)
    CREATE INDEX [IX_WarehouseDocuments_RequestId] ON [dbo].[WarehouseDocuments] ([requestId] ASC);

-- Переносим заявки на новый жизненный цикл статусов
UPDATE [dbo].[PartnerRequests] SET [status] = N'Запланировано' WHERE [status] = N'Новая';
UPDATE [dbo].[PartnerRequests] SET [status] = N'В работе' WHERE [status] = N'В обработке';
UPDATE [dbo].[PartnerRequests] SET [status] = N'Готово' WHERE [status] = N'Выполнена';

DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.PartnerRequests') AND c.name = 'status';

IF @constraintName IS NOT NULL AND @constraintName <> 'DF_PartnerRequests_status_v2'
BEGIN
    EXEC('ALTER TABLE [dbo].[PartnerRequests] DROP CONSTRAINT [' + @constraintName + ']');
    EXEC('ALTER TABLE [dbo].[PartnerRequests] ADD CONSTRAINT [DF_PartnerRequests_status_v2] DEFAULT N''Запланировано'' FOR [status]');
END
