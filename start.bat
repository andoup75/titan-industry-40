@echo off
title Titan Industry 4.0 - Запуск проекта

echo ========================================
echo   Titan Industry 4.0
echo   Создано командой SAAAN
echo ========================================
echo.

cd /d "%~dp0"

REM Проверка наличия Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo Скачайте: https://nodejs.org/
    echo.
    pause
    exit /b
)

REM Проверка наличия Go
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Go не установлен. Датчики не будут работать.
    echo Скачайте: https://go.dev/dl/
    echo.
)

REM Проверка наличия Rust
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Rust не установлен. Сервер не будет работать.
    echo Скачайте: https://rustup.rs/
    echo.
    pause
)

echo [1/4] Установка зависимостей React (npm install)...
echo Это может занять 1-2 минуты...
cd frontend
if exist "node_modules" (
    echo node_modules уже есть, пропускаем...
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b
    )
)
cd ..

echo [2/4] Установка зависимостей Go...
cd backend\go-collector
if exist "go.mod" (
    call go mod tidy
)
cd ..\..

echo [3/4] Сборка Rust проекта (первый раз долго)...
cd backend\rust-inference
if not exist "target\debug\titan-inference.exe" (
    call cargo build
)
cd ..\..

echo [4/4] Запуск всех серверов...
echo.

REM Запуск Rust сервера
start "Rust Server" cmd /k "cd /d "%~dp0backend\rust-inference" && cargo run"

timeout /t 2 /nobreak >nul

REM Запуск Go коллектора
start "Go Collector" cmd /k "cd /d "%~dp0backend\go-collector" && go run main.go"

timeout /t 2 /nobreak >nul

REM Запуск React фронтенда
start "React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   ВСЕ СЕРВЕРЫ ЗАПУЩЕНЫ!
echo ========================================
echo.
echo Сайт будет доступен через 5-10 секунд:
echo http://localhost:5173
echo.
echo Закройте все окна терминалов для остановки.
echo ========================================
echo.

pause
