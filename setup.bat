@echo off
echo ============================================
echo  Lifeverse Setup
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (echo ERROR: npm install failed & pause & exit /b 1)

echo.
echo [2/3] Building shared package...
call npm run build --workspace @lifeverse/shared
if %ERRORLEVEL% neq 0 (echo ERROR: shared build failed & pause & exit /b 1)

echo.
echo [3/3] Running database migration...
call npm run db:migrate
if %ERRORLEVEL% neq 0 (echo ERROR: db:migrate failed & pause & exit /b 1)

echo.
echo ============================================
echo  Setup complete!
echo  Run start-servers.bat to launch dev servers.
echo ============================================
pause
