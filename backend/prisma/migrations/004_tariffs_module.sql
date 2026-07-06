-- Описание операции в каталоге
IF COL_LENGTH('dbo.OperationsCatalog', 'description') IS NULL
    ALTER TABLE [dbo].[OperationsCatalog] ADD [description] NVARCHAR(MAX) NULL;

-- История изменения тарифов
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TariffHistory' AND xtype='U')
    CREATE TABLE [dbo].[TariffHistory] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [partnerId]   INT            NOT NULL,
        [operationId] INT            NOT NULL,
        [changedBy]   NVARCHAR(255)  NOT NULL,
        [oldTariff]   DECIMAL(10,2)  NULL,
        [newTariff]   DECIMAL(10,2)  NULL,
        [changedAt]   DATETIME2      NOT NULL CONSTRAINT [DF_TariffHistory_changedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_TariffHistory] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_TariffHistory_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_TariffHistory_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_TariffHistory_PartnerId' AND object_id = OBJECT_ID('dbo.TariffHistory')
)
    CREATE INDEX [IX_TariffHistory_PartnerId] ON [dbo].[TariffHistory] ([partnerId] ASC);
