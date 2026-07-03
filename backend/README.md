# Tracker API — Backend

## Tech Stack
- **ASP.NET Core 9** Web API
- **Entity Framework Core 9** with SQL Server
- **JWT Bearer** authentication
- **BCrypt.Net** for password hashing
- **Swashbuckle** (Swagger UI)

## Quick Start

### 1. Configure SQL Server
Open `appsettings.json` and update the connection string:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=TrackerDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```
Change `.\SQLEXPRESS` to your actual SQL Server instance (e.g., `localhost`, `(localdb)\MSSQLLocalDB`, etc.)

### 2. Run (VS Code or Visual Studio)
```bash
# In VS Code terminal, inside backend/TrackerAPI:
dotnet run
```
The API runs at: `http://localhost:5258` (or the port shown in console)

### 3. Swagger UI
Open: `http://localhost:5258/swagger`

> **Note:** The database is created automatically on first run via EF Core migrations.

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Get JWT token |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/transactions | ✅ | List transactions |
| POST | /api/transactions | ✅ | Add transaction |
| GET | /api/budgets | ✅ | List budgets |
| GET | /api/budgets/{id}/spending | ✅ | Budget analytics |
| GET | /api/reports/dashboard | ✅ | Dashboard data |
| GET | /api/reports/summary | ✅ | Summary/charts |
| GET | /api/reports/monthly-history | ✅ | Monthly history |
