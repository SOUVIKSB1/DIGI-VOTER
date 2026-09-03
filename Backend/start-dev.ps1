#!/usr/bin/env powershell
# Quick Backend Startup Script

Write-Host ""
Write-Host "Starting Bharat Vote Backend..." -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the Backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the Backend directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Please update .env with your configuration" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Start the server
Write-Host "Starting server on port 5002..." -ForegroundColor Green
Write-Host ""
Write-Host "Your API will be available at: http://localhost:5002/api" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start

Write-Host ""
Write-Host "Server stopped" -ForegroundColor Yellow
