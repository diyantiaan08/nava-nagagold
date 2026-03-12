import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { colors } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan sesuatu tentang toko emas Anda..."
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`p-3 rounded-full text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${colors.gradient} ${colors.hover}`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
