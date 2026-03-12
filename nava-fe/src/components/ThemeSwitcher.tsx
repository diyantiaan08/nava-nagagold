import { Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/chat';
import { useState } from 'react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { name: Theme; label: string; color: string }[] = [
    { name: 'blue', label: 'Biru', color: 'bg-blue-600' },
    { name: 'orange', label: 'Orange', color: 'bg-orange-600' },
    { name: 'green', label: 'Hijau', color: 'bg-green-600' },
    { name: 'purple', label: 'Ungu', color: 'bg-purple-600' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Ganti Tema"
      >
        <Palette className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setTheme(t.name);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  theme === t.name ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${t.color}`} />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
