# Запуск backend и frontend в параллельных терминалах
Write-Host "=== 3P Partner — Запуск окружения разработки ===" -ForegroundColor Cyan

# Backend (порт 3032)
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location 'D:\work\komus\3p_partner\backend'; npm run start:dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Frontend dev-сервер (порт 3033)
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location 'D:\work\komus\3p_partner\frontend'; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "Backend  : http://localhost:3032" -ForegroundColor Green
Write-Host "Frontend : http://localhost:3033" -ForegroundColor Green
Write-Host "Swagger  : http://localhost:3032/api/docs" -ForegroundColor Green
