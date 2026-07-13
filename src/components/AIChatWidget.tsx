import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { aiService } from '../services/aiService';
import { MessageCircle, X, Send, Loader2, Bot, Minimize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT = `You are the Afriquecon AI Travel Assistant, a friendly and knowledgeable helper for Afriquecon Plc — a cross-border transport company operating between Cameroon and Nigeria.

Key facts you know:
- Routes: Douala ↔ Lagos, Yaoundé ↔ Abuja, and surrounding cities
- Cargo pricing: 1,000 FCFA / kg flat rate (≥100 kg negotiated). Heavy equipment: +15% surcharge. Express (<48h before departure): +20% surcharge.
- Passenger fares: Douala↔Lagos ~15,000–25,000 FCFA. Yaoundé↔Abuja ~20,000–30,000 FCFA.
- Ticket discounts: Student 10%, Senior (60+) 15%, Child (<12) 20%
- Free luggage: 20 kg per passenger. Extra: 1,000 FCFA / 2,500 ₦ per kg.
- Bus capacity: 48 seats per bus
- Payment: Paystack (NGN) or Flutterwave (FCFA)
- Tracking: Real-time via Telegram @Afriquecon_bot
- Customs clearance: 12–24 hours typical
- Restricted cargo: No containerized, refrigerated, hazardous or restricted items
- Ticket validity: 1 month. Date changes: must confirm 48h before departure. Cancellations: 35% admin fee.
- Contact/Support: Telegram @Afriquecon_bot (24/7)

Rules:
- Only answer questions about Afriquecon services, routes, pricing, baggage, booking, tracking, customs, and policies.
- If asked something outside this scope, politely redirect to Afriquecon topics.
- Be concise, friendly, and helpful. Use emojis sparingly.
- Always suggest the Telegram bot @Afriquecon_bot for live support.
- Do NOT make up specific schedule times — tell users to check the website or Telegram bot for live schedules.

User message: `;

export default function AIChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!hasOpened) {
      setHasOpened(true);
      setMessages([{ role: 'assistant', text: t('ai.welcome') }]);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { text } = await aiService.generateText(SYSTEM_PROMPT + trimmed);
      setMessages(prev => [...prev, { role: 'assistant', text: text || t('ai.error') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: t('ai.error') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-14 w-72' : 'w-80 sm:w-96 h-[480px]'
          }`}
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm leading-none">{t('ai.assistant')}</div>
                <div className="text-blue-200 text-xs mt-0.5">{t('ai.poweredBy')}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(m => !m)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={t('ai.minimize')}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-white/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-gray-800 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('ai.thinking')}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-white/10 px-3 py-3 bg-gray-900/80 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai.placeholder')}
                    disabled={loading}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                    title={t('ai.send')}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.5)' }}
          aria-label={t('ai.assistant')}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40 pointer-events-none" />
          {/* Tooltip */}
          <span className="absolute right-16 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t('ai.assistant')}
          </span>
        </button>
      )}
    </div>
  );
}
