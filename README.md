# &soul Southall Dashboard — Vercel Deployment

## What this does
Deploys the dashboard as a Next.js app on Vercel. The Go High Level API calls
run server-side (via /api/ghl), so there are no CORS issues.

---

## Step 1 — Install Node.js (if you don't have it)
Download from: https://nodejs.org — install the LTS version.

---

## Step 2 — Set up the project locally

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Navigate to where you want the project
cd ~/Desktop

# Create the project folder and paste in the files from Claude
# (the folder is called andsoul-dashboard)

# Install dependencies
cd andsoul-dashboard
npm install

# Test it works locally
npm run dev
```

Open http://localhost:3000 — the dashboard should load and the
"Connect to Go High Level" button should work.

---

## Step 3 — Push to GitHub

1. Go to https://github.com and create a free account (or log in)
2. Click "New repository" → name it `andsoul-dashboard` → Create
3. Back in Terminal:

```bash
cd ~/Desktop/andsoul-dashboard
git init
git add .
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/andsoul-dashboard.git
git push -u origin main
```

(Replace YOUR_USERNAME with your actual GitHub username)

---

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com — sign up free with your GitHub account
2. Click "Add New Project"
3. Import your `andsoul-dashboard` repository
4. Leave all settings as default — Vercel auto-detects Next.js
5. Click "Deploy"

It builds in ~60 seconds. You'll get a URL like:
  https://andsoul-dashboard.vercel.app

---

## Step 5 — Add the GHL API key as an environment variable

The API key is currently hardcoded in pages/api/ghl.js as a fallback,
but best practice is to store it as an environment variable:

1. In Vercel dashboard → your project → Settings → Environment Variables
2. Add:
   - Name: GHL_API_KEY
   - Value: pit-da675da7-68cd-4c4e-8693-c490f7f86f04
3. Click Save → then Deployments → Redeploy

---

## Sharing the dashboard

Once deployed, share the Vercel URL with your team.
The URL is permanent and auto-updates whenever you push changes to GitHub.

To password-protect it (optional):
- Vercel dashboard → your project → Settings → Password Protection
- Requires Vercel Pro ($20/mo) — alternatively use Vercel's built-in
  authentication or just keep the URL private.

---

## Updating the dashboard in future

1. Make changes to the files
2. In Terminal: git add . && git commit -m "update" && git push
3. Vercel auto-redeploys in ~60 seconds

---

## File structure

```
andsoul-dashboard/
├── pages/
│   ├── index.js          ← Main dashboard (all tabs)
│   ├── _app.js           ← Next.js wrapper
│   └── api/
│       └── ghl.js        ← Server-side GHL proxy (fixes CORS)
├── styles/
│   └── globals.css       ← Global reset
└── package.json
```
