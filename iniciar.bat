@echo off
echo 🚀 Iniciando Chatbot USS...
echo.
echo 📂 Estructura del proyecto:
echo    - Frontend: Raiz del proyecto
echo    - Backend:  /backend
echo.

REM Verificar si Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    echo    Descárgalo desde: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verificar dependencias del frontend
if not exist "node_modules\" (
    echo 📦 Instalando dependencias del frontend...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias del frontend
        pause
        exit /b 1
    )
    echo ✅ Dependencias del frontend instaladas
)

REM Verificar dependencias del backend
if not exist "backend\node_modules\" (
    echo 📦 Instalando dependencias del backend...
    cd backend
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias del backend
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Dependencias del backend instaladas
)

echo.
echo 🔥 Iniciando servidores...
echo.
echo    🖥️  Frontend: http://localhost:3000
echo    🔌 Backend:   http://localhost:5000
echo.

REM Iniciar backend en segundo plano
start "Backend - Chatbot USS" cmd /k "cd backend && node server.js"

REM Esperar un poco para que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar frontend
start "Frontend - Chatbot USS" cmd /k "npm start"

echo ✅ ¡Servidores iniciados!
echo.
echo 💡 Consejos:
echo    - El navegador se abrirá automáticamente
echo    - Usa Ctrl+C en las ventanas para detener los servidores
echo    - Si hay errores, revisa las ventanas del backend y frontend
echo.
pause