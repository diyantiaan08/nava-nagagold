import { Message } from '../types/chat';
import { useTheme } from '../context/ThemeContext';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-700 dark:bg-gray-600' : colors.primary}`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className={`px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-gray-700 dark:bg-gray-600 text-white rounded-tr-sm'
            : `${colors.secondary} text-gray-800 dark:text-gray-100 rounded-tl-sm`
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
