# ProviderPlus Backend API & ML Service

This directory contains the FastAPI backend and Machine Learning prediction services for the ProviderPlus AI-powered service marketplace.

## 🏗 Architecture & Tech Stack
* **Framework:** FastAPI (Python)
* **Core Functionality:** User/Provider authentication, direct messaging endpoints, live tracking data handling.

## ⚙️ Local Setup & Installation

**1. Navigate to the backend directory:**
```bash
cd backendapi
```

**2. Create and activate a virtual environment:**
```bash
python -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```

## 🔐 Environment Variables

Security protocol dictates that credentials must never be committed to version control. Create a `.env` file in the root of the `backendapi` directory:

```
DATABASE_URL=your_database_connection_string
JWT_SECRET_KEY=your_secret_key
# Add required ML model paths or third-party API keys here
```

## 🚀 Running the Server

Start the development server with live reloading:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

API Documentation (Swagger UI) is auto-generated and available at: `http://localhost:8001/docs`
