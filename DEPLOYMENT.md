# 🚀 Tracker App — Azure Deployment Guide

## Prerequisites
- ✅ Azure account (portal.azure.com)
- ✅ GitHub repository with your code
- ✅ Azure CLI installed (optional but helpful)

---

## STEP 1 — Create Azure SQL Database

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Create a resource"** → Search **"SQL Database"** → Click **Create**
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new → name it `tracker-rg`
   - **Database name**: `TrackerDB`
   - **Server**: Create new →
     - Server name: `tracker-sqlserver` *(must be globally unique)*
     - Location: Choose nearest region
     - Authentication: **SQL authentication**
     - Admin login: `trackeradmin`
     - Password: Choose a strong password *(save this!)*
   - **Compute + storage**: Click "Configure" → Choose **"Basic"** ($4.99/mo) or **Serverless**
4. Click **Review + Create** → **Create**
5. Wait ~2 minutes for deployment

### Get the Connection String:
- Go to your SQL Database → **Connection strings** → Copy **ADO.NET** string
- It looks like:
  ```
  Server=tcp:tracker-sqlserver.database.windows.net,1433;Initial Catalog=TrackerDB;Persist Security Info=False;User ID=trackeradmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
  ```
- Replace `{your_password}` with your actual password

### Allow Azure Services to access the DB:
- Go to your SQL Server → **Networking**
- Turn ON **"Allow Azure services and resources to access this server"**
- Click **Save**

---

## STEP 2 — Create Azure App Service (Backend)

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Create a resource"** → Search **"Web App"** → Click **Create**
3. Fill in:
   - **Resource Group**: `tracker-rg` (same as above)
   - **Name**: `trackerapi` *(globally unique — this becomes `trackerapi.azurewebsites.net`)*
   - **Publish**: Code
   - **Runtime stack**: **.NET 9 (LTS)**
   - **OS**: Linux
   - **Region**: Same as your SQL Server
   - **Pricing plan**: **Free F1** (0$/month)
4. Click **Review + Create** → **Create**

### Set Environment Variables on App Service:
Go to your App Service → **Configuration** → **Application settings** → Add these:

| Name | Value |
|---|---|
| `ConnectionStrings__DefaultConnection` | *(your Azure SQL connection string from Step 1)* |
| `Jwt__Key` | `TrackerApp_SuperSecret_JWT_Key_2024_MinLength32Chars!` |
| `Jwt__Issuer` | `TrackerAPI` |
| `Jwt__Audience` | `TrackerApp` |
| `Cors__AllowedOrigins` | *(your Static Web App URL from Step 3 — come back and fill this later)* |

Click **Save** after adding all settings.

### Get the Publish Profile (for GitHub Actions):
- Go to App Service → **Overview** → Click **"Download publish profile"**
- Save the `.PublishSettings` file — you'll need it in Step 4

---

## STEP 3 — Create Azure Static Web Apps (Frontend)

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Create a resource"** → Search **"Static Web Apps"** → Click **Create**
3. Fill in:
   - **Resource Group**: `tracker-rg`
   - **Name**: `tracker-frontend`
   - **Plan type**: **Free**
   - **Region**: East US 2 (or nearest)
   - **Source**: **GitHub**
   - Click **Sign in with GitHub** → Authorize Azure
   - **Organization**: your GitHub username
   - **Repository**: `Tracker`
   - **Branch**: `main`
   - **Build presets**: Custom
   - **App location**: `frontend`
   - **Output location**: `dist`
4. Click **Review + Create** → **Create**

> Azure automatically creates a GitHub Actions file in your repo. **Delete it** — we already have our own in `.github/workflows/deploy-frontend.yml`.

### Get your Static Web App URL:
- Go to Static Web App → **Overview**
- Copy the URL (e.g. `https://tracker-frontend.azurestaticapps.net`)
- **Go back to Step 2** and set `Cors__AllowedOrigins` to this URL

### Get the Deployment Token:
- Go to Static Web App → **Manage deployment token**
- Copy the token — you'll need it in Step 4

---

## STEP 4 — Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 4 secrets:

| Secret Name | Value |
|---|---|
| `AZURE_APP_SERVICE_NAME` | `trackerapi` *(your App Service name)* |
| `AZURE_APP_SERVICE_PUBLISH_PROFILE` | *(paste full contents of the .PublishSettings file)* |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | *(the deployment token from Step 3)* |
| `VITE_API_URL` | `https://trackerapi.azurewebsites.net/api` |

---

## STEP 5 — Update `.env.production`

Edit `frontend/.env.production` and replace `YOUR_APP_NAME`:

```
VITE_API_URL=https://trackerapi.azurewebsites.net/api
```

---

## STEP 6 — Push to GitHub & Deploy!

```bash
git add .
git commit -m "Configure for Azure deployment"
git push origin main
```

This triggers both GitHub Actions workflows automatically:
- ✅ Backend builds and deploys to Azure App Service
- ✅ Frontend builds and deploys to Azure Static Web Apps
- ✅ Database migrations run automatically on first startup

---

## STEP 7 — Verify Everything Works

1. Visit `https://tracker-frontend.azurestaticapps.net`
2. Register a new account
3. Add a transaction
4. Try Export → should download Excel
5. Upload a profile picture

---

## 🎉 Your App is Live!

| Service | URL |
|---|---|
| **Frontend** | `https://tracker-frontend.azurestaticapps.net` |
| **Backend API** | `https://trackerapi.azurewebsites.net/api` |
| **Swagger Docs** | `https://trackerapi.azurewebsites.net/swagger` |

---

## 🔧 Troubleshooting

### App shows blank / 404 on page refresh
- Check `frontend/public/staticwebapp.config.json` exists ✅ (already created)

### API calls fail (CORS error)
- Go to App Service → Configuration → make sure `Cors__AllowedOrigins` matches your Static Web App URL exactly

### Database connection fails
- Check the connection string in App Service Configuration has your correct password
- Check SQL Server firewall → "Allow Azure services" is ON

### GitHub Actions fails
- Check all 4 secrets are set correctly in GitHub → Settings → Secrets

---

## 💰 Cost Summary

| Resource | Tier | Cost |
|---|---|---|
| Azure App Service | F1 Free | **$0/mo** |
| Azure Static Web Apps | Free | **$0/mo** |
| Azure SQL Database | Basic | **~$5/mo** |
| **Total** | | **~$5/mo** |
