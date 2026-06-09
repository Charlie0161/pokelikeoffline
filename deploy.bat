@echo off
:: deploy.bat — Run this instead of "git push" to deploy Pokelike.
:: It stamps the current timestamp into sw.js so every deploy busts
:: the service worker cache automatically. No manual version bumping needed.

echo === Pokelike Deploy ===

:: Generate timestamp (YYYYMMDD-HHMMSS format)
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (set d=%%c%%b%%a)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set t=%%a%%b)
set TIMESTAMP=%d%-%t%
set TIMESTAMP=%TIMESTAMP: =0%

echo Build timestamp: %TIMESTAMP%

:: Stamp the timestamp into sw.js
powershell -Command "(Get-Content sw.js) -replace 'pokelike-BUILD_TIMESTAMP', 'pokelike-%TIMESTAMP%' | Set-Content sw.js"

echo Stamped sw.js with cache name: pokelike-%TIMESTAMP%

:: Git add, commit, push
git add .
git commit -m "Deploy %TIMESTAMP%"
git push

:: Restore the placeholder so the file stays clean in the repo
powershell -Command "(Get-Content sw.js) -replace 'pokelike-%TIMESTAMP%', 'pokelike-BUILD_TIMESTAMP' | Set-Content sw.js"
git add sw.js
git commit -m "Restore sw.js placeholder"
git push

echo === Done! Changes will be live in ~1 minute ===
echo === Open https://charlie0161.github.io/pokelikeoffline/ to verify ===
pause
