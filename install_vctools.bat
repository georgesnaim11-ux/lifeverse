@echo off
echo ============================================
echo  Installing VS C++ Build Tools via winget
echo ============================================
echo.
echo This will take 5-15 minutes. Please wait...
echo.

winget install Microsoft.VisualStudio.2022.BuildTools ^
    --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" ^
    --accept-source-agreements ^
    --accept-package-agreements

echo.
if %ERRORLEVEL% equ 0 (
    echo SUCCESS: VS Build Tools installed!
) else if %ERRORLEVEL% equ -1978335212 (
    echo Already installed - that's fine!
) else (
    echo Exit code: %ERRORLEVEL%
    echo Check above for errors.
)
echo.
echo ============================================
echo  Now run setup.bat to complete installation
echo ============================================
pause
