import { useState } from "react";

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isVisible, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    autoSave: true,
    autoSaveDelay: 2000,
    theme: "dark",
    fontSize: 14,
    showLineNumbers: false,
  });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white">⚙️ Configurações</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Fechar
        </button>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Editor Settings */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">📝 Editor</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Auto-save</label>
                <p className="text-sm text-gray-400">Salva automaticamente após período de inatividade</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.autoSave && (
              <div>
                <label className="text-white font-medium block mb-2">
                  Delay do Auto-save: {settings.autoSaveDelay}ms
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="500"
                  value={settings.autoSaveDelay}
                  onChange={(e) => setSettings({ ...settings, autoSaveDelay: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <label className="text-white font-medium block mb-2">Tamanho da Fonte: {settings.fontSize}px</label>
              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Números de Linha</label>
                <p className="text-sm text-gray-400">Mostrar números de linha no editor</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => setSettings({ ...settings, showLineNumbers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">🎨 Aparência</h2>
          
          <div>
            <label className="text-white font-medium block mb-2">Tema</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
            >
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">ℹ️ Sobre</h2>
          <div className="text-gray-300 space-y-2">
            <p><strong>NexusNote</strong> v0.2.0</p>
            <p>Editor de notas Markdown com links bidirecionais</p>
            <p className="text-sm text-gray-400">Desenvolvido com ❤️ para a comunidade PKM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

