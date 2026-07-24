# TrackerDB table scripts

File: **`TrackerDB_Tables.sql`**

Contains only `CREATE TABLE` / index / FK queries (no data).

## How to run

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -i "d:\Tracker\database\TrackerDB_Tables.sql"
```

Or open the file in SSMS and execute (F5).

## Tables created
1. Users  
2. Accounts  
3. Categories  
4. Budgets  
5. BudgetCategories  
6. Transactions  
