# Momentum Backend

Backend API for the **Momentum** habit tracker app. Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Firebase Authentication (token verification)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/user/sync` | Create or update user on login |
| `GET` | `/api/user` | Get user profile + habits |
| `POST` | `/api/habits` | Create a new habit |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `POST` | `/api/logs/daily` | Save/update a daily log |
| `GET` | `/api/logs/history` | Get all historical logs |
| `GET` | `/api/logs/:date` | Get a specific day's log |

## Deploy to Render

1. Push this repo to GitHub.
2. Create a **New Web Service** on [Render](https://render.com).
3. Connect your GitHub repo.
4. Set these values:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add a **PostgreSQL** database on Render (free tier available).
6. Add the `DATABASE_URL` environment variable (Render auto-provides this if you link the DB).

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (defaults to 5000) |
