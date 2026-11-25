import { useState } from 'react';

type Step = {
  id: number;
  title: string;
  status: 'done' | 'active' | 'pending';
  content: React.ReactNode;
};

export default function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied === id ? '✓ Скопировано' : 'Копировать'}
      </button>
    </div>
  );

  const steps: Step[] = [
    {
      id: 1,
      title: 'Подключите VPN → Швеция',
      status: activeStep >= 0 ? 'active' : 'pending',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            API Anthropic блокирует запросы из России. Подключите VPN к серверу в Швеции.
          </p>
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">🌍 Рекомендуемые VPN-серверы:</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>🇸🇪 <strong>Швеция</strong> — стабильно, рекомендуется</li>
              <li>🇫🇮 <strong>Финляндия</strong> — ближайший, быстрый</li>
              <li>🇩🇪 <strong>Германия</strong> — стабильно</li>
              <li>🇳🇱 <strong>Нидерланды</strong> — стабильно</li>
            </ul>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">💳 Оплата картой Узбекистана:</h4>
            <p className="text-gray-300 text-sm">
              Перейдите на <code className="bg-gray-800 px-1 rounded">console.anthropic.com/settings/billing</code> с активным VPN. 
              Карты Humo, Uzcard, Visa/MC Узбекистана работают. Если оплата не проходит — попробуйте другой сервер VPN.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Установите Node.js ≥ 22',
      status: activeStep >= 1 ? 'done' : activeStep === 0 ? 'pending' : 'active',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Claude Code требует Node.js версии 22 или выше.</p>
          
          <div>
            <h4 className="text-white font-medium mb-2">Проверка версии:</h4>
            <CodeBlock code="node -v" id="check-node" />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Linux (Ubuntu/Debian):</h4>
            <CodeBlock 
              code={`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs`}
              id="install-node-linux"
            />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">macOS:</h4>
            <CodeBlock code="brew install node@22" id="install-node-mac" />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Windows:</h4>
            <CodeBlock code="winget install OpenJS.NodeJS.LTS" id="install-node-win" />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Установите Claude Code',
      status: activeStep >= 2 ? 'done' : activeStep === 1 ? 'pending' : 'active',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Установите пакет глобально через npm:</p>
          
          <CodeBlock code="npm install -g @anthropic-ai/claude-code" id="install-claude" />
          
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">✅ Или используйте авто-скрипт:</h4>
            <p className="text-gray-300 text-sm mb-2">
              Скачайте и запустите скрипт — он проверит всё автоматически:
            </p>
            <CodeBlock 
              code={`# Linux / macOS:
bash install-claude-code.sh

# Windows (PowerShell от администратора):
.\\install-claude-code.ps1`}
              id="auto-install"
            />
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Авторизуйтесь',
      status: activeStep >= 3 ? 'done' : activeStep === 2 ? 'pending' : 'active',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Выполните команду авторизации. Откроется браузер — войдите в аккаунт Anthropic.
          </p>
          
          <CodeBlock code="claude login" id="claude-login" />
          
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">🔑 Альтернатива — API-ключ:</h4>
            <p className="text-gray-300 text-sm mb-2">
              Если авторизация через браузер не работает:
            </p>
            <CodeBlock 
              code={`# Получите ключ: console.anthropic.com/settings/keys
export ANTHROPIC_API_KEY="sk-ant-ваш-ключ"
claude`}
              id="api-key"
            />
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Запустите Claude Code',
      status: activeStep >= 4 ? 'done' : activeStep === 3 ? 'pending' : 'active',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Готово! Запустите в папке проекта:</p>
          
          <CodeBlock 
            code={`cd ~/my-project
claude`}
            id="run-claude"
          />

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">📝 Полезные команды:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <code className="text-green-400 min-w-[200px]">claude</code>
                <span className="text-gray-400">— интерактивный режим</span>
              </div>
              <div className="flex gap-3">
                <code className="text-green-400 min-w-[200px]">claude "вопрос"</code>
                <span className="text-gray-400">— задать вопрос</span>
              </div>
              <div className="flex gap-3">
                <code className="text-green-400 min-w-[200px]">claude --plan "задача"</code>
                <span className="text-gray-400">— режим планирования</span>
              </div>
              <div className="flex gap-3">
                <code className="text-green-400 min-w-[200px]">claude config</code>
                <span className="text-gray-400">— настройки</span>
              </div>
            </div>
          </div>

          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🛡️ Безопасный запуск с проверкой VPN:</h4>
            <CodeBlock code="bash claude-safe.sh" id="safe-run" />
            <p className="text-gray-400 text-sm mt-2">
              Этот скрипт проверит VPN перед каждым запуском Claude Code.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">Claude Code</h1>
            <p className="text-xs text-gray-400">Установка для России • v2.1.332</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-800">
              ✓ Пакет установлен
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Status banner */}
        <div className="mb-8 bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-800/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div>
              <h2 className="text-lg font-bold text-orange-300">Пакет @anthropic-ai/claude-code v2.1.332 установлен в проект!</h2>
              <p className="text-gray-400 mt-1 text-sm">
                Теперь следуйте шагам ниже для установки на ваш компьютер и настройки работы через VPN.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">Node.js ≥ 22</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">VPN: Швеция</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">Карта: Узбекистан</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">Подписка: ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                activeStep === index
                  ? 'border-orange-700 bg-gray-900/80'
                  : activeStep > index
                  ? 'border-green-800/50 bg-gray-900/30'
                  : 'border-gray-800 bg-gray-900/30'
              }`}
            >
              <button
                onClick={() => setActiveStep(index)}
                className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  activeStep > index
                    ? 'bg-green-800 text-green-300'
                    : activeStep === index
                    ? 'bg-orange-700 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {activeStep > index ? '✓' : step.id}
                </div>
                <span className={`font-medium ${
                  activeStep >= index ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                <span className="ml-auto text-gray-600">
                  {activeStep === index ? '▼' : '▶'}
                </span>
              </button>
              
              {activeStep === index && (
                <div className="px-6 pb-6 pt-2">
                  {step.content}
                  <div className="mt-6 flex gap-3">
                    {index > 0 && (
                      <button
                        onClick={() => setActiveStep(index - 1)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        ← Назад
                      </button>
                    )}
                    {index < steps.length - 1 && (
                      <button
                        onClick={() => setActiveStep(index + 1)}
                        className="px-4 py-2 bg-orange-700 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Далее →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Files section */}
        <div className="mt-12 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">📁 Созданные файлы</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-3">
              <span className="text-2xl">📜</span>
              <div className="flex-1">
                <p className="font-mono text-sm text-green-400">install-claude-code.sh</p>
                <p className="text-xs text-gray-500">Скрипт автоустановки для Linux/macOS</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-3">
              <span className="text-2xl">📜</span>
              <div className="flex-1">
                <p className="font-mono text-sm text-blue-400">install-claude-code.ps1</p>
                <p className="text-xs text-gray-500">Скрипт автоустановки для Windows</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-3">
              <span className="text-2xl">🛡️</span>
              <div className="flex-1">
                <p className="font-mono text-sm text-yellow-400">claude-safe.sh</p>
                <p className="text-xs text-gray-500">Безопасный запуск с проверкой VPN</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-3">
              <span className="text-2xl">📖</span>
              <div className="flex-1">
                <p className="font-mono text-sm text-purple-400">README-CLAUDE-CODE.md</p>
                <p className="text-xs text-gray-500">Полная документация и решение проблем</p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 border border-red-900/50 rounded-xl p-6 bg-red-950/20">
          <h3 className="text-lg font-bold mb-4 text-red-400">⚠️ Частые проблемы</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-white">Ошибка "API connection failed"</p>
              <p className="text-gray-400">→ VPN отключился. Проверьте: <code className="bg-gray-800 px-1 rounded">curl https://ipinfo.io/country</code></p>
            </div>
            <div>
              <p className="font-medium text-white">Ошибка "Authentication failed"</p>
              <p className="text-gray-400">→ Перелогиньтесь: <code className="bg-gray-800 px-1 rounded">claude login --force</code></p>
            </div>
            <div>
              <p className="font-medium text-white">Оплата картой не проходит</p>
              <p className="text-gray-400">→ Смените сервер VPN (Финляндия/Германия). Проверьте 3D Secure.</p>
            </div>
            <div>
              <p className="font-medium text-white">command not found: claude</p>
              <p className="text-gray-400">→ <code className="bg-gray-800 px-1 rounded">export PATH="$PATH:$(npm prefix -g)/bin"</code></p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>Claude Code v2.1.332 • Anthropic © 2025</p>
          <p className="mt-1">
            <a href="https://docs.anthropic.com/en/docs/claude-code" className="text-gray-500 hover:text-gray-400 underline">
              Документация
            </a>
            {' • '}
            <a href="https://github.com/anthropics/claude-code" className="text-gray-500 hover:text-gray-400 underline">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
