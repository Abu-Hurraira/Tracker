-- TrackerDB — CREATE TABLE scripts only (schema, no data)
-- Run this in SSMS / Azure Data Studio / sqlcmd against SQL Server

IF DB_ID(N'TrackerDB') IS NULL
    CREATE DATABASE TrackerDB;
GO

USE TrackerDB;
GO

-- Users
CREATE TABLE [Users] (
    [Id]             INT            IDENTITY(1,1) NOT NULL,
    [Username]       NVARCHAR(100)  NOT NULL,
    [Email]          NVARCHAR(200)  NOT NULL,
    [PasswordHash]   NVARCHAR(MAX)  NOT NULL,
    [Currency]       NVARCHAR(10)   NOT NULL,
    [CurrencySymbol] NVARCHAR(MAX)  NOT NULL,
    [AvatarColor]    NVARCHAR(MAX)  NULL,
    [Theme]          NVARCHAR(MAX)  NOT NULL,
    [CreatedAt]      DATETIME2      NOT NULL,
    [ProfilePicture] NVARCHAR(MAX)  NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

-- Accounts
CREATE TABLE [Accounts] (
    [Id]             INT             IDENTITY(1,1) NOT NULL,
    [UserId]         INT             NOT NULL,
    [Name]           NVARCHAR(100)   NOT NULL,
    [Type]           NVARCHAR(MAX)   NOT NULL,
    [Icon]           NVARCHAR(MAX)   NOT NULL,
    [Color]          NVARCHAR(MAX)   NOT NULL,
    [Balance]        DECIMAL(18,2)   NOT NULL,
    [IsMain]         BIT             NOT NULL CONSTRAINT [DF_Accounts_IsMain] DEFAULT (0),
    [InitialDeposit] DECIMAL(18,2)   NOT NULL CONSTRAINT [DF_Accounts_InitialDeposit] DEFAULT (0),
    [CreatedAt]      DATETIME2       NOT NULL,
    CONSTRAINT [PK_Accounts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Accounts_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Accounts_UserId] ON [Accounts] ([UserId]);
GO

/* If Accounts already exists without IsMain / InitialDeposit, run:
ALTER TABLE [Accounts] ADD [IsMain] BIT NOT NULL CONSTRAINT [DF_Accounts_IsMain] DEFAULT (0);
ALTER TABLE [Accounts] ADD [InitialDeposit] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Accounts_InitialDeposit] DEFAULT (0);
*/

-- Categories
CREATE TABLE [Categories] (
    [Id]        INT             IDENTITY(1,1) NOT NULL,
    [UserId]    INT             NOT NULL,
    [Name]      NVARCHAR(100)   NOT NULL,
    [Icon]      NVARCHAR(MAX)   NOT NULL,
    [Color]     NVARCHAR(MAX)   NOT NULL,
    [Type]      NVARCHAR(MAX)   NOT NULL,
    [IsDefault] BIT             NOT NULL,
    [CreatedAt] DATETIME2       NOT NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Categories_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Categories_UserId] ON [Categories] ([UserId]);
GO

-- Budgets
CREATE TABLE [Budgets] (
    [Id]        INT             IDENTITY(1,1) NOT NULL,
    [UserId]    INT             NOT NULL,
    [Name]      NVARCHAR(100)   NOT NULL,
    [Amount]    DECIMAL(18,2)   NOT NULL,
    [StartDate] DATETIME2       NOT NULL,
    [EndDate]   DATETIME2       NOT NULL,
    [CreatedAt] DATETIME2       NOT NULL,
    CONSTRAINT [PK_Budgets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Budgets_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Budgets_UserId] ON [Budgets] ([UserId]);
GO

-- BudgetCategories (many-to-many)
CREATE TABLE [BudgetCategories] (
    [BudgetId]   INT NOT NULL,
    [CategoryId] INT NOT NULL,
    CONSTRAINT [PK_BudgetCategories] PRIMARY KEY ([BudgetId], [CategoryId]),
    CONSTRAINT [FK_BudgetCategories_Budgets_BudgetId]
        FOREIGN KEY ([BudgetId]) REFERENCES [Budgets] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_BudgetCategories_Categories_CategoryId]
        FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id])
);
GO

CREATE INDEX [IX_BudgetCategories_CategoryId] ON [BudgetCategories] ([CategoryId]);
GO

-- Transactions
CREATE TABLE [Transactions] (
    [Id]         INT             IDENTITY(1,1) NOT NULL,
    [UserId]     INT             NOT NULL,
    [CategoryId] INT             NULL,
    [AccountId]  INT             NULL,
    [Title]      NVARCHAR(200)   NULL,
    [Amount]     DECIMAL(18,2)   NOT NULL,
    [Type]       NVARCHAR(MAX)   NOT NULL,
    [Note]       NVARCHAR(MAX)   NULL,
    [Date]       DATETIME2       NOT NULL,
    [CreatedAt]  DATETIME2       NOT NULL,
    CONSTRAINT [PK_Transactions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Transactions_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Transactions_Categories_CategoryId]
        FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]),
    CONSTRAINT [FK_Transactions_Accounts_AccountId]
        FOREIGN KEY ([AccountId]) REFERENCES [Accounts] ([Id])
);
GO

CREATE INDEX [IX_Transactions_UserId] ON [Transactions] ([UserId]);
CREATE INDEX [IX_Transactions_CategoryId] ON [Transactions] ([CategoryId]);
CREATE INDEX [IX_Transactions_AccountId] ON [Transactions] ([AccountId]);
GO
