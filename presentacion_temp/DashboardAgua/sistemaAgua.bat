@echo off
echo Iniciando servidor para el Dashboard de Agua...
cd C:\Users\leonm\proyectosmarco\DashboardAgua
start /b python -m http.server 8000
timeout /t 2 > NUL
echo Servidor iniciado. Abriendo el dashboard en tu navegador...
start http://localhost:8000/indexagua.html
echo.
echo Para detener el servidor, cierra esta ventana de comandos.