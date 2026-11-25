@echo off
chcp 65001 >nul
REM ============================================================
REM  Создание всех файлов Claude Code в папке QWEN
REM  Путь: C:\Users\finbo\Documents\QWEN
REM ============================================================

set "TARGET=C:\Users\finbo\Documents\QWEN"

echo.
echo ================================================================
echo   Создание файлов Claude Code
echo   Папка: %TARGET%
echo ================================================================
echo.

REM Создаём папку если не существует
if not exist "%TARGET%" (
    mkdir "%TARGET%"
    echo [OK] Папка создана: %TARGET%
) else (
    echo [OK] Папка уже существует: %TARGET%
)

echo.
echo [1/4] Создание install-claude-code.ps1 ...

(
echo # ============================================================
echo #  Установка Claude Code — Windows ^(PowerShell^)
echo #  Для работы из России через VPN ^(Швеция^)
echo # ============================================================
echo.
echo $ErrorActionPreference = "Stop"
echo.
echo Write-Host ""
echo Write-Host "================================================" -ForegroundColor Cyan
echo Write-Host "  Установка Claude Code ^(Windows + VPN^)" -ForegroundColor Cyan
echo Write-Host "================================================" -ForegroundColor Cyan
echo Write-Host ""
echo.
echo # ── Шаг 1: Проверка Node.js ──────────────────────────────────
echo Write-Host "[1/5] Проверка Node.js..." -ForegroundColor Yellow
echo.
echo try {
echo     $nodeVersion = ^(node -v^) -replace 'v',''
echo     $major = [int]($nodeVersion.Split^('.'^)[0]^)
echo.
echo     if ($major -lt 22^) {
echo         throw "Node.js version too old: $nodeVersion ^(need ^>= 22^)"
echo     }
echo     Write-Host "  OK Node.js $nodeVersion" -ForegroundColor Green
echo }
echo catch {
echo     Write-Host "  Node.js не найден или версия ^< 22" -ForegroundColor Red
echo     Write-Host "  Скачиваем Node.js 22..." -ForegroundColor Yellow
echo.
echo     if (Get-Command winget -ErrorAction SilentlyContinue^) {
echo         winget install OpenJS.NodeJS --version 22.x
echo     }
echo     else {
echo         $url = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
echo         $installer = "$env:TEMP\node-installer.msi"
echo         Write-Host "  Скачиваем $url ..." -ForegroundColor Yellow
echo         Invoke-WebRequest -Uri $url -OutFile $installer
echo         Write-Host "  Устанавливаем..." -ForegroundColor Yellow
echo         Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
echo         Remove-Item $installer -Force
echo     }
echo.
echo     $env:Path = [System.Environment]::GetEnvironmentVariable^("Path","Machine"^) + ";" + [System.Environment]::GetEnvironmentVariable^("Path","User"^)
echo     Write-Host "  OK Node.js установлен" -ForegroundColor Green
echo }
echo.
echo # ── Шаг 2: Проверка VPN ──────────────────────────────────────
echo Write-Host ""
echo Write-Host "[2/5] Проверка VPN-подключения..." -ForegroundColor Yellow
echo.
echo try {
echo     $ipInfo = Invoke-RestMethod -Uri "https://ipinfo.io/json" -TimeoutSec 10
echo     $country = $ipInfo.Country
echo     $ip = $ipInfo.Ip
echo.
echo     Write-Host "  IP: $ip"
echo     Write-Host "  Страна: $country"
echo.
echo     $blockedCountries = @^("RU", "BY", "CN", "IR", "KP", "CU", "SY"^)
echo.
echo     if ($blockedCountries -contains $country^) {
echo         Write-Host ""
echo         Write-Host "  ВНИМАНИЕ: Обнаружена блокируемая страна: $country" -ForegroundColor Red
echo         Write-Host "  Включите VPN ^(рекомендуется Швеция^) и перезапустите скрипт" -ForegroundColor Yellow
echo         Write-Host ""
echo         Write-Host "  Рекомендуемые VPN:" -ForegroundColor Cyan
echo         Write-Host "    - Mullvad VPN ^(https://mullvad.net^)"
echo         Write-Host "    - NordVPN ^(сервер Швеции^)"
echo         Write-Host "    - ExpressVPN ^(сервер Швеции^)"
echo         exit 1
echo     }
echo     else {
echo         Write-Host "  OK VPN активен, страна: $country" -ForegroundColor Green
echo     }
echo }
echo catch {
echo     Write-Host "  Не удалось проверить IP. Убедитесь что VPN работает." -ForegroundColor Yellow
echo }
echo.
echo # ── Шаг 3: Установка Claude Code ─────────────────────────────
echo Write-Host ""
echo Write-Host "[3/5] Установка @anthropic-ai/claude-code..." -ForegroundColor Yellow
echo.
echo npm install -g @anthropic-ai/claude-code
echo.
echo Write-Host "  OK Claude Code установлен" -ForegroundColor Green
echo.
echo # ── Шаг 4: Настройка ─────────────────────────────────────────
echo Write-Host ""
echo Write-Host "[4/5] Настройка переменных окружения..." -ForegroundColor Yellow
echo.
echo $useProxy = Read-Host "  Используете ли вы прокси для VPN? ^(y/n^)"
echo.
echo if ($useProxy -eq "y"^) {
echo     $proxyUrl = Read-Host "  Введите адрес прокси ^(например, http://127.0.0.1:7890^)"
echo     [System.Environment]::SetEnvironmentVariable^("HTTP_PROXY", $proxyUrl, "User"^)
echo     [System.Environment]::SetEnvironmentVariable^("HTTPS_PROXY", $proxyUrl, "User"^)
echo     [System.Environment]::SetEnvironmentVariable^("NO_PROXY", "localhost,127.0.0.1", "User"^)
echo     Write-Host "  OK Прокси настроен: $proxyUrl" -ForegroundColor Green
echo }
echo else {
echo     Write-Host "  OK Пропускаем ^(VPN работает на уровне системы^)" -ForegroundColor Green
echo }
echo.
echo # ── Шаг 5: Проверка ──────────────────────────────────────────
echo Write-Host ""
echo Write-Host "[5/5] Проверка установки..." -ForegroundColor Yellow
echo.
echo try {
echo     $claudeVersion = claude --version 2^>^&1
echo     Write-Host "  OK Claude Code: $claudeVersion" -ForegroundColor Green
echo }
echo catch {
echo     Write-Host "  Команда 'claude' не найдена. Перезапустите терминал." -ForegroundColor Yellow
echo }
echo.
echo # ── Готово ───────────────────────────────────────────────────
echo Write-Host ""
echo Write-Host "================================================" -ForegroundColor Cyan
echo Write-Host "            Установка завершена!" -ForegroundColor Green
echo Write-Host "================================================" -ForegroundColor Cyan
echo Write-Host ""
echo Write-Host "  Следующие шаги:" -ForegroundColor Yellow
echo Write-Host "  1. Убедитесь что VPN подключён к Швеции"
echo Write-Host "  2. claude login"
echo Write-Host "  3. claude"
echo Write-Host ""
) > "%TARGET%\install-claude-code.ps1"

echo [OK] install-claude-code.ps1 создан

echo.
echo [2/4] Создание claude-safe.bat ...

(
echo @echo off
echo chcp 65001 ^>nul
echo REM ============================================================
echo REM  claude-safe — запуск Claude Code с проверкой VPN ^(Windows^)
echo REM ============================================================
echo.
echo echo.
echo echo [ПРОВЕРКА] Определяем IP и страну...
echo.
echo REM Получаем информацию о IP
echo for /f "tokens=*" %%%%i in ('curl -s https://ipinfo.io/country 2^^^>nul') do set COUNTRY=%%%%i
echo for /f "tokens=*" %%%%i in ('curl -s https://ipinfo.io/ip 2^^^>nul') do set IP=%%%%i
echo.
echo echo   IP: %IP%
echo echo   Страна: %COUNTRY%
echo.
echo REM Проверяем блокировку
echo if "%COUNTRY%"=="RU" goto :blocked
echo if "%COUNTRY%"=="BY" goto :blocked
echo if "%COUNTRY%"=="CN" goto :blocked
echo if "%COUNTRY%"=="IR" goto :blocked
echo if "%COUNTRY%"=="KP" goto :blocked
echo.
echo echo.
echo echo ================================================================
echo echo   [OK] VPN активен — страна %COUNTRY% — можно работать!
echo echo ================================================================
echo echo.
echo.
echo REM Запускаем Claude Code
echo claude %*
echo goto :eof
echo.
echo :blocked
echo echo.
echo echo ================================================================
echo echo   [ОШИБКА] Обнаружена блокируемая страна: %COUNTRY%
echo echo ================================================================
echo echo.
echo echo   Claude Code НЕ будет работать из %COUNTRY%.
echo echo   Подключите VPN к серверу в:
echo echo     - Швеция ^(рекомендуется^)
echo echo     - Финляндия
echo echo     - Германия
echo echo     - Нидерланды
echo echo.
echo echo   После подключения к VPN запустите снова:
echo echo     claude-safe.bat
echo echo.
echo exit /b 1
) > "%TARGET%\claude-safe.bat"

echo [OK] claude-safe.bat создан

echo.
echo [3/4] Создание README-CLAUDE-CODE.md ...

(
echo # Claude Code — Установка и настройка для России
echo.
echo ## Что вам нужно
echo.
echo ^| Компонент ^| Статус ^|
echo ^|-----------^|--------^|
echo ^| Подписка Anthropic ^(Max/Pro^) ^| Есть ^|
echo ^| Карта Узбекистана ^| Есть ^|
echo ^| VPN Швеция ^| Можно включить ^|
echo ^| Node.js ^>= 22 ^| Установится автоматически ^|
echo.
echo ---
echo.
echo ## Быстрая установка ^(Windows^)
echo.
echo ```powershell
echo # 1. Включите VPN на Швецию
echo # 2. Запустите PowerShell от имени администратора:
echo Set-ExecutionPolicy Bypass -Scope Process -Force
echo .\install-claude-code.ps1
echo ```
echo.
echo ---
echo.
echo ## Авторизация
echo.
echo ```bash
echo # Убедитесь что VPN активен ^(Швеция^)!
echo claude login
echo ```
echo.
echo ---
echo.
echo ## Безопасный запуск
echo.
echo ```cmd
echo claude-safe.bat
echo ```
echo.
echo ---
echo.
echo ## Решение проблем
echo.
echo ### Ошибка "API connection failed"
echo - Проверьте VPN: `curl https://ipinfo.io/country`
echo - Должно быть: SE ^(или другая не-RU страна^)
echo.
echo ### Ошибка "Authentication failed"
echo - Перелогиньтесь: `claude login --force`
echo.
echo ### command not found: claude
echo - Перезапустите PowerShell от администратора
echo.
echo ---
echo.
echo ## Полезные команды
echo.
echo ```
echo claude              — интерактивный режим
echo claude "вопрос"     — задать вопрос
echo claude --plan       — режим планирования
echo claude config       — настройки
echo ```
) > "%TARGET%\README-CLAUDE-CODE.md"

echo [OK] README-CLAUDE-CODE.md создан

echo.
echo [4/4] Создание start-claude.bat (быстрый запуск) ...

(
echo @echo off
echo chcp 65001 ^>nul
echo REM ============================================================
echo REM  Быстрый запуск Claude Code с проверкой VPN
echo REM ============================================================
echo.
echo echo.
echo echo   Запуск Claude Code...
echo echo.
echo.
echo REM Проверяем VPN
echo for /f "tokens=*" %%%%i in ('curl -s --connect-timeout 5 https://ipinfo.io/country 2^^^>nul') do set COUNTRY=%%%%i
echo.
echo if "%COUNTRY%"=="RU" ^(
echo     echo.
echo     echo   [!] VPN не подключён! Страна: RU
echo     echo   Подключите VPN к Швеции и запустите снова.
echo     echo.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo if "%COUNTRY%"=="" ^(
echo     echo   [!] Не удалось определить IP. Проверьте интернет.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo   [OK] VPN активен — страна: %COUNTRY%
echo echo.
echo.
echo REM Запускаем Claude Code
echo claude %*
) > "%TARGET%\start-claude.bat"

echo [OK] start-claude.bat создан

echo.
echo ================================================================
echo   [OK] Все файлы созданы в: %TARGET%
echo ================================================================
echo.
echo   Файлы:
echo     1. install-claude-code.ps1  — установка Claude Code
echo     2. claude-safe.bat          — безопасный запуск с проверкой VPN
echo     3. start-claude.bat         — быстрый запуск
echo     4. README-CLAUDE-CODE.md    — документация
echo.
echo   Следующие шаги:
echo     1. Включите VPN на Швецию
echo     2. Запустите PowerShell от имени администратора
echo     3. Выполните: Set-ExecutionPolicy Bypass -Scope Process -Force
echo     4. Выполните: cd %TARGET%
echo     5. Выполните: .\install-claude-code.ps1
echo     6. После установки: claude login
echo     7. Для запуска: start-claude.bat
echo.
echo ================================================================
pause
