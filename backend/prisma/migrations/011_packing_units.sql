IF COL_LENGTH('dbo.Skus', 'allowMixedBox') IS NULL
    ALTER TABLE [dbo].[Skus] ADD [allowMixedBox] BIT NOT NULL CONSTRAINT [DF_Skus_allowMixedBox] DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PackingUnits' AND xtype='U')
    CREATE TABLE [dbo].[PackingUnits] (
        [id]             INT            IDENTITY(1,1) NOT NULL,
        [requestItemId]  INT            NOT NULL,
        [type]           NVARCHAR(10)   NOT NULL,
        [code]           NVARCHAR(100)  NOT NULL,
        [parentPalletId] INT            NULL,
        [expiryDate]     DATETIME2      NULL,
        [nestingQty]     INT            NULL,
        [status]         NVARCHAR(20)   NOT NULL CONSTRAINT [DF_PackingUnits_status] DEFAULT N'IN_PROGRESS',
        [createdBy]      NVARCHAR(255)  NOT NULL,
        [createdAt]      DATETIME2      NOT NULL CONSTRAINT [DF_PackingUnits_createdAt] DEFAULT GETDATE(),
        [completedAt]    DATETIME2      NULL,
        CONSTRAINT [PK_PackingUnits] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_PackingUnits_RequestItem]
            FOREIGN KEY ([requestItemId]) REFERENCES [dbo].[RequestItems]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_PackingUnits_ParentPallet]
            FOREIGN KEY ([parentPalletId]) REFERENCES [dbo].[PackingUnits]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_PackingUnits_RequestItemId' AND object_id = OBJECT_ID('dbo.PackingUnits')
)
    CREATE INDEX [IX_PackingUnits_RequestItemId] ON [dbo].[PackingUnits] ([requestItemId] ASC);

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_PackingUnits_ParentPalletId' AND object_id = OBJECT_ID('dbo.PackingUnits')
)
    CREATE INDEX [IX_PackingUnits_ParentPalletId] ON [dbo].[PackingUnits] ([parentPalletId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PackingUnitItems' AND xtype='U')
    CREATE TABLE [dbo].[PackingUnitItems] (
        [id]            INT            IDENTITY(1,1) NOT NULL,
        [packingUnitId] INT            NOT NULL,
        [requestItemId] INT            NOT NULL,
        [article]       NVARCHAR(100)  NOT NULL,
        [quantity]      INT            NOT NULL,
        [isDefect]      BIT            NOT NULL CONSTRAINT [DF_PackingUnitItems_isDefect] DEFAULT 0,
        [comment]       NVARCHAR(MAX)  NULL,
        CONSTRAINT [PK_PackingUnitItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_PackingUnitItems_PackingUnit]
            FOREIGN KEY ([packingUnitId]) REFERENCES [dbo].[PackingUnits]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_PackingUnitItems_RequestItem]
            FOREIGN KEY ([requestItemId]) REFERENCES [dbo].[RequestItems]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_PackingUnitItems_PackingUnitId' AND object_id = OBJECT_ID('dbo.PackingUnitItems')
)
    CREATE INDEX [IX_PackingUnitItems_PackingUnitId] ON [dbo].[PackingUnitItems] ([packingUnitId] ASC);
