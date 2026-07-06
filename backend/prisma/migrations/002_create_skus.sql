IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OperationsCatalog' AND xtype='U')
    CREATE TABLE [dbo].[OperationsCatalog] (
        [id]        INT            IDENTITY(1,1) NOT NULL,
        [code]      NVARCHAR(50)   NOT NULL,
        [name]      NVARCHAR(255)  NOT NULL,
        [unit]      NVARCHAR(100)  NULL,
        [tariff]    DECIMAL(10,2)  NULL,
        [sortOrder] INT            NOT NULL CONSTRAINT [DF_OperationsCatalog_sortOrder] DEFAULT 0,
        CONSTRAINT [PK_OperationsCatalog] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_OperationsCatalog_code] UNIQUE ([code])
    );

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Skus' AND xtype='U')
    CREATE TABLE [dbo].[Skus] (
        [id]                 INT            IDENTITY(1,1) NOT NULL,
        [partnerId]          INT            NOT NULL,
        [article]            NVARCHAR(100)  NOT NULL,
        [barcode]            NVARCHAR(100)  NULL,
        [name]               NVARCHAR(500)  NOT NULL,
        [color]              NVARCHAR(100)  NULL,
        [shelfLife]          NVARCHAR(100)  NULL,
        [sumOfSides]         DECIMAL(10,2)  NULL,
        [weight]             DECIMAL(10,3)  NULL,
        [clientRequirements] NVARCHAR(MAX)  NULL,
        [specialMarks]       NVARCHAR(500)  NULL,
        [boxQuant]           INT            NULL,
        [palletQuant]        INT            NULL,
        [packCostUnit]       DECIMAL(10,2)  NULL,
        [packCostBox]        DECIMAL(10,2)  NULL,
        [createdAt]          DATETIME2      NOT NULL CONSTRAINT [DF_Skus_createdAt] DEFAULT GETDATE(),
        [updatedAt]          DATETIME2      NOT NULL CONSTRAINT [DF_Skus_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Skus] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_Skus_partner_article] UNIQUE ([partnerId], [article]),
        CONSTRAINT [FK_Skus_Partner]
            FOREIGN KEY ([partnerId]) REFERENCES [dbo].[Partners]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Skus_PartnerId' AND object_id = OBJECT_ID('dbo.Skus')
)
    CREATE INDEX [IX_Skus_PartnerId] ON [dbo].[Skus] ([partnerId] ASC);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SkuOperations' AND xtype='U')
    CREATE TABLE [dbo].[SkuOperations] (
        [id]          INT            IDENTITY(1,1) NOT NULL,
        [skuId]       INT            NOT NULL,
        [operationId] INT            NOT NULL,
        [value]       NVARCHAR(100)  NULL,
        CONSTRAINT [PK_SkuOperations] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_SkuOperations_sku_op] UNIQUE ([skuId], [operationId]),
        CONSTRAINT [FK_SkuOperations_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_SkuOperations_Operation]
            FOREIGN KEY ([operationId]) REFERENCES [dbo].[OperationsCatalog]([id])
    );

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SkuPhotos' AND xtype='U')
    CREATE TABLE [dbo].[SkuPhotos] (
        [id]       INT            IDENTITY(1,1) NOT NULL,
        [skuId]    INT            NOT NULL,
        [filename] NVARCHAR(500)  NOT NULL,
        CONSTRAINT [PK_SkuPhotos] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_SkuPhotos_Sku]
            FOREIGN KEY ([skuId]) REFERENCES [dbo].[Skus]([id])
            ON DELETE CASCADE
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_SkuPhotos_SkuId' AND object_id = OBJECT_ID('dbo.SkuPhotos')
)
    CREATE INDEX [IX_SkuPhotos_SkuId] ON [dbo].[SkuPhotos] ([skuId] ASC);

-- Каталог операций из шаблона «Справочник по внешнему партнёру»
IF NOT EXISTS (SELECT * FROM [dbo].[OperationsCatalog] WHERE [code] = 'barcode_check')
    INSERT INTO [dbo].[OperationsCatalog] ([code], [name], [unit], [tariff], [sortOrder]) VALUES
    (N'barcode_check',    N'Проверка штрих-кода',                                                            N'1 SKU/артикул', 5.30, 1),
    (N'expiry_check',     N'Проверка срока годности',                                                        N'1 SKU/артикул', 18.00, 2),
    (N'sticker_removal',  N'Удаление стикера/маркировки с товара',                                           N'1 ед. товара',  4.20, 3),
    (N'kitting',          N'Формирование наборов, комплектов и минипаков от 2-х ед. товара',                 N'1 ед. товара',  2.00, 4),
    (N'insert_printed',   N'Вложить печатный материал',                                                      N'1 ед. товара',  2.00, 5),
    (N'extra_protection', N'Дополнительная защита товара',                                                   N'1 ед. товара',  4.00, 6),
    (N'bubble_wrap',      N'Упаковка в бабл - пленку',                                                       N'1 ед. товара',  8.00, 7),
    (N'poly_bag',         N'Упаковка товара в п/э пакет',                                                    N'1 ед. товара',  8.00, 8),
    (N'thermo_pack',      N'Термоупаковка товара',                                                           N'1 ед. товара',  4.30, 9),
    (N'individual_box',   N'Упаковка товара в индивидуальный короб',                                         N'1 ед. товара',  13.00, 10),
    (N'labeling',         N'Маркировка товара (стикером, ЧЗ, противокражной этикеткой и тд.)',               N'1 ед. товара',  4.00, 11),
    (N'sorting',          N'Сортировка товара по признаку',                                                  N'1 ед. товара',  10.50, 12),
    (N'box_packing',      N'Фасовка/сборка товара в короб',                                                  N'1 ед. товара',  2.30, 13),
    (N'box_labeling',     N'Маркировка транспортного короба',                                                N'1 короб',       6.00, 14),
    (N'pallet_forming',   N'Формирование транспортного паллета для отгрузки',                                N'1 короб',       15.00, 15),
    (N'pallet_labeling',  N'Маркировка паллета (информационный лист)',                                       N'1 паллет',      6.00, 16);

