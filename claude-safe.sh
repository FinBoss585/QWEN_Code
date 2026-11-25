#!/usr/bin/env bash
# ============================================================
#  claude-safe — запуск Claude Code с проверкой VPN
#  Используйте вместо 'claude' для безопасного запуска
# ============================================================

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Блокируемые страны для API Anthropic
BLOCKED=("RU" "BY" "CN" "IR" "KP" "CU" "SY" "VE")

echo -e "${BLUE}🔍 Проверяем подключение...${NC}"

# Проверка интернета
if ! curl -s --connect-timeout 5 https://api.anthropic.com > /dev/null 2>&1; then
    echo -e "${RED}✗ Нет подключения к api.anthropic.com${NC}"
    echo -e "${YELLOW}  Проверьте интернет и VPN${NC}"
    exit 1
fi

# Определяем IP и страну
RESPONSE=$(curl -s --connect-timeout 5 https://ipinfo.io/json 2>/dev/null)

if [ -z "$RESPONSE" ]; then
    echo -e "${YELLOW}⚠ Не удалось определить IP. Запускаем без проверки...${NC}"
    exec claude "$@"
fi

IP=$(echo "$RESPONSE" | grep -o '"ip": "[^"]*"' | cut -d'"' -f4)
COUNTRY=$(echo "$RESPONSE" | grep -o '"country": "[^"]*"' | cut -d'"' -f4)
CITY=$(echo "$RESPONSE" | grep -o '"city": "[^"]*"' | cut -d'"' -f4)
ORG=$(echo "$RESPONSE" | grep -o '"org": "[^"]*"' | cut -d'"' -f4)

echo -e "${GREEN}✓ IP: ${IP}${NC}"
echo -e "${GREEN}✓ Страна: ${COUNTRY} (${CITY})${NC}"
echo -e "${GREEN}✓ Провайдер: ${ORG}${NC}"

# Проверяем блокировку
for blocked in "${BLOCKED[@]}"; do
    if [ "$COUNTRY" = "$blocked" ]; then
        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ⚠ ОБНАРУЖЕНА БЛОКИРУЕМАЯ СТРАНА: ${COUNTRY}             ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}  Claude Code НЕ будет работать из ${COUNTRY}.${NC}"
        echo -e "${YELLOW}  Подключите VPN к серверу в:${NC}"
        echo -e "    ${CYAN}🇸🇪 Швеция (рекомендуется)${NC}"
        echo -e "    ${CYAN}🇫🇮 Финляндия${NC}"
        echo -e "    ${CYAN}🇩🇪 Германия${NC}"
        echo -e "    ${CYAN}🇳🇱 Нидерланды${NC}"
        echo ""
        echo -e "${YELLOW}  После подключения к VPN запустите снова:${NC}"
        echo -e "  ${GREEN}bash claude-safe.sh${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ VPN активен — можно работать!               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Запускаем Claude Code с переданными аргументами
exec claude "$@"
