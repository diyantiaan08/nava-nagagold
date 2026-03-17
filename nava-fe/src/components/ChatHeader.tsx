import { RefreshCw, Moon, Sun, Settings2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { isManualConnectionSettingsEnabled } from '../lib/connectionSettings';

interface ChatHeaderProps {
  onReset: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
}

export function ChatHeader({ onReset, onToggleSettings, isSettingsOpen }: ChatHeaderProps) {
  const { colors, darkMode, setDarkMode } = useTheme();
  const settingsEnabled = isManualConnectionSettingsEnabled();

  return (
    <div className={`bg-gradient-to-r ${colors.gradient} text-white p-4 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">NAVA EXPERT</h1>
          <p className="text-sm text-white/80">Asisten Cerdas untuk Toko Emas Anda</p>
        </div>

        <div className="flex items-center gap-2">
          {settingsEnabled && (
            <button
              onClick={onToggleSettings}
              className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Pengaturan Koneksi"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onReset}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Reset Percakapan"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDarkMode(darkMode === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={darkMode === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {darkMode === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
