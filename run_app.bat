@echo off
echo =====================================================================
echo  CHURNIQ -- Statistical Machine Learning & Churn Intelligence
echo  Academic PBL: Logistic Regression & Support Vector Machines
echo =====================================================================
echo.

echo [1/2] Starting CHURNIQ Python FastAPI Backend on http://127.0.0.1:8000 ...
start "CHURNIQ Backend" cmd /k "python backend/run_backend.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting CHURNIQ Vite React Frontend on http://127.0.0.1:5173 ...
start "CHURNIQ Frontend" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1"

echo.
echo =====================================================================
echo  CHURNIQ is running!
echo  Frontend: http://127.0.0.1:5173/
echo  Backend:  http://127.0.0.1:8000/api/health
echo  API Docs: http://127.0.0.1:8000/docs
echo =====================================================================
pause
