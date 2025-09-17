@echo off
echo ========================================
echo DIRECT FIX FOR STAFF DASHBOARD 404 ERROR
echo ========================================
echo.

echo Step 1: Starting Backend...
start "Backend Server" cmd /k "python backend/app.py"
timeout /t 3 /nobreak >nul

echo Step 2: Starting Simple HTTP Server...
start "HTTP Server" cmd /k "python -m http.server 3005"
timeout /t 2 /nobreak >nul

echo Step 3: Opening Staff Dashboard...
start "" "http://localhost:3005/staff_dashboard.html"

echo.
echo ========================================
echo STAFF DASHBOARD SHOULD NOW BE WORKING!
echo ========================================
echo.
echo URLs:
echo - Staff Dashboard: http://localhost:3005/staff_dashboard.html
echo - Backend Health: http://localhost:5000/health
echo.
echo Login Credentials:
echo - road.staff@civicreport.com / road123
echo - lighting.staff@civicreport.com / lighting123
echo - waste.staff@civicreport.com / waste123
echo - water.staff@civicreport.com / water123
echo - general.staff@civicreport.com / general123
echo.
echo Press any key to exit...
pause >nul
