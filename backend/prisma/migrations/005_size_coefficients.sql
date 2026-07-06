-- Коэффициенты К0-К5 по сумме трёх сторон (ШДВ)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TariffCoefficients' AND xtype='U')
    CREATE TABLE [dbo].[TariffCoefficients] (
        [id]         INT            IDENTITY(1,1) NOT NULL,
        [code]       NVARCHAR(10)   NOT NULL,
        [multiplier] DECIMAL(6,2)   NOT NULL,
        [minSum]     DECIMAL(10,2)  NOT NULL,
        [maxSum]     DECIMAL(10,2)  NULL,
        [label]      NVARCHAR(100)  NOT NULL,
        CONSTRAINT [PK_TariffCoefficients] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_TariffCoefficients_code] UNIQUE ([code])
    );

IF NOT EXISTS (SELECT * FROM [dbo].[TariffCoefficients] WHERE [code] = N'К0')
    INSERT INTO [dbo].[TariffCoefficients] ([code], [multiplier], [minSum], [maxSum], [label]) VALUES
    (N'К0', 1.00, 0,   35,   N'До 35 см'),
    (N'К1', 1.37, 36,  54,   N'От 36 до 54 см'),
    (N'К2', 1.51, 55,  80,   N'От 55 до 80 см'),
    (N'К3', 1.63, 81,  134,  N'От 81 до 134 см'),
    (N'К4', 1.75, 135, 160,  N'От 135 до 160 см'),
    (N'К5', 2.00, 161, NULL, N'От 161 см');

-- Флаг «применяется коэффициент по ШДВ» на операции
IF COL_LENGTH('dbo.OperationsCatalog', 'applySizeCoef') IS NULL
    ALTER TABLE [dbo].[OperationsCatalog] ADD [applySizeCoef] BIT NOT NULL CONSTRAINT [DF_OperationsCatalog_applySizeCoef] DEFAULT 0;
