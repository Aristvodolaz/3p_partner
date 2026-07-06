IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PartnerTariffs' AND xtype='U')
    CREATE TABLE [dbo].[PartnerTariffs] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [partnerId]   INT            NOT NULL,
        [operationId] INT            NOT NULL,
        [tariff]      DECIMAL(10,2)  NOT NULL,
        CONSTRAINT [PK_PartnerTariffs] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_PartnerTariffs_partner_op] UNIQUE ([partnerId], [operationId]),
        CONSTRAINT [FK_PartnerTariffs_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_PartnerTariffs_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );
