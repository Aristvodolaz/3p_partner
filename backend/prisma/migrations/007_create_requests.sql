IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PartnerRequests' AND xtype='U')
    CREATE TABLE [dbo].[PartnerRequests] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [partnerId]   INT            NOT NULL,
        [number]      NVARCHAR(100)  NOT NULL,
        [status]      NVARCHAR(50)   NOT NULL CONSTRAINT [DF_PartnerRequests_status] DEFAULT N'Новая',
        [requestDate] DATETIME2      NULL,
        [comment]     NVARCHAR(MAX)  NULL,
        [createdAt]   DATETIME2      NOT NULL CONSTRAINT [DF_PartnerRequests_createdAt] DEFAULT GETDATE(),
        [updatedAt]   DATETIME2      NOT NULL CONSTRAINT [DF_PartnerRequests_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_PartnerRequests] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_PartnerRequests_number] UNIQUE ([number]),
        CONSTRAINT [FK_PartnerRequests_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_PartnerRequests_PartnerId' AND object_id = OBJECT_ID('dbo.PartnerRequests')
)
    CREATE INDEX [IX_PartnerRequests_PartnerId] ON [dbo].[PartnerRequests] ([partnerId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RequestItems' AND xtype='U')
    CREATE TABLE [dbo].[RequestItems] (
        [id]           INT            IDENTITY(1,1) NOT NULL,
        [requestId]    INT            NOT NULL,
        [skuId]        INT            NULL,
        [article]      NVARCHAR(100)  NOT NULL,
        [name]         NVARCHAR(500)  NULL,
        [quantity]     INT            NOT NULL,
        [arrivalDate]  DATETIME2      NULL,
        [shipmentDate] DATETIME2      NULL,
        [unitCost]     DECIMAL(12,2)  NULL,
        [totalCost]    DECIMAL(14,2)  NULL,
        CONSTRAINT [PK_RequestItems] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_RequestItems_Request]
            FOREIGN KEY ([requestId]) REFERENCES [dbo].[PartnerRequests]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_RequestItems_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_RequestItems_RequestId' AND object_id = OBJECT_ID('dbo.RequestItems')
)
    CREATE INDEX [IX_RequestItems_RequestId] ON [dbo].[RequestItems] ([requestId] ASC);
