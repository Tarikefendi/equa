@echo off
echo Creating PostgreSQL database...
psql -U postgres -c "CREATE DATABASE boycott_platform;"
echo Database created successfully!
pause
