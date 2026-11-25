#!/usr/bin/env bash
# ============================================================
#  Установка Claude Code — для работы из России через VPN
#  Версия: 2.1.332
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Установка Claude Code (для России + VPN)     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Шаг 1: Проверка Node.js ──────────────────────────────────
echo -e "${YELLOW}[1/5] Проверка Node.js...${NC}"

NODE_VERSION=""
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
fi

if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}  ✗ Node.js не найден или версия < 22${NC}"
    echo -e "${YELLOW}  → Устанавливаем Node.js 22 через NodeSource...${NC}"
    
    # Удаляем старую версию если есть
    if command -v node &> /dev/null; then
        echo "  Удаляем старый Node.js..."
        sudo apt-get remove -y nodejs 2>/dev/null || true
    fi
    
    # Установка Node.js 22
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo -e "${GREEN}  ✓ Node.js $(node -v) установлен${NC}"
else
    echo -e "${GREEN}  ✓ Node.js $(node -v) уже установлен${NC}"
fi

# ── Шаг 2: Проверка VPN ──────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Проверка VPN-подключения...${NC}"

# Определяем страну по IP
COUNTRY=$(curl -s https://ipinfo.io/country 2>/dev/null || echo "UNKNOWN")
IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || echo "UNKNOWN")

echo -e "  IP: ${IP}"
echo -e "  Страна: ${COUNTRY}"

BLOCKED_COUNTRIES=("RU" "BY" "CN" "IR" "KP" "CU" "SY")
IS_BLOCKED=false

for blocked in "${BLOCKED_COUNTRIES[@]}"; do
    if [ "$COUNTRY" = "$blocked" ]; then
        IS_BLOCKED=true
        break
    fi
done

if [ "$IS_BLOCKED" = true ]; then
    echo -e "${RED}  ✗ Обнаружена блокируемая страна: ${COUNTRY}${NC}"
    echo -e "${YELLOW}  ⚠ Включите VPN (рекомендуется Швеция) и перезапустите скрипт${NC}"
    echo ""
    echo -e "  Рекомендуемые VPN-сервисы для Швеции:"
    echo -e "    • Mullvad VPN — https://mullvad.net (есть оплата криптой)"
    echo -e "    • NordVPN — сервер Швеции"
    echo -e "    • ExpressVPN — сервер Швеции"
    echo ""
    echo -e "  После подключения к VPN Швеции запустите:"
    echo -e "  ${GREEN}bash install-claude-code.sh${NC}"
    exit 1
else
    echo -e "${GREEN}  ✓ VPN активен, страна: ${COUNTRY} — доступно${NC}"
fi

# ── Шаг 3: Установка Claude Code ─────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Установка @anthropic-ai/claude-code...${NC}"

npm install -g @anthropic-ai/claude-code

echo -e "${GREEN}  ✓ Claude Code установлен глобально${NC}"

# ── Шаг 4: Настройка переменных окружения ────────────────────
echo ""
echo -e "${YELLOW}[4/5] Настройка переменных окружения...${NC}"

SHELL_RC=""
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

# Добавляем переменные если их ещё нет
if [ -n "$SHELL_RC" ] && ! grep -q "CLAUDE_CODE" "$SHELL_RC" 2>/dev/null; then
    cat >> "$SHELL_RC" << 'ENVCHECK'

# ── Claude Code Configuration ──
# VPN/прокси для API Anthropic (если нужно)
# export HTTP_PROXY="http://127.0.0.1:7890"
# export HTTPS_PROXY="http://127.0.0.1:7890"
# export NO_PROXY="localhost,127.0.0.1"

# Язык интерфейса
export LANG="en_US.UTF-8"
ENVCHECK
    echo -e "${GREEN}  ✓ Переменные окружения добавлены в ${SHELL_RC}${NC}"
else
    echo -e "${GREEN}  ✓ Переменные окружения уже настроены${NC}"
fi

# ── Шаг 5: Проверка ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Проверка установки...${NC}"

if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "installed")
    echo -e "${GREEN}  ✓ Claude Code доступен: ${CLAUDE_VERSION}${NC}"
else
    echo -e "${YELLOW}  ⚠ Команда 'claude' не найдена в PATH${NC}"
    echo -e "  Попробуйте: export PATH=\"\$PATH:\$(npm prefix -g)/bin\""
fi

# ── Готово ───────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✓ Установка завершена!              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Следующие шаги:${NC}"
echo ""
echo -e "  1. Убедитесь что VPN подключён к Швеции"
echo -e "  2. Выполните авторизацию:"
echo -e "     ${GREEN}claude login${NC}"
echo -e "  3. Запустите Claude Code:"
echo -e "     ${GREEN}claude${NC}"
echo ""
echo -e "  ${BLUE}Полезные команды:${NC}"
echo -e "     claude              — интерактивный режим"
echo -e "     claude 'вопрос'     — задать вопрос"
echo -e "     claude config       — настройки"
echo -e "     claude --help       — помощь"
echo ""
