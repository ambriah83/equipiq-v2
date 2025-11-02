@echo off
echo.
echo ╔════════════════════════════════════════════════╗
echo ║  EquipIQ Complete Knowledge Base Ingestion    ║
echo ╚════════════════════════════════════════════════╝
echo.
echo This will process:
echo   - Troubleshooting Chat (837 Q^&A pairs)
echo   - Maint Chat (650 Q^&A pairs)
echo   - Equipment Spec Sheets (38 files)
echo   - VersaSpa Guides (4 files)
echo   - TMAX Guides (5 files)
echo.
echo Estimated time: 45-60 minutes
echo Estimated cost: $0.12 for embeddings
echo.
pause
echo.
cd /d "C:\Users\ambri\Projects\equipIQ v2"
node scripts\ingest-complete-knowledge-base.js
echo.
echo.
echo Done! Press any key to exit...
pause > nul
