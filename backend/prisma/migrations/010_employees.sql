IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Employees' AND xtype='U')
    CREATE TABLE [dbo].[Employees] (
        [id]         INT            IDENTITY(1,1) NOT NULL,
        [employeeId] NVARCHAR(50)   NOT NULL,
        [fullName]   NVARCHAR(255)  NOT NULL,
        [role]       NVARCHAR(10)   NULL,
        [isActive]   BIT            NOT NULL CONSTRAINT [DF_Employees_isActive] DEFAULT 1,
        [lastLogin]  DATETIME2      NULL,
        [createdAt]  DATETIME2      NOT NULL CONSTRAINT [DF_Employees_createdAt] DEFAULT GETDATE(),
        [updatedAt]  DATETIME2      NOT NULL CONSTRAINT [DF_Employees_updatedAt] DEFAULT GETDATE(),
        CONSTRAINT [PK_Employees] PRIMARY KEY CLUSTERED ([id] ASC)
    );

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'IX_Employees_EmployeeId' AND object_id = OBJECT_ID('dbo.Employees')
)
    CREATE UNIQUE INDEX [IX_Employees_EmployeeId] ON [dbo].[Employees] ([employeeId] ASC);
