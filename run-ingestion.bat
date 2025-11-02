@echo off
echo Running knowledge base ingestion...
cd /d "C:\Users\ambri\Projects\equipIQ v2"
node scripts\test-db-connection.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Connection successful! Running full ingestion...
    node scripts\ingest-knowledge-direct.js
) else (
    echo.
    echo Connection failed. Please check your database credentials.
    exit /b 1
)
