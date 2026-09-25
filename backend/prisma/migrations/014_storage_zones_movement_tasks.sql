-- Остатки товара на складе: зоны, адреса, задания на перемещение (FIFO).
-- StorageMovements получает ссылки на адрес/партию/источник документа;
-- новые справочники WarehouseZones/StorageAddresses и MovementTasks/
-- MovementTaskItems для задания на перемещение S->W при создании ИСП.

IF COL_LENGTH('dbo.StorageMovements', 'addressId') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [addressId] INT NULL;

IF COL_LENGTH('dbo.StorageMovements', 'zoneType') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [zoneType] NVARCHAR(10) NULL;

IF COL_LENGTH('dbo.StorageMovements', 'incomingDeliveryItemId') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [incomingDeliveryItemId] INT NULL;

IF COL_LENGTH('dbo.StorageMovements', 'receivedAt') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [receivedAt] DATETIME2 NULL;

IF COL_LENGTH('dbo.StorageMovements', 'docType') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [docType] NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.StorageMovements', 'docId') IS NULL
    ALTER TABLE [dbo].[StorageMovements] ADD [docId] INT NULL;

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageMovements_IncomingDeliveryItemId' AND object_id = OBJECT_ID('dbo.StorageMovements')
)
    CREATE INDEX [IX_StorageMovements_IncomingDeliveryItemId] ON [dbo].[StorageMovements] ([incomingDeliveryItemId] ASC);

-- Справочник зон -----------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WarehouseZones' AND xtype='U')
    CREATE TABLE [dbo].[WarehouseZones] (
        [id]            INT           IDENTITY(1,1) NOT NULL,
        [code]          NVARCHAR(50)  NOT NULL,
        [name]          NVARCHAR(255) NOT NULL,
        [type]          NVARCHAR(10)  NOT NULL,
        [warehouseCode] NVARCHAR(100) NULL,
        [createdAt]     DATETIME2     NOT NULL CONSTRAINT [DF_WarehouseZones_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_WarehouseZones] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_WarehouseZones_Code] UNIQUE ([code])
    );

-- Справочник адресов ---------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StorageAddresses' AND xtype='U')
    CREATE TABLE [dbo].[StorageAddresses] (
        [id]            INT           IDENTITY(1,1) NOT NULL,
        [code]          NVARCHAR(100) NOT NULL,
        [zoneId]        INT           NOT NULL,
        [warehouseCode] NVARCHAR(100) NULL,
        [isActive]      BIT           NOT NULL CONSTRAINT [DF_StorageAddresses_isActive] DEFAULT 1,
        [createdAt]     DATETIME2     NOT NULL CONSTRAINT [DF_StorageAddresses_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_StorageAddresses] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_StorageAddresses_Code] UNIQUE ([code]),
        CONSTRAINT [FK_StorageAddresses_Zone]
            FOREIGN KEY ([zoneId]) REFERENCES [dbo].[WarehouseZones]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_StorageAddresses_ZoneId' AND object_id = OBJECT_ID('dbo.StorageAddresses')
)
    CREATE INDEX [IX_StorageAddresses_ZoneId] ON [dbo].[StorageAddresses] ([zoneId] ASC);

-- Задания на перемещение (FIFO, S -> W) -------------------------------------

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MovementTasks' AND xtype='U')
    CREATE TABLE [dbo].[MovementTasks] (
        [id]                 INT           IDENTITY(1,1) NOT NULL,
        [number]             NVARCHAR(50)  NOT NULL,
        [outgoingDeliveryId] INT           NULL,
        [partnerId]          INT           NOT NULL,
        [status]             NVARCHAR(20)  NOT NULL CONSTRAINT [DF_MovementTasks_status] DEFAULT N'Создана',
        [createdBy]          NVARCHAR(255) NOT NULL,
        [createdAt]          DATETIME2     NOT NULL CONSTRAINT [DF_MovementTasks_createdAt] DEFAULT GETDATE(),
        [updatedAt]          DATETIME2     NOT NULL CONSTRAINT [DF_MovementTasks_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_MovementTasks] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_MovementTasks_Number] UNIQUE ([number])
        -- outgoingDeliveryId/partnerId умышленно без FK — та же причина, что у
        -- OutgoingDeliveries.sourceIncomingDeliveryId (multiple cascade paths через Partner).
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_MovementTasks_OutgoingDeliveryId' AND object_id = OBJECT_ID('dbo.MovementTasks')
)
    CREATE INDEX [IX_MovementTasks_OutgoingDeliveryId] ON [dbo].[MovementTasks] ([outgoingDeliveryId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MovementTaskItems' AND xtype='U')
    CREATE TABLE [dbo].[MovementTaskItems] (
        [id]                     INT           IDENTITY(1,1) NOT NULL,
        [taskId]                 INT           NOT NULL,
        [article]                NVARCHAR(100) NOT NULL,
        [name]                   NVARCHAR(500) NULL,
        [skuId]                  INT           NULL,
        [outgoingDeliveryItemId] INT           NULL,
        [sourceAddressId]        INT           NULL,
        [incomingDeliveryItemId] INT           NULL,
        [targetAddressId]        INT           NULL,
        [quantity]               INT           NOT NULL,
        [status]                 NVARCHAR(20)  NOT NULL CONSTRAINT [DF_MovementTaskItems_status] DEFAULT N'Ожидает',
        [confirmedBy]            NVARCHAR(255) NULL,
        [confirmedAt]            DATETIME2     NULL,
        CONSTRAINT [PK_MovementTaskItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_MovementTaskItems_Task]
            FOREIGN KEY ([taskId]) REFERENCES [dbo].[MovementTasks]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_MovementTaskItems_TaskId' AND object_id = OBJECT_ID('dbo.MovementTaskItems')
)
    CREATE INDEX [IX_MovementTaskItems_TaskId] ON [dbo].[MovementTaskItems] ([taskId] ASC);
