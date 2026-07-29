# Lumify — AI-Powered Adaptive Mock Interview Platform

> **Practice with clarity. Interview with confidence.**

Lumify transforms job descriptions into focused, AI-driven interview sessions and delivers precise, actionable feedback — so you walk into every real interview prepared.

**🚀 Live App:** [lumify-pink.vercel.app](https://lumify-pink.vercel.app)

---

## 📸 UI Showcase

### 🔐 Login
![Login Page](docs/screenshots/screenshot_login.png)

---

### 📊 Dashboard (Overview)
![Dashboard](docs/screenshots/screenshot_dashboard.png)

---

### 🎯 Interview Setup
![Interview Setup](docs/screenshots/screenshot_interview_setup.png)

---

### 🎙️ Interview Lobby
![Interview Lobby](docs/screenshots/screenshot_interview_room.png)

---

## Project Structure

- **`frontend/`** — React + Vite + TypeScript frontend application.
- **`backend/ms1/`** — Express.js + TypeScript API Gateway: user management, auth, OTP emails, and request proxying.
- **`backend/ms2/`** — FastAPI + Python AI microservice powered by Groq LLM (Llama 3.3 70B) and LangGraph.

---

## Deployed URLs

| Service | URL |
|---|---|
| Frontend | https://lumify-pink.vercel.app |
| MS-1 API Gateway | https://lumify-ms1.onrender.com |
| MS-2 AI Service | https://lumify-ms2.onrender.com |

---

## 1. Environment Setup

Each of the three projects needs its own `.env` file. Copy from the `.env.example` templates provided.

### Frontend (`frontend/.env`)

For **local development**, use the Vite proxy so requests go through `localhost:4000`:
```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:4000
VITE_DEV_PORT=5173
VITE_APP_NAME=Lumify
```

> **Note:** For production deployment (Vercel), set `VITE_API_BASE_URL=https://lumify-ms1.onrender.com/api/v1`

---

### MS-1 API Gateway (`backend/ms1/.env`)

Node.js backend handling users, auth, OTP emails, and routing.

```env
NODE_ENV=development
PORT=4000

# Postgres — use NeonDB or any Postgres provider
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# JWT secrets — generate two separate random 32+ char strings
JWT_ACCESS_SECRET=your-random-32-char-secret
JWT_REFRESH_SECRET=your-random-32-char-secret-different

# Redis — use Upstash Redis or local Redis
REDIS_URL=redis://default:password@upstash-url:6379

# MS-2 AI Service
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_API_KEY=my-internal-secret-key

# Email — Gmail + Nodemailer (see setup below)
SMTP_EMAIL=yourgmail@gmail.com
SMTP_PASSWORD=your_16_char_app_password

# CORS
CORS_ORIGIN=*
LOG_LEVEL=info
```

#### 📧 Setting up Gmail for OTP Emails

Lumify uses **Gmail + Nodemailer** to send OTP verification emails. Follow these steps:

1. Go to your [Google Account](https://myaccount.google.com/) → **Security**
2. Enable **2-Step Verification** (required for App Passwords)
3. Search for **"App Passwords"** in the security settings
4. Create a new App Password → Select app: **Mail**, device: **Other (Lumify)**
5. Copy the generated **16-character password** (with or without spaces)
6. Set in your `.env`:
   ```env
   SMTP_EMAIL=yourgmail@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

> **Note:** Use your real Gmail address and the App Password (NOT your Gmail login password).

---

### MS-2 AI Backend (`backend/ms2/.env`)

Python backend handling LangGraph AI workflows.

```env
APP_NAME="Lumify AI Microservice MS-2"
HOST=0.0.0.0
PORT=8001

# Same NeonDB — note the +asyncpg driver and ssl=require
DATABASE_URL=postgresql+asyncpg://user:password@host/neondb?ssl=require

# Same Upstash Redis
REDIS_URL=redis://default:password@upstash-url:6379/0

# Groq — get free key at https://console.groq.com/keys
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile

# Must match AI_SERVICE_API_KEY in MS-1
INTERNAL_API_KEY=my-internal-secret-key
JWT_SECRET_KEY=your-random-32-char-secret

CELERY_BROKER_URL=redis://default:password@upstash-url:6379/1
CELERY_RESULT_BACKEND=redis://default:password@upstash-url:6379/2
CORS_ORIGINS=["http://localhost:5173","http://localhost:4000"]
```

> ⚠️ `AI_SERVICE_API_KEY` in MS-1 **must match** `INTERNAL_API_KEY` in MS-2.

---

## 2. Running Locally

### Start Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
# Available at http://localhost:5173
```

### Start MS-1 (Express Gateway)
```bash
cd backend/ms1
npm install
npm run dev
# Available at http://localhost:4000
```

### Start MS-2 (FastAPI AI Service)

**Option A: Using `uv` (Recommended — extremely fast)**
```bash
cd backend/ms2
uv sync
uv run uvicorn main:app --reload --port 8001
```

**Option B: Using standard `pip` + venv**
```bash
cd backend/ms2
python -m venv .venv
# Activate:
# Windows:   .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -e .
uvicorn main:app --reload --port 8001
```

---

## 3. Authentication Flow

Lumify uses email OTP verification for new accounts:

1. **Sign Up** → enter name, email, password → account created
2. **OTP Email** → a 6-digit code is sent to your Gmail inbox via Nodemailer
3. **Verify** → enter the OTP on the verification screen → email verified → logged in
4. **Login** → if email is not yet verified, an OTP entry panel appears automatically with a **Resend code** button

> Check your **Spam/Junk** folder if you don't receive the email within a minute.

---

## 4. Architecture & Workflow

### Technical Architecture

- **Frontend** → connects to **MS-1** (Gateway) via Vite proxy in dev, direct URL in production
- **MS-1** → manages users, JWT auth, OTP emails (Gmail/Nodemailer), and proxies interview routes to **MS-2**
- **MS-2** → uses **Groq** (Llama 3.3 70B) to generate questions and evaluate answers via **LangGraph**

### User Workflow

```mermaid
flowchart TD
    1["1. Landing Page"] --> 2["2. Sign Up / Login\n• Email OTP Verification\n• Gmail Nodemailer"]
    2 --> 3["3. Profile Dashboard"]
    3 --> 4["4. Interview Setup\n• Upload Resume & JD\n• Select Role & Experience"]

    4 --> 5["5. AI Interview Room\n• Dynamic Question Generation\n• Microphone / Text Input\n• Real-time AI Responses"]

    5 --> 6["6. AI Feedback Engine\n(LangGraph + Groq Agent)"]

    6 --> 7["7. Performance Report\n• Score & Breakdown\n• Strengths & Weaknesses"]

    7 --> 8["8. Download / Export Report"]
    7 --> 9["9. Learning Resources\n• Weak Topic Identification\n• Interview Tips & Practice Sets"]

    9 -.->|Return| 1
    9 -.->|Return| 3
```

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| MS-1 Backend | Node.js, Express, TypeScript, Drizzle ORM |
| MS-2 Backend | Python, FastAPI, LangGraph, LangChain |
| Database | PostgreSQL (NeonDB) |
| Cache / Queue | Redis (Upstash) |
| AI / LLM | Groq (Llama 3.3 70B Versatile) |
| Email | Gmail + Nodemailer |
| Auth | JWT (Access + Refresh tokens), Email OTP |
| File Storage | Cloudinary |
| Deployment | Vercel (frontend), Render (backends) |