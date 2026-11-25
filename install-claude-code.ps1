# ============================================================
#  Установка Claude Code — Windows (PowerShell)
#  Для работы из России через VPN (Швеция)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Установка Claude Code (Windows + VPN)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── Шаг 1: Проверка Node.js ──────────────────────────────────
Write-Host "[1/5] Проверка Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = (node -v) -replace 'v',''
    $major = [int]($nodeVersion.Split('.')[0])
    
    if ($major -lt 22) {
        throw "Node.js version too old: $nodeVersion (need >= 22)"
    }
    Write-Host "  OK Node.js $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "  Node.js не найден или версия < 22" -ForegroundColor Red
    Write-Host "  Скачиваем Node.js 22..." -ForegroundColor Yellow
    
    # Скачиваем и устанавливаем Node.js 22 через winget или напрямую
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install OpenJS.NodeJS --version 22.x
    }
    else {
        $url = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
        $installer = "$env:TEMP\node-installer.msi"
        Write-Host "  Скачиваем $url ..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $installer
        Write-Host "  Устанавливаем..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
        Remove-Item $installer -Force
    }
    
    # Обновляем PATH в текущей сессии
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  OK Node.js установлен" -ForegroundColor Green
}

# ── Шаг 2: Проверка VPN ──────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Проверка VPN-подключения..." -ForegroundColor Yellow

try {
    $ipInfo = Invoke-RestMethod -Uri "https://ipinfo.io/json" -TimeoutSec 10
    $country = $ipInfo.Country
    $ip = $ipInfo.Ip
    
    Write-Host "  IP: $ip"
    Write-Host "  Страна: $country"
    
    $blockedCountries = @("RU", "BY", "CN", "IR", "KP", "CU", "SY")
    
    if ($blockedCountries -contains $country) {
        Write-Host ""
        Write-Host "  ВНИМАНИЕ: Обнаружена блокируемая страна: $country" -ForegroundColor Red
        Write-Host "  Включите VPN (рекомендуется Швеция) и перезапустите скрипт" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Рекомендуемые VPN:" -ForegroundColor Cyan
        Write-Host "    - Mullvad VPN (https://mullvad.net)"
        Write-Host "    - NordVPN (сервер Швеции)"
        Write-Host "    - ExpressVPN (сервер Швеции)"
        exit 1
    }
    else {
        Write-Host "  OK VPN активен, страна: $country" -ForegroundColor Green
    }
}
catch {
    Write-Host "  Не удалось проверить IP. Убедитесь что VPN работает." -ForegroundColor Yellow
}

# ── Шаг 3: Установка Claude Code ─────────────────────────────
Write-Host ""
Write-Host "[3/5] Установка @anthropic-ai/claude-code..." -ForegroundColor Yellow

npm install -g @anthropic-ai/claude-code

Write-Host "  OK Claude Code установлен" -ForegroundColor Green

# ── Шаг 4: Настройка прокси (если нужен) ─────────────────────
Write-Host ""
Write-Host "[4/5] Настройка переменных окружения..." -ForegroundColor Yellow

# Проверяем, используется ли прокси для VPN
$useProxy = Read-Host "  Используете ли вы прокси для VPN? (y/n)"

if ($useProxy -eq "y") {
    $proxyUrl = Read-Host "  Введите адрес прокси (например, http://127.0.0.1:7890)"
    
    [System.Environment]::SetEnvironmentVariable("HTTP_PROXY", $proxyUrl, "User")
    [System.Environment]::SetEnvironmentVariable("HTTPS_PROXY", $proxyUrl, "User")
    [System.Environment]::SetEnvironmentVariable("NO_PROXY", "localhost,127.0.0.1", "User")
    
    $env:HTTP_PROXY = $proxyUrl
    $env:HTTPS_PROXY = $proxyUrl
    $env:NO_PROXY = "localhost,127.0.0.1"
    
    Write-Host "  OK Прокси настроен: $proxyUrl" -ForegroundColor Green
}
else {
    Write-Host "  OK Пропускаем (VPN работает на уровне системы)" -ForegroundColor Green
}

# ── Шаг 5: Проверка ──────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Проверка установки..." -ForegroundColor Yellow

try {
    $claudeVersion = claude --version 2>&1
    Write-Host "  OK Claude Code: $claudeVersion" -ForegroundColor Green
}
catch {
    Write-Host "  Команда 'claude' не найдена. Перезапустите терминал." -ForegroundColor Yellow
}

# ── Готово ───────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "            Установка завершена!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Следующие шаги:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Убедитесь что VPN подключён к Швеции"
Write-Host "  2. Выполните авторизацию:" -ForegroundColor Cyan
Write-Host "     claude login"
Write-Host "  3. Запустите Claude Code:" -ForegroundColor Cyan
Write-Host "     claude"
Write-Host ""
Write-Host "  Оплата подписки:" -ForegroundColor Cyan
Write-Host "  - Карта Узбекистана работает через anthropic.com"
Write-Host "  - При оплате убедитесь что VPN активен (Швеция)"
Write-Host "  - Если оплата не проходит, попробуйте другой сервер VPN"
Write-Host ""
