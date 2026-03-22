@echo off
echo Starting PostgreSQL...
"C:\pgsql\bin\pg_ctl.exe" start -D "C:\pgsql\data" -l "C:\pgsql\data\postgresql.log"
timeout /t 3

echo Starting Backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm start"

echo Starting Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo All services started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
