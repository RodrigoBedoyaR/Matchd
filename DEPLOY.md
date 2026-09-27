# Deployment Guide

This guide walks you through deploying Matchd to Railway (backend + database) and Vercel (frontend).

## Prerequisites

Before you start, make sure this repository is pushed to your GitHub account. You'll need the GitHub repo URL for both deployments.

## Step 1: Set Up the Backend on Railway

1. Go to [Railway.app](https://railway.app) and sign up or log in with GitHub.
2. Create a new project.
3. Add a PostgreSQL plugin:
   - Click "Add" → "Add Plugin" → "PostgreSQL"
   - Railway will create a managed Postgres database for you.
4. Add a service for the API:
   - Click "Add" → "GitHub Repo"
   - Connect to your GitHub account and select this repository
   - In the service settings, set the **Dockerfile path** to `apps/api/Dockerfile`
   - (If prompted for "Root Directory", leave it empty or set to `.`)
5. Set environment variables on the API service:
   - Click on the API service → "Variables"
   - Add `DATABASE_URL`: 
     - Railway shows connection details for the Postgres plugin
     - You can either copy-paste the full connection string, or use Railway's variable reference: `${{ Postgres.DATABASE_URL }}`
   - Add `JWT_SECRET`: Generate a secure value locally with:
     ```bash
     openssl rand -base64 32
     ```
     Then paste the output into the variable value.
   - Add `CORS_ORIGIN`: For now, set to `http://localhost:3200` (you'll update this in Step 4).
6. Deploy the API:
   - Railway automatically deploys when you push to GitHub, or you can trigger it manually.
   - Check the deploy logs to confirm it starts without errors.
7. Seed the database:
   - Once the API is deployed, use Railway's shell/command feature to run:
     ```bash
     npm run db:seed --workspace apps/api
     ```
   - This creates demo user accounts and sample job/candidate data that the frontend displays.

## Step 2: Deploy the Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up or log in with GitHub.
2. Click "Add New" → "Project" and import this repository.
3. In the project settings:
   - Set **Root Directory** to `apps/web` (so Vercel knows to build from there, not the repo root).
4. Add an environment variable:
   - Add `VITE_API_URL`: Set this to your Railway API service's public URL. Railway shows this in the service overview (looks like `https://xxxxx.up.railway.app`). Make sure to use the exact URL with `https://` and no trailing slash.
5. Click "Deploy".
   - Vercel automatically detects this is a Vite project and runs `npm run build` to create `dist/`.
   - The `vercel.json` config file handles routing for client-side navigation (React Router in browser history mode).

## Step 3: Update CORS on Railway

1. Go back to your Railway API service.
2. Update the `CORS_ORIGIN` variable to your Vercel URL (the one Vercel shows when the deploy is done, e.g., `https://matchd.vercel.app`). **Important: no trailing slash.**
   - Also add `APP_URL` with the same Vercel URL. It's used to build password reset links; without it they point to `http://localhost:3200`.
3. Redeploy the API service (Railway → "Trigger Deploy" or push a commit to GitHub).
   - The API service restarts with the updated CORS setting, allowing requests from your Vercel frontend.

## Step 4: Test the Deployment

1. Visit your Vercel URL in a browser.
2. On the landing page, click **"Continue as demo worker"** or **"Continue as demo business"**.
   - You should see real data: a list of jobs (if you're the worker view) or candidate profiles (if you're the business view).
   - If you see an error, check the troubleshooting section below.

## Troubleshooting

### API won't start or deploy fails
- Check Railway's deploy logs for error messages. Common issues:
  - `DATABASE_URL` is not set or formatted incorrectly.
  - Prisma migrations failed (check the logs).

### Login or demo buttons show a network error
- Verify `CORS_ORIGIN` on Railway matches your Vercel URL exactly (including `https://`, no trailing slash).
- Verify `VITE_API_URL` on Vercel matches the Railway API URL exactly (including `https://`, no trailing slash).
- After updating either, redeploy the service.

### Demo account login says "Demo account not found"
- The database seed script hasn't been run yet.
- Go to Railway, open the API service shell, and run:
  ```bash
  npm run db:seed --workspace apps/api
  ```
- Then refresh the browser.

### Other issues
- Check browser console for error messages (F12 → Console tab).
- Check Railway logs for API errors.
- Check Vercel logs (Vercel dashboard → your project → Deployments → logs).
