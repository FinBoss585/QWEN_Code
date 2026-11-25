import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const FILES = {
  'install-claude-code.ps1': `# ============================================================
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
    
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install OpenJS.NodeJS --version 22.x
    }
    else {
        $url = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
        $installer = "$env:TEMP\\node-installer.msi"
        Write-Host "  Скачиваем $url ..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $installer
        Write-Host "  Устанавливаем..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i \`"$installer\`" /quiet /norestart" -Wait
        Remove-Item $installer -Force
    }
    
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

# ── Шаг 4: Настройка ─────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Настройка переменных окружения..." -ForegroundColor Yellow

$useProxy = Read-Host "  Используете ли вы прокси для VPN? (y/n)"

if ($useProxy -eq "y") {
    $proxyUrl = Read-Host "  Введите адрес прокси (например, http://127.0.0.1:7890)"
    [System.Environment]::SetEnvironmentVariable("HTTP_PROXY", $proxyUrl, "User")
    [System.Environment]::SetEnvironmentVariable("HTTPS_PROXY", $proxyUrl, "User")
    [System.Environment]::SetEnvironmentVariable("NO_PROXY", "localhost,127.0.0.1", "User")
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
Write-Host "  1. Убедитесь что VPN подключён к Швеции"
Write-Host "  2. claude login"
Write-Host "  3. claude"
Write-Host ""
`,

  'install-claude-code.sh': `#!/usr/bin/env bash
# ============================================================
#  Установка Claude Code — для работы из России через VPN
#  Версия: 2.1.332
# ============================================================
set -e

GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
BLUE='\\033[0;34m'
NC='\\033[0m'

echo -e "\${BLUE}╔══════════════════════════════════════════════════╗\${NC}"
echo -e "\${BLUE}║   Установка Claude Code (для России + VPN)     ║\${NC}"
echo -e "\${BLUE}╚══════════════════════════════════════════════════╝\${NC}"
echo ""

# ── Шаг 1: Проверка Node.js ──────────────────────────────────
echo -e "\${YELLOW}[1/5] Проверка Node.js...\${NC}"

NODE_VERSION=""
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
fi

if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "\${RED}  ✗ Node.js не найден или версия < 22\${NC}"
    echo -e "\${YELLOW}  → Устанавливаем Node.js 22 через NodeSource...\${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "\${GREEN}  ✓ Node.js $(node -v) установлен\${NC}"
else
    echo -e "\${GREEN}  ✓ Node.js $(node -v) уже установлен\${NC}"
fi

# ── Шаг 2: Проверка VPN ──────────────────────────────────────
echo ""
echo -e "\${YELLOW}[2/5] Проверка VPN-подключения...\${NC}"

COUNTRY=$(curl -s https://ipinfo.io/country 2>/dev/null || echo "UNKNOWN")
IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || echo "UNKNOWN")

echo -e "  IP: \${IP}"
echo -e "  Страна: \${COUNTRY}"

BLOCKED_COUNTRIES=("RU" "BY" "CN" "IR" "KP" "CU" "SY")
IS_BLOCKED=false

for blocked in "\${BLOCKED_COUNTRIES[@]}"; do
    if [ "$COUNTRY" = "$blocked" ]; then
        IS_BLOCKED=true
        break
    fi
done

if [ "$IS_BLOCKED" = true ]; then
    echo -e "\${RED}  ✗ Обнаружена блокируемая страна: \${COUNTRY}\${NC}"
    echo -e "\${YELLOW}  ⚠ Включите VPN (рекомендуется Швеция) и перезапустите скрипт\${NC}"
    exit 1
else
    echo -e "\${GREEN}  ✓ VPN активен, страна: \${COUNTRY} — доступно\${NC}"
fi

# ── Шаг 3: Установка Claude Code ─────────────────────────────
echo ""
echo -e "\${YELLOW}[3/5] Установка @anthropic-ai/claude-code...\${NC}"

npm install -g @anthropic-ai/claude-code

echo -e "\${GREEN}  ✓ Claude Code установлен глобально\${NC}"

# ── Шаг 4: Настройка переменных окружения ────────────────────
echo ""
echo -e "\${YELLOW}[4/5] Настройка переменных окружения...\${NC}"

SHELL_RC=""
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && ! grep -q "CLAUDE_CODE" "$SHELL_RC" 2>/dev/null; then
    cat >> "$SHELL_RC" << 'ENVCHECK'

# ── Claude Code Configuration ──
export LANG="en_US.UTF-8"
ENVCHECK
    echo -e "\${GREEN}  ✓ Переменные окружения добавлены в \${SHELL_RC}\${NC}"
else
    echo -e "\${GREEN}  ✓ Переменные окружения уже настроены\${NC}"
fi

# ── Шаг 5: Проверка ──────────────────────────────────────────
echo ""
echo -e "\${YELLOW}[5/5] Проверка установки...\${NC}"

if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "installed")
    echo -e "\${GREEN}  ✓ Claude Code доступен: \${CLAUDE_VERSION}\${NC}"
else
    echo -e "\${YELLOW}  ⚠ Команда 'claude' не найдена в PATH\${NC}"
fi

# ── Готово ───────────────────────────────────────────────────
echo ""
echo -e "\${BLUE}╔══════════════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║            ✓ Установка завершена!              ║\${NC}"
echo -e "\${BLUE}╚══════════════════════════════════════════════════╝\${NC}"
echo ""
echo -e "  \${YELLOW}Следующие шаги:\${NC}"
echo "  1. Убедитесь что VPN подключён к Швеции"
echo -e "  2. \${GREEN}claude login\${NC}"
echo -e "  3. \${GREEN}claude\${NC}"
echo ""
`,

  'claude-safe.sh': `#!/usr/bin/env bash
# ============================================================
#  claude-safe — запуск Claude Code с проверкой VPN
# ============================================================

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
NC='\\033[0m'

BLOCKED=("RU" "BY" "CN" "IR" "KP" "CU" "SY" "VE")

echo -e "\${BLUE}🔍 Проверяем подключение...\${NC}"

if ! curl -s --connect-timeout 5 https://api.anthropic.com > /dev/null 2>&1; then
    echo -e "\${RED}✗ Нет подключения к api.anthropic.com\${NC}"
    exit 1
fi

RESPONSE=$(curl -s --connect-timeout 5 https://ipinfo.io/json 2>/dev/null)

if [ -z "$RESPONSE" ]; then
    echo -e "\${YELLOW}⚠ Не удалось определить IP. Запускаем...\${NC}"
    exec claude "$@"
fi

IP=$(echo "$RESPONSE" | grep -o '"ip": "[^"]*"' | cut -d'"' -f4)
COUNTRY=$(echo "$RESPONSE" | grep -o '"country": "[^"]*"' | cut -d'"' -f4)

echo -e "\${GREEN}✓ IP: \${IP}\${NC}"
echo -e "\${GREEN}✓ Страна: \${COUNTRY}\${NC}"

for blocked in "\${BLOCKED[@]}"; do
    if [ "$COUNTRY" = "$blocked" ]; then
        echo ""
        echo -e "\${RED}  ⚠ БЛОКИРУЕМАЯ СТРАНА: \${COUNTRY}\${NC}"
        echo -e "\${YELLOW}  Подключите VPN к серверу в Швеции\${NC}"
        exit 1
    fi
done

echo -e "\${GREEN}  ✓ VPN активен — можно работать!\${NC}"
echo ""

exec claude "$@"
`,

  'claude-safe.bat': `@echo off
chcp 65001 >nul
REM ============================================================
REM  claude-safe — запуск Claude Code с проверкой VPN (Windows)
REM ============================================================

echo.
echo [ПРОВЕРКА] Определяем IP и страну...
echo.

for /f "tokens=*" %%i in ('curl -s https://ipinfo.io/country 2^>nul') do set COUNTRY=%%i
for /f "tokens=*" %%i in ('curl -s https://ipinfo.io/ip 2^>nul') do set IP=%%i

echo   IP: %IP%
echo   Страна: %COUNTRY%
echo.

if "%COUNTRY%"=="RU" goto :blocked
if "%COUNTRY%"=="BY" goto :blocked
if "%COUNTRY%"=="CN" goto :blocked
if "%COUNTRY%"=="IR" goto :blocked
if "%COUNTRY%"=="KP" goto :blocked

echo.
echo ================================================================
echo   [OK] VPN активен — страна %COUNTRY% — можно работать!
echo ================================================================
echo.

claude %*
goto :eof

:blocked
echo.
echo ================================================================
echo   [ОШИБКА] Обнаружена блокируемая страна: %COUNTRY%
echo ================================================================
echo.
echo   Подключите VPN к серверу в:
echo     - Швеция (рекомендуется)
echo     - Финляндия
echo     - Германия
echo.
exit /b 1
`,

  'start-claude.bat': `@echo off
chcp 65001 >nul
REM ============================================================
REM  Быстрый запуск Claude Code с проверкой VPN
REM ============================================================

echo.
echo   Запуск Claude Code...
echo.

for /f "tokens=*" %%i in ('curl -s --connect-timeout 5 https://ipinfo.io/country 2^>nul') do set COUNTRY=%%i

if "%COUNTRY%"=="RU" (
    echo.
    echo   [!] VPN не подключён! Страна: RU
    echo   Подключите VPN к Швеции и запустите снова.
    echo.
    pause
    exit /b 1
)

if "%COUNTRY%"=="" (
    echo   [!] Не удалось определить IP. Проверьте интернет.
    pause
    exit /b 1
)

echo   [OK] VPN активен — страна: %COUNTRY%
echo.

claude %*
`,

  'README-CLAUDE-CODE.md': `# Claude Code — Установка и настройка для России

## Что вам нужно

| Компонент | Статус |
|-----------|--------|
| Подписка Anthropic (Max/Pro) | ✅ Есть |
| Карта Узбекистана | ✅ Есть |
| VPN Швеция | ✅ Можно включить |
| Node.js ≥ 22 | ⬇️ Установится автоматически |

---

## Быстрая установка (Windows)

\`\`\`powershell
# 1. Включите VPN на Швецию
# 2. Запустите PowerShell от имени администратора:
Set-ExecutionPolicy Bypass -Scope Process -Force
.\\install-claude-code.ps1
\`\`\`

---

## Авторизация

\`\`\`bash
# Убедитесь что VPN активен (Швеция)!
claude login
\`\`\`

---

## Безопасный запуск

\`\`\`cmd
claude-safe.bat
\`\`\`

Или быстрый запуск:

\`\`\`cmd
start-claude.bat
\`\`\`

---

## 💳 Оплата картой Узбекистана

1. Подключите VPN → **Швеция**
2. Перейдите на https://console.anthropic.com/settings/billing
3. Карты Humo, Uzcard, Visa/MC Узбекистана работают ✅

---

## Решение проблем

### Ошибка "API connection failed"
- Проверьте VPN: \`curl https://ipinfo.io/country\`
- Должно быть: SE (или другая не-RU страна)

### Ошибка "Authentication failed"
- Перелогиньтесь: \`claude login --force\`

### command not found: claude
- Перезапустите PowerShell от администратора

---

## Полезные команды

\`\`\`
claude              — интерактивный режим
claude "вопрос"     — задать вопрос
claude --plan       — режим планирования
claude config       — настройки
\`\`\`

---

## Поддержка

- Документация: https://docs.anthropic.com/en/docs/claude-code
- GitHub: https://github.com/anthropics/claude-code
`,
};

export default function App() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'manual' | 'files'>('download');

  const downloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      
      for (const [filename, content] of Object.entries(FILES)) {
        zip.file(filename, content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'claude-code-setup.zip');
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">Claude Code — Файлы для установки</h1>
            <p className="text-xs text-gray-400">Сохранение в C:\Users\finbo\Documents\QWEN</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Target folder info */}
        <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📁</div>
            <div>
              <h2 className="text-lg font-bold text-blue-300">Целевая папка</h2>
              <code className="text-green-400 text-sm bg-gray-900 px-2 py-1 rounded mt-1 inline-block">
                C:\Users\finbo\Documents\QWEN
              </code>
              <p className="text-gray-400 mt-2 text-sm">
                Скачайте ZIP-архив и распакуйте в эту папку, или скачайте файлы по одному.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'download' ? 'bg-orange-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📥 Скачать ZIP
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'bg-orange-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Инструкция
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'files' ? 'bg-orange-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📄 Файлы
          </button>
        </div>

        {/* Tab: Download */}
        {activeTab === 'download' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">Скачать все файлы (ZIP)</h3>
              <p className="text-gray-400 mb-6 text-sm">
                Архив содержит все 6 файлов для установки Claude Code
              </p>
              
              <button
                onClick={downloadZip}
                disabled={downloading}
                className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${
                  downloaded
                    ? 'bg-green-700 text-white'
                    : downloading
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105'
                }`}
              >
                {downloaded ? '✓ Скачано!' : downloading ? '⏳ Создаём архив...' : '📥 Скачать claude-code-setup.zip'}
              </button>

              <div className="mt-6 text-sm text-gray-500">
                <p>После скачивания:</p>
                <ol className="text-left inline-block mt-2 space-y-1">
                  <li>1. Распакуйте архив в <code className="bg-gray-800 px-1 rounded">C:\Users\finbo\Documents\QWEN</code></li>
                  <li>2. Включите VPN → Швеция</li>
                  <li>3. Запустите <code className="bg-gray-800 px-1 rounded">install-claude-code.ps1</code> от имени администратора</li>
                </ol>
              </div>
            </div>

            {/* Individual files */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold mb-4">Или скачайте файлы по одному:</h3>
              <div className="space-y-2">
                {Object.keys(FILES).map((filename) => (
                  <div key={filename} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {filename.endsWith('.ps1') ? '🔷' : filename.endsWith('.sh') ? '🐧' : filename.endsWith('.bat') ? '🟦' : '📄'}
                      </span>
                      <span className="font-mono text-sm text-gray-300">{filename}</span>
                    </div>
                    <button
                      onClick={() => downloadFile(filename, FILES[filename as keyof typeof FILES])}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                    >
                      Скачать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Manual */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-orange-400">📋 Пошаговая инструкция</h3>
              
              <div className="space-y-6">
                <div className="border-l-2 border-orange-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 1: Скачайте файлы</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Нажмите кнопку "Скачать ZIP" на вкладке "Скачать ZIP" выше.
                  </p>
                </div>

                <div className="border-l-2 border-orange-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 2: Распакуйте в папку</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Распакуйте все файлы в:
                  </p>
                  <code className="text-green-400 text-xs bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
                    C:\Users\finbo\Documents\QWEN
                  </code>
                </div>

                <div className="border-l-2 border-orange-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 3: Включите VPN → Швеция</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Убедитесь что VPN подключен к серверу в Швеции.
                  </p>
                </div>

                <div className="border-l-2 border-orange-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 4: Запустите установку</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Откройте PowerShell <strong>от имени администратора</strong> и выполните:
                  </p>
                  <div className="bg-gray-800 rounded-lg p-3 mt-2 font-mono text-sm text-green-400">
                    <p>Set-ExecutionPolicy Bypass -Scope Process -Force</p>
                    <p>cd "C:\Users\finbo\Documents\QWEN"</p>
                    <p>.\install-claude-code.ps1</p>
                  </div>
                </div>

                <div className="border-l-2 border-green-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 5: Авторизация</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    После установки выполните:
                  </p>
                  <div className="bg-gray-800 rounded-lg p-3 mt-2 font-mono text-sm text-green-400">
                    <p>claude login</p>
                  </div>
                </div>

                <div className="border-l-2 border-green-700 pl-4">
                  <h4 className="font-bold text-white">Шаг 6: Запуск</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Для безопасного запуска используйте:
                  </p>
                  <div className="bg-gray-800 rounded-lg p-3 mt-2 font-mono text-sm text-green-400">
                    <p>start-claude.bat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative: BAT script */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 text-purple-400">🔄 Альтернатива: BAT-скрипт</h3>
              <p className="text-gray-400 text-sm mb-4">
                Также доступен BAT-скрипт <code className="bg-gray-800 px-1 rounded">create-files.bat</code> — 
                скачайте и запустите его, он автоматически создаст все файлы в нужной папке.
              </p>
              <a 
                href="/create-files.bat" 
                download
                className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
              >
                📥 Скачать create-files.bat
              </a>
            </div>
          </div>
        )}

        {/* Tab: Files */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            {Object.entries(FILES).map(([filename, content]) => (
              <div key={filename} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span>
                      {filename.endsWith('.ps1') ? '🔷' : filename.endsWith('.sh') ? '🐧' : filename.endsWith('.bat') ? '🟦' : '📄'}
                    </span>
                    <span className="font-mono text-sm text-gray-300">{filename}</span>
                    <span className="text-xs text-gray-600">({content.split('\n').length} строк)</span>
                  </div>
                  <button
                    onClick={() => downloadFile(filename, content)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    📥 Скачать
                  </button>
                </div>
                <pre className="p-4 text-xs text-gray-400 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                  {content.slice(0, 1000)}
                  {content.length > 1000 && '\n\n... (обрезано, скачайте файл для полного содержимого)'}
                </pre>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>Claude Code v2.1.332 • Все файлы готовы к скачиванию</p>
        </div>
      </footer>
    </div>
  );
}
