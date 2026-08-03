IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Acts' AND xtype='U')
    CREATE TABLE [dbo].[Acts] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [partnerId]   INT            NOT NULL,
        [type]        NVARCHAR(20)   NOT NULL,
        [periodLabel] NVARCHAR(20)   NULL,
        [totalAmount] DECIMAL(14,2)  NOT NULL,
        [data]        NVARCHAR(MAX)  NOT NULL,
        [createdBy]   NVARCHAR(255)  NOT NULL,
        [createdAt]   DATETIME2      NOT NULL CONSTRAINT [DF_Acts_createdAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Acts] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_Acts_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_Acts_PartnerId' AND object_id = OBJECT_ID('dbo.Acts')
)
    CREATE INDEX [IX_Acts_PartnerId] ON [dbo].[Acts] ([partnerId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActRequests' AND xtype='U')
    CREATE TABLE [dbo].[ActRequests] (
        [id]            INT            IDENTITY(1,1) NOT NULL,
        [actId]         INT            NOT NULL,
        [requestId]     INT            NOT NULL,
        [requestNumber] NVARCHAR(100)  NOT NULL,
        [amount]        DECIMAL(14,2)  NOT NULL,
        CONSTRAINT [PK_ActRequests] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_ActRequests_Act]
            FOREIGN KEY ([actId]) REFERENCES [dbo].[Acts]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_ActRequests_ActId' AND object_id = OBJECT_ID('dbo.ActRequests')
)
    CREATE INDEX [IX_ActRequests_ActId] ON [dbo].[ActRequests] ([actId] ASC);
