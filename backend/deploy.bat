@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURATION (Change these to match your setup) ---
set DOCKER_USER=qkanji
set REPO_NAME=jam-back
set GCP_SERVICE=jam-backend
set GCP_REGION=us-east1
:: ---------------------------------------------------------

:: Check if the user provided a version number
if "%~1"=="" (
    echo [ERROR] Please provide a version number.
    echo Usage: deploy.bat v1.0.0
    exit /b 1
)

set VERSION=%~1
set IMAGE_TAG=%DOCKER_USER%/%REPO_NAME%:%VERSION%

echo ===================================================
echo Starting deployment pipeline for version: %VERSION%
echo Target Image: %IMAGE_TAG%
echo ===================================================

echo [1/4] Building Docker image...
docker build -t %IMAGE_TAG% .
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker build failed.
    exit /b %ERRORLEVEL%
)

echo [2/4] Pushing image to Docker Hub...
docker push %IMAGE_TAG%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker push failed. Ensure you ran 'docker login'.
    exit /b %ERRORLEVEL%
)

echo [3/4] Deploying new revision to Google Cloud Run...
call gcloud run deploy %GCP_SERVICE% ^
  --image docker.io/%IMAGE_TAG% ^
  --region %GCP_REGION% --service-account=firebase-adminsdk-fbsvc@testing-c0092.iam.gserviceaccount.com
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Cloud Run deployment failed.
    exit /b %ERRORLEVEL%
)

echo ===================================================
echo [4/4] SUCCESS! Version %VERSION% is live on Cloud Run.
echo ===================================================
pause
