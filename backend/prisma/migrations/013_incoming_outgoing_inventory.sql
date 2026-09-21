-- ВХП / ИСП / Инвентаризация (см. Документ5.docx). Заменяют PartnerRequest
-- как рабочий процесс; PartnerRequest и связанные таблицы остаются в БД
-- как архив без миграции данных.

IF COL_LENGTH('dbo.OperationsCatalog', 'phase') IS NULL
    ALTER TABLE [dbo].[OperationsCatalog] ADD [phase] NVARCHAR(10) NOT NULL CONSTRAINT [DF_OperationsCatalog_phase] DEFAULT N'OUTGOING';

IF COL_LENGTH('dbo.ActRequests', 'docType') IS NULL
    ALTER TABLE [dbo].[ActRequests] ADD [docType] NVARCHAR(20) NOT NULL CONSTRAINT [DF_ActRequests_docType] DEFAULT N'REQUEST';

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DocumentCounters' AND xtype='U')
    CREATE TABLE [dbo].[DocumentCounters] (
        [docType]    NVARCHAR(20) NOT NULL,
        [lastNumber] INT          NOT NULL CONSTRAINT [DF_DocumentCounters_lastNumber] DEFAULT 0,
        CONSTRAINT [PK_DocumentCounters] PRIMARY KEY CLUSTERED ([docType] ASC)
    );

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StatusChanges' AND xtype='U')
    CREATE TABLE [dbo].[StatusChanges] (
        [id]        INT           IDENTITY(1,1) NOT NULL,
        [docType]   NVARCHAR(20)  NOT NULL,
        [docId]     INT           NOT NULL,
        [status]    NVARCHAR(50)  NOT NULL,
        [changedBy] NVARCHAR(255) NOT NULL,
        [changedAt] DATETIME2     NOT NULL CONSTRAINT [DF_StatusChanges_changedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_StatusChanges] PRIMARY KEY CLUSTERED ([id] ASC)
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StatusChanges_DocTypeDocId' AND object_id = OBJECT_ID('dbo.StatusChanges')
)
    CREATE INDEX [IX_StatusChanges_DocTypeDocId] ON [dbo].[StatusChanges] ([docType] ASC, [docId] ASC);

-- ВХП --------------------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncomingDeliveries' AND xtype='U')
    CREATE TABLE [dbo].[IncomingDeliveries] (
        [id]            INT           IDENTITY(1,1) NOT NULL,
        [number]        NVARCHAR(50)  NOT NULL,
        [partnerId]     INT           NOT NULL,
        [warehouseCode] NVARCHAR(100) NULL,
        [isCrossDock]   BIT           NOT NULL CONSTRAINT [DF_IncomingDeliveries_isCrossDock] DEFAULT 0,
        [status]        NVARCHAR(20)  NOT NULL CONSTRAINT [DF_IncomingDeliveries_status] DEFAULT N'Создана',
        [plannedDate]   DATETIME2     NULL,
        [actualDate]    DATETIME2     NULL,
        [comment]       NVARCHAR(MAX) NULL,
        [createdBy]     NVARCHAR(255) NOT NULL,
        [createdAt]     DATETIME2     NOT NULL CONSTRAINT [DF_IncomingDeliveries_createdAt] DEFAULT GETDATE(),
        [updatedAt]     DATETIME2     NOT NULL CONSTRAINT [DF_IncomingDeliveries_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_IncomingDeliveries] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_IncomingDeliveries_Number] UNIQUE ([number]),
        CONSTRAINT [FK_IncomingDeliveries_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_IncomingDeliveries_PartnerId' AND object_id = OBJECT_ID('dbo.IncomingDeliveries')
)
    CREATE INDEX [IX_IncomingDeliveries_PartnerId] ON [dbo].[IncomingDeliveries] ([partnerId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncomingDeliveryItems' AND xtype='U')
    CREATE TABLE [dbo].[IncomingDeliveryItems] (
        [id]           INT            IDENTITY(1,1) NOT NULL,
        [deliveryId]   INT            NOT NULL,
        [skuId]        INT            NULL,
        [article]      NVARCHAR(100)  NOT NULL,
        [name]         NVARCHAR(500)  NULL,
        [barcode]      NVARCHAR(100)  NULL,
        [quantity]     INT            NOT NULL,
        [factQuantity] INT            NULL,
        [weight]       DECIMAL(10,3)  NULL,
        [volume]       DECIMAL(10,3)  NULL,
        CONSTRAINT [PK_IncomingDeliveryItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_IncomingDeliveryItems_Delivery]
            FOREIGN KEY ([deliveryId]) REFERENCES [dbo].[IncomingDeliveries]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_IncomingDeliveryItems_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_IncomingDeliveryItems_DeliveryId' AND object_id = OBJECT_ID('dbo.IncomingDeliveryItems')
)
    CREATE INDEX [IX_IncomingDeliveryItems_DeliveryId] ON [dbo].[IncomingDeliveryItems] ([deliveryId] ASC);

-- ИСП --------------------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OutgoingDeliveries' AND xtype='U')
    CREATE TABLE [dbo].[OutgoingDeliveries] (
        [id]                       INT           IDENTITY(1,1) NOT NULL,
        [number]                   NVARCHAR(50)  NOT NULL,
        [partnerId]                INT           NOT NULL,
        [warehouseCode]            NVARCHAR(100) NULL,
        [isCrossDock]              BIT           NOT NULL CONSTRAINT [DF_OutgoingDeliveries_isCrossDock] DEFAULT 0,
        [sourceIncomingDeliveryId] INT           NULL,
        [status]                   NVARCHAR(20)  NOT NULL CONSTRAINT [DF_OutgoingDeliveries_status] DEFAULT N'Создана',
        [shipDate]                 DATETIME2     NULL,
        [actualDate]               DATETIME2     NULL,
        [comment]                  NVARCHAR(MAX) NULL,
        [createdBy]                NVARCHAR(255) NOT NULL,
        [createdAt]                DATETIME2     NOT NULL CONSTRAINT [DF_OutgoingDeliveries_createdAt] DEFAULT GETDATE(),
        [updatedAt]                DATETIME2     NOT NULL CONSTRAINT [DF_OutgoingDeliveries_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_OutgoingDeliveries] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_OutgoingDeliveries_Number] UNIQUE ([number]),
        CONSTRAINT [FK_OutgoingDeliveries_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
        -- sourceIncomingDeliveryId умышленно без FK (см. комментарий в schema.prisma):
        -- SQL Server запрещает multiple cascade paths Partner -> IncomingDelivery/OutgoingDelivery.
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_OutgoingDeliveries_PartnerId' AND object_id = OBJECT_ID('dbo.OutgoingDeliveries')
)
    CREATE INDEX [IX_OutgoingDeliveries_PartnerId] ON [dbo].[OutgoingDeliveries] ([partnerId] ASC);

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_OutgoingDeliveries_SourceIncomingDeliveryId' AND object_id = OBJECT_ID('dbo.OutgoingDeliveries')
)
    CREATE INDEX [IX_OutgoingDeliveries_SourceIncomingDeliveryId] ON [dbo].[OutgoingDeliveries] ([sourceIncomingDeliveryId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OutgoingDeliveryItems' AND xtype='U')
    CREATE TABLE [dbo].[OutgoingDeliveryItems] (
        [id]           INT            IDENTITY(1,1) NOT NULL,
        [deliveryId]   INT            NOT NULL,
        [skuId]        INT            NULL,
        [article]      NVARCHAR(100)  NOT NULL,
        [name]         NVARCHAR(500)  NULL,
        [quantity]     INT            NOT NULL,
        [factQuantity] INT            NULL,
        [weight]       DECIMAL(10,3)  NULL,
        [volume]       DECIMAL(10,3)  NULL,
        [unitCost]     DECIMAL(12,2)  NULL,
        [totalCost]    DECIMAL(14,2)  NULL,
        CONSTRAINT [PK_OutgoingDeliveryItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_OutgoingDeliveryItems_Delivery]
            FOREIGN KEY ([deliveryId]) REFERENCES [dbo].[OutgoingDeliveries]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_OutgoingDeliveryItems_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_OutgoingDeliveryItems_DeliveryId' AND object_id = OBJECT_ID('dbo.OutgoingDeliveryItems')
)
    CREATE INDEX [IX_OutgoingDeliveryItems_DeliveryId] ON [dbo].[OutgoingDeliveryItems] ([deliveryId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OutgoingDeliveryItemOperations' AND xtype='U')
    CREATE TABLE [dbo].[OutgoingDeliveryItemOperations] (
        [id]          INT           IDENTITY(1,1) NOT NULL,
        [itemId]      INT           NOT NULL,
        [operationId] INT           NOT NULL,
        [value]       NVARCHAR(100) NULL,
        [done]        BIT           NOT NULL CONSTRAINT [DF_OutgoingDeliveryItemOperations_done] DEFAULT 0,
        [factQty]     INT           NULL,
        [executedBy]  NVARCHAR(255) NULL,
        [executedAt]  DATETIME2     NULL,
        CONSTRAINT [PK_OutgoingDeliveryItemOperations] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_OutgoingDeliveryItemOperations_ItemOperation] UNIQUE ([itemId], [operationId]),
        CONSTRAINT [FK_OutgoingDeliveryItemOperations_Item]
            FOREIGN KEY ([itemId]) REFERENCES [dbo].[OutgoingDeliveryItems]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_OutgoingDeliveryItemOperations_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_OutgoingDeliveryItemOperations_ItemId' AND object_id = OBJECT_ID('dbo.OutgoingDeliveryItemOperations')
)
    CREATE INDEX [IX_OutgoingDeliveryItemOperations_ItemId] ON [dbo].[OutgoingDeliveryItemOperations] ([itemId] ASC);

-- Инвентаризация ----------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InventoryTasks' AND xtype='U')
    CREATE TABLE [dbo].[InventoryTasks] (
        [id]        INT           IDENTITY(1,1) NOT NULL,
        [number]    NVARCHAR(50)  NOT NULL,
        [partnerId] INT           NULL,
        [source]    NVARCHAR(20)  NOT NULL,
        [status]    NVARCHAR(20)  NOT NULL CONSTRAINT [DF_InventoryTasks_status] DEFAULT N'Создана',
        [createdBy] NVARCHAR(255) NOT NULL,
        [createdAt] DATETIME2     NOT NULL CONSTRAINT [DF_InventoryTasks_createdAt] DEFAULT GETDATE(),
        [updatedAt] DATETIME2     NOT NULL CONSTRAINT [DF_InventoryTasks_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_InventoryTasks] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_InventoryTasks_Number] UNIQUE ([number]),
        CONSTRAINT [FK_InventoryTasks_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE SET NULL
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_InventoryTasks_PartnerId' AND object_id = OBJECT_ID('dbo.InventoryTasks')
)
    CREATE INDEX [IX_InventoryTasks_PartnerId] ON [dbo].[InventoryTasks] ([partnerId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InventoryTaskItems' AND xtype='U')
    CREATE TABLE [dbo].[InventoryTaskItems] (
        [id]          INT           IDENTITY(1,1) NOT NULL,
        [taskId]      INT           NOT NULL,
        [skuId]       INT           NULL,
        [article]     NVARCHAR(100) NOT NULL,
        [name]        NVARCHAR(500) NULL,
        [address]     NVARCHAR(100) NULL,
        [expectedQty] INT           NOT NULL,
        [countedQty]  INT           NULL,
        [countedBy]   NVARCHAR(255) NULL,
        [countedAt]   DATETIME2     NULL,
        CONSTRAINT [PK_InventoryTaskItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_InventoryTaskItems_Task]
            FOREIGN KEY ([taskId]) REFERENCES [dbo].[InventoryTasks]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_InventoryTaskItems_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_InventoryTaskItems_TaskId' AND object_id = OBJECT_ID('dbo.InventoryTaskItems')
)
    CREATE INDEX [IX_InventoryTaskItems_TaskId] ON [dbo].[InventoryTaskItems] ([taskId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InventoryTaskExecutors' AND xtype='U')
    CREATE TABLE [dbo].[InventoryTaskExecutors] (
        [id]         INT           IDENTITY(1,1) NOT NULL,
        [taskId]     INT           NOT NULL,
        [employeeId] NVARCHAR(50)  NOT NULL,
        [addedAt]    DATETIME2     NOT NULL CONSTRAINT [DF_InventoryTaskExecutors_addedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_InventoryTaskExecutors] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_InventoryTaskExecutors_TaskEmployee] UNIQUE ([taskId], [employeeId]),
        CONSTRAINT [FK_InventoryTaskExecutors_Task]
            FOREIGN KEY ([taskId]) REFERENCES [dbo].[InventoryTasks]([id])
            ON DELETE CASCADE
    );
