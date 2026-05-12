@echo off
echo ========================================
echo   Titan Industry 4.0 - Quick Launch
echo ========================================
echo.
echo [1/3] Запуск Rust сервера...
start cmd /k "cd backend/rust-inference && cargo run"
timeout /t 2 /nobreak >nul

echo [2/3] Запуск Go коллектора...
start cmd /k "cd backend/go-collector && go run main.go"
timeout /t 2 /nobreak >nul

echo [3/3] Запуск React фронтенда...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Сайт будет доступен через 5-10 секунд
echo   http://localhost:5173
echo ========================================
pause