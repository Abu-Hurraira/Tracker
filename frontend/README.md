# Tracker Frontend

## Tech Stack
- **React 18** + **Vite**
- **React Router v6** — client-side routing
- **Framer Motion** — page animations, slide-up modals
- **Recharts** — area charts, bar charts, pie/donut charts
- **Axios** — HTTP client with JWT interceptor
- **react-hot-toast** — notifications
- **date-fns** — date formatting

## Quick Start
```bash
npm install
npm run dev
```
App runs at: `http://localhost:5173`

> Make sure the backend API is running on `http://localhost:5258` first!

## Pages
| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register |
| `/app/dashboard` | Dashboard overview |
| `/app/transactions` | Transaction list (by month) |
| `/app/summary` | Charts & analytics |
| `/app/budgets` | Budget list |
| `/app/budgets/:id` | Budget detail (donut chart) |
| `/app/accounts` | Account management |
| `/app/categories` | Category management |
| `/app/profile` | User profile |
| `/app/settings` | App settings |
