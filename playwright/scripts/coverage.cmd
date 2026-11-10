@echo off
rem Code coverage of the app during the Playwright run (Chromium, headless).
rem Usage (Command Prompt, in the playwright folder):
rem   scripts\coverage.cmd C:\tools\node12\node-v12.22.12-win-x64
rem The argument is the folder that holds Node 12's node.exe; it is only used for the app build.
rem Leave it out to skip the build and reuse ..\dist\forge-inventory-cov.
setlocal

if not "%~1"=="" (
  echo === Building the app with source maps using Node 12 from %~1
  pushd ..
  "%~1\node.exe" node_modules\@angular\cli\bin\ng build --output-path dist/forge-inventory-cov
  if errorlevel 1 ( popd & echo Build failed & exit /b 1 )
  popd
)

if not exist ..\dist\forge-inventory-cov\index.html (
  echo ..\dist\forge-inventory-cov is missing. Run again with the Node 12 folder as the argument.
  exit /b 1
)

echo === Running the Playwright tests with coverage
set E2E_COVERAGE=1
call npx playwright test --project=chromium
set RESULT=%ERRORLEVEL%
echo.
echo Coverage report: %CD%\coverage-report\index.html
exit /b %RESULT%
