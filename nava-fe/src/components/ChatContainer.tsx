import { useState, useRef, useEffect } from 'react';
import { Message } from '../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ConnectionSettingsPanel } from './ConnectionSettingsPanel';
import { ConfirmResetDialog } from './ConfirmResetDialog';
import {
  isManualConnectionSettingsEnabled,
  resolveConnectionSettings,
  resetManualConnectionSettings,
} from '../lib/connectionSettings';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [connectionRevision, setConnectionRevision] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { colors } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isManualConnectionSettingsEnabled()) return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'nava_manual_backend_url') {
        setConnectionRevision((current) => current + 1);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    const connection = resolveConnectionSettings();
    const baseUrl = `${connection.apiBase.replace(/\/$/, '')}/stream/ask`;
    const url = `${baseUrl}?question=${encodeURIComponent(content)}&context_key=default`;

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, content: '', role: 'assistant', timestamp: new Date() }]);

    try {
      // Ensure browser sends cookies for same-site session auth
      // EventSource supports passing { withCredentials: true }
      const es = new EventSource(url, { withCredentials: true } as any);

        es.onmessage = (e) => {
          const text = e.data || '';
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)));
        };

        // Debug events from server (internal info) - won't be appended to UI
        es.addEventListener('debug', (e: MessageEvent) => {
          try {
            console.debug('SSE debug:', JSON.parse(String(e.data)));
          } catch (err) {
            console.debug('SSE debug (raw):', e.data);
          }
        });

        // Final 'done' event - server signals stream completion explicitly
        es.addEventListener('done', () => {
          try {
            es.close();
          } catch {}
          setIsLoading(false);
        });

        es.onerror = () => {
          // Close connection and stop loading when stream ends or on error
          try {
            es.close();
          } catch {}
          setIsLoading(false);
        };
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Maaf, terjadi kesalahan saat menghubungi server.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    setMessages([]);
    setIsResetDialogOpen(false);
  };

  const handleSettingsSaved = () => {
    setConnectionRevision((current) => current + 1);
  };

  const handleSettingsReset = () => {
    resetManualConnectionSettings();
    setConnectionRevision((current) => current + 1);
  };

  const settingsEnabled = isManualConnectionSettingsEnabled();
  void connectionRevision;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <ChatHeader
        onReset={handleReset}
        onToggleSettings={() => setIsSettingsOpen((current) => !current)}
        isSettingsOpen={isSettingsOpen}
      />
      {settingsEnabled && (
        <ConnectionSettingsPanel
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={handleSettingsSaved}
          onReset={handleSettingsReset}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center mb-4`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Selamat Datang di NAVA EXPERT
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Tanyakan apa saja tentang data toko emas Anda. Saya siap membantu Anda dengan informasi yang Anda butuhkan.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.primary}`}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${colors.secondary}`}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
      <ConfirmResetDialog
        open={isResetDialogOpen}
        onCancel={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
