# run_all.ps1
# Script to start all services for the Deepfake Detection Application

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "         DEEPFAKE DETECTION SERVICE RUNNER              " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Ask to install/restore dependencies
$install = Read-Host "Do you want to install/update dependencies first? (y/N)"
if ($install -eq "y" -or $install -eq "Y") {
    Write-Host "`n[1/3] Installing Root & Express Server dependencies..." -ForegroundColor Yellow
    npm install
    cd server
    npm install
    cd ..

    Write-Host "`n[2/3] Installing Frontend React (Vite) dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..

    Write-Host "`n[3/3] Installing ML service Python dependencies..." -ForegroundColor Yellow
    cd backend/ml_service
    pip install -r requirements.txt
    cd ../..
    
    Write-Host "`nDependencies successfully installed/updated!`n" -ForegroundColor Green
}

Write-Host "`nLaunching services in separate PowerShell windows..." -ForegroundColor Cyan

# 2. Start ML Service (Python / FastAPI on Port 8000)
Write-Host "-> Launching ML Service (FastAPI) on http://localhost:8000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/ml_service; uvicorn main:app --host 0.0.0.0 --port 8000" -Title "ML Service [Port 8000]"

# 3. Start Backend Express Server (Node.js on Port 5000)
Write-Host "-> Launching Express Backend Server on http://localhost:5000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -Title "Express Backend [Port 5000]"

# 4. Start Frontend React Application (Vite on http://localhost:5173)
Write-Host "-> Launching React Frontend (Vite)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -Title "React Frontend"

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "All services started! You can close this orchestrator." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
