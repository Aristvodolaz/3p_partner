IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Partners' AND xtype='U')
    CREATE TABLE [dbo].[Partners] (
        [id]             INT            IDENTITY(1,1) NOT NULL,
        [name]           NVARCHAR(255)  NOT NULL,
        [inn]            NVARCHAR(12)   NOT NULL,
        [contractNumber] NVARCHAR(100)  NOT NULL,
        [contactPerson]  NVARCHAR(255)  NOT NULL,
        [phone]          NVARCHAR(20)   NOT NULL,
        [email]          NVARCHAR(255)  NOT NULL,
        [paymentTerms]   NVARCHAR(MAX)  NOT NULL,
        [isActive]       BIT            NOT NULL CONSTRAINT [DF_Partners_isActive] DEFAULT 1,
        [createdAt]      DATETIME2      NOT NULL CONSTRAINT [DF_Partners_createdAt] DEFAULT GETDATE(),
        [updatedAt]      DATETIME2      NOT NULL CONSTRAINT [DF_Partners_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Partners] PRIMARY KEY CLUSTERED ([id] ASC)
    );

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PartnerHistory' AND xtype='U')
    CREATE TABLE [dbo].[PartnerHistory] (
        [id]        INT            IDENTITY(1,1) NOT NULL,
        [partnerId] INT            NOT NULL,
        [changedBy] NVARCHAR(255)  NOT NULL,
        [fieldName] NVARCHAR(100)  NOT NULL,
        [oldValue]  NVARCHAR(MAX)  NULL,
        [newValue]  NVARCHAR(MAX)  NULL,
        [changedAt] DATETIME2      NOT NULL CONSTRAINT [DF_PartnerHistory_changedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_PartnerHistory] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_PartnerHistory_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_PartnerHistory_PartnerId'
    AND object_id = OBJECT_ID('dbo.PartnerHistory')
)
    CREATE INDEX [IX_PartnerHistory_PartnerId]
        ON [dbo].[PartnerHistory] ([partnerId] ASC);
