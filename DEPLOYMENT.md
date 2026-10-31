# Industrial CrisisOps — Production Deployment Guide

This document provides complete, step-by-step instructions for deploying **Industrial CrisisOps** to [Render](https://render.com) (or any containerized cloud platform).

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────────┐
                          │   Render Static Site           │
                          │   (React 18 + Vite 5 SPA)     │
                          │   https://<frontend>.onrender.com│
                          └──────────────┬────────────────┘
                                         │
                                   HTTPS / REST API
                                         │
                                         ▼
                          ┌───────────────────────────────┐
                          │   Render Web Service          │
                          │   (FastAPI / Uvicorn)         │
                          │   https://<backend>.onrender.com │
                          └──────────────┬────────────────┘
                                         │
                                   SQLite Engine
                                         │
                                         ▼
                          ┌───────────────────────────────┐
                          │  crisisops.db (Local File)    │
                          │  Auto-seeded on fresh launch  │
                          └───────────────────────────────┘
```

The application is deployed as two decoupled cloud services:
1. **Backend Web Service**: Python FastAPI application running under Uvicorn with dynamic `$PORT` binding.
2. **Frontend Static Site**: Pre-compiled React + Vite single page application with environment-driven API routing (`VITE_API_URL`).

---

## 🚀 Option A: 1-Click Render Blueprint Deployment (Recommended)

Render Blueprints allow deploying the entire stack in one click using the repository's `render.yaml`.

### Step 1: Connect Repository to Render
1. Push your latest code to GitHub: `git push origin main`.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (`CrisisOps`).

### Step 2: Approve & Deploy
1. Render will automatically detect `render.yaml`.
2. Review the detected services:
   - `crisisops-backend` (Python Web Service)
   - `crisisops-frontend` (Static Site)
3. Click **Apply**.
4. Render will build and deploy both services automatically.

---

## 🛠️ Option B: Manual Service Configuration

If deploying manually without Blueprint:

### Service 1: Backend (Python Web Service)

| Configuration Field | Value |
| :--- | :--- |
| **Service Type** | Web Service |
| **Name** | `crisisops-backend` |
| **Environment** | Python |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/api/health` |

#### Backend Environment Variables
| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `ENV` | `production` | Enables production runtime mode |
| `DEBUG` | `False` | Disables debug logs & stack trace leak |
| `DATABASE_URL` | `sqlite:///./crisisops.db` | Local SQLite database file path |
| `CORS_ORIGINS` | `https://crisisops-frontend.onrender.com` | Allowed CORS origins (or `*`) |

---

### Service 2: Frontend (Static Site)

| Configuration Field | Value |
| :--- | :--- |
| **Service Type** | Static Site |
| **Name** | `crisisops-frontend` |
| **Environment** | Static |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `./dist` |

#### Rewrite Rules (SPA Handling)
Add a rewrite rule under **Redirects/Rewrites**:
* **Source**: `/*`
* **Destination**: `/index.html`
* **Action**: `Rewrite`

#### Frontend Environment Variables
| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://crisisops-backend.onrender.com` | Target URL of backend Web Service |

---

## 🗄️ Database Seeding & Deterministic State

* **Fresh Instance Startup**: When `crisisops-backend` starts for the first time, `app/main.py` detects an empty database and automatically executes `seed_database_if_empty()`.
* **Seeded Assets**:
  - Machines: `M-204` (Hydraulic Drive - Critical), `M-101`, `M-305`.
  - Active Incident: `INC-M204-001` (Bearing Temperature Spikes & High Vibration).
  - SOP Documents: `SOP-M204-BEARING`, `SOP-COOLING-PUMP`, `SOP-POWER-GEN`.
  - Maintenance History & Audit Trails.
* **Idempotency**: Restarting or redeploying the backend will **not** wipe user actions unless the database file is explicitly deleted.

---

## 🧪 Post-Deployment Verification Checklist

Run these cURL requests against your deployed backend URL:

### 1. Health Check
```bash
curl -s https://crisisops-backend.onrender.com/api/health
```
**Expected Response**:
```json
{"status":"ok","app":"Industrial CrisisOps","version":"0.1.0","environment":"production"}
```

### 2. Fleet Machine List
```bash
curl -s https://crisisops-backend.onrender.com/api/machines
```
**Expected Response**: JSON array containing 3 machines (`M-204`, `M-101`, `M-305`).

### 3. Actuation Safety Invariant Verification
```bash
curl -X POST https://crisisops-backend.onrender.com/api/incidents/INC-M204-001/execute-actuation
```
**Expected Response**: HTTP 403 Forbidden (`Human approval required prior to physical actuation`).

---

## ⚠️ Troubleshooting & Deployment Gotchas

1. **Free Tier Cold Starts**: Render free-tier web services spin down after 15 minutes of inactivity. Initial requests may take 30-50 seconds to wake up the Uvicorn container.
2. **CORS Blocked**: If API requests fail in browser console, ensure `CORS_ORIGINS` on backend matches your exact frontend URL without trailing slashes.
3. **Frontend API URL**: In Vite, environment variables prefixed with `VITE_` are baked in at build time. If you update `VITE_API_URL`, trigger a fresh frontend build (**Clear build cache & deploy**).
