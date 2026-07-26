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

- **`frontend/`**: The React + Vite + TypeScript frontend application.
- **`backend/ms1/`**: The Express.js + TypeScript API Gateway and User Management microservice.
- **`backend/ms2/`**: The FastAPI + Python AI microservice, powered by Groq LLM (Llama 3.3 70B) and LangGraph.
- **`prompt.txt`**: Architecture rules and guidelines for the entire project (also available individually in each folder).

---

## Deployed URLs
- Frontend: https://lumify-pink.vercel.app
- MS-1 API Gateway: https://lumify-ms1.onrender.com
- MS-2 AI Service: https://lumify-ms2.onrender.com

## 1. Environment Setup (Getting your keys)

Each of the three projects requires its own `.env` file to run. Local `.env` files have been generated from `.env.example`.

### Frontend (`frontend/.env`)
No secret keys are needed here. It connects to the MS-1 Gateway.
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Lumify
```

### MS-1 API Gateway (`backend/ms1/.env`)
This is the Node.js backend handling users, routing, and database interactions.
1. **Postgres Database**: Use NeonDB or any serverless Postgres provider. Paste the connection string into `DATABASE_URL`.
2. **Redis**: Use Upstash Redis or a local Redis instance for rate limiting.
```env
PORT=4000
DATABASE_URL=postgresql://neondb_owner:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_ACCESS_SECRET=your-random-32-char-secret
JWT_REFRESH_SECRET=your-random-32-char-secret
REDIS_URL=redis://default:password@upstash-url:6379
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_API_KEY=my-internal-secret-key
CORS_ORIGIN=*
LOG_LEVEL=info
```

### MS-2 AI Backend (`backend/ms2/.env`)
This is the Python backend handling LangGraph workflows.
1. **Groq API Key**: Go to [Groq Console](https://console.groq.com/keys) and generate a free API key. Paste it into `GROQ_API_KEY`.
2. **Postgres & Redis**: MS-2 connects to the same NeonDB and Upstash Redis. Note that the `DATABASE_URL` must start with `postgresql+asyncpg://` and use `ssl=require`.
```env
APP_NAME="Lumify AI Microservice MS-2"
HOST=0.0.0.0
PORT=8001
DATABASE_URL=postgresql+asyncpg://neondb_owner:password@ep-example.us-east-2.aws.neon.tech/neondb?ssl=require
REDIS_URL=redis://default:password@upstash-url:6379/0
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile
INTERNAL_API_KEY=my-internal-secret-key
CELERY_BROKER_URL=redis://default:password@upstash-url:6379/1
CELERY_RESULT_BACKEND=redis://default:password@upstash-url:6379/2
CORS_ORIGINS=["http://localhost:5173","http://localhost:4000"]
```
*(Note: Ensure `AI_SERVICE_API_KEY` in MS-1 matches `INTERNAL_API_KEY` in MS-2!)*

---

## 2. Running the Application

### Start Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
# The frontend will be available at http://localhost:5173
```

### Start MS-1 (Express Gateway)
```bash
cd backend/ms1
npm install
npm run dev
# MS-1 API is now available at http://localhost:4000
```

### Start MS-2 (FastAPI AI Service)

**Option A: Using `uv` (Recommended - extremely fast)**
```bash
cd backend/ms2
uv sync
uv run uvicorn main:app --reload --port 8001
```

**Option B: Using standard `pip` and Python venv**
```bash
cd backend/ms2
python -m venv .venv
# Activate the environment:
# (Windows) .venv\Scripts\activate
# (Mac/Linux) source .venv/bin/activate
pip install -e .
uvicorn main:app --reload --port 8001
```

## Architecture & Workflow

### Technical Architecture
- **Frontend** connects to **MS-1** (Gateway).
- **MS-1** manages users, OTP logic, and proxies interview routes to **MS-2**.
- **MS-2** uses **Groq** to generate questions and evaluate answers via **LangGraph**.

### User Workflow

```mermaid
flowchart TD
    1["1. Dashboard"] --> 2["2. Login / Sign Up"]
    2 --> 3["3. Profile Dashboard"]
    3 --> 4["4. Interview Setup"]
    
    4 --> 5["5. AI Interview Room
    • Target Role & Experience Setup
    • Job Description (JD) Text Input
    • Microphone Audio / Text Input
    • Dynamic AI Question Generation"]
    
    5 --> 6["6. AI Feedback Engine
    (LangGraph + Groq Agent)"]
    
    6 --> 7["7. Performance Report"]
    
    7 --> 8["8. Download / Export Report"]
    7 --> 9["9. Learning Resources
    • Weak Topics Identification
    • Interview Tips & Practice Sets
    • Recommended Resources"]
    
    9 -.->|Return| 1
    9 -.->|Return| 3
```