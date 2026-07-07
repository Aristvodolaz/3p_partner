-- Факт. количество и пересорт на уровне позиции заявки
IF COL_LENGTH('dbo.RequestItems', 'factQuantity') IS NULL
    ALTER TABLE [dbo].[RequestItems] ADD [factQuantity] INT NULL;
IF COL_LENGTH('dbo.RequestItems', 'actualArticle') IS NULL
    ALTER TABLE [dbo].[RequestItems] ADD [actualArticle] NVARCHAR(100) NULL;

-- Выполнение операций по позициям заявок (ТСД)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItemOperationExecutions' AND xtype='U')
    CREATE TABLE [dbo].[ItemOperationExecutions] (
        [id]            INT            IDENTITY(1,1) NOT NULL,
        [requestItemId] INT            NOT NULL,
        [operationId]   INT            NOT NULL,
        [done]          BIT            NOT NULL CONSTRAINT [DF_ItemOpExec_done] DEFAULT 0,
        [factQty]       INT            NULL,
        [isDefect]      BIT            NOT NULL CONSTRAINT [DF_ItemOpExec_isDefect] DEFAULT 0,
        [comment]       NVARCHAR(MAX)  NULL,
        [executedBy]    NVARCHAR(255)  NULL,
        [executedAt]    DATETIME2      NULL,
        CONSTRAINT [PK_ItemOperationExecutions] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_ItemOpExec_item_op] UNIQUE ([requestItemId], [operationId]),
        CONSTRAINT [FK_ItemOpExec_RequestItem]
            FOREIGN KEY ([requestItemId]) REFERENCES [dbo].[RequestItems]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_ItemOpExec_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_ItemOpExec_RequestItemId' AND object_id = OBJECT_ID('dbo.ItemOperationExecutions')
)
    CREATE INDEX [IX_ItemOpExec_RequestItemId] ON [dbo].[ItemOperationExecutions] ([requestItemId] ASC);
