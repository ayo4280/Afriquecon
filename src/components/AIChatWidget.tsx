import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { aiService } from "../services/aiService";
import { supabase } from "../lib/supabase";
import { MessageCircle, X, Send, Loader2, Bot, Minimize2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

function buildScheduleSection(routes: any[]): string {
  if (!routes.length) return "- No schedule data available.";
  return routes.map(r =>
    `  - ${r.origin} to ${r.destination}: ${r.departure_days ?? "days TBC"}${r.departure_time ? " at " + r.departure_time : ""}`
  ).join("\n");
}

function buildAgenciesSection(agencies: any[]): string {
  if (!agencies.length) return "- No agency data available.";
  const byCountry: Record<string, any[]> = {};
  for (const a of agencies) {
    const c = a.country || "Unknown";
    (byCountry[c] = byCountry[c] || []).push(a);
  }
  return Object.entries(byCountry).map(([country, list]) => {
    const lines = list.map(a =>
      `    - ${a.name}${a.city ? " (" + a.city + ")" : ""}: ${a.address ?? ""}${a.phone ? " | Tel: " + a.phone : ""}`
    ).join("\n");
    return `  ${country}:\n${lines}`;
  }).join("\n");
}

function buildSystemPrompt(routes: any[], agencies: any[]): string {
  return `You are the Afriquecon AI Travel Assistant — concise, friendly, accurate. Afriquecon Plc is a cross-border transport company between Cameroon and Nigeria.

LIVE BUS SCHEDULE:
${buildScheduleSection(routes)}

AFRIQUECON AGENCIES & CONTACTS:
${buildAgenciesSection(agencies)}

GENERAL FACTS:
- Cargo: 1,000 FCFA/kg (>=100 kg negotiated). Heavy: +15%. Express (<48h): +20%.
- Fares: Douala-Lagos ~15,000-25,000 FCFA; Yaounde-Abuja ~20,000-30,000 FCFA.
- Discounts: Student 10%, Senior 15%, Child (<12) 20%.
- Free luggage: 20 kg/person. Extra: 1,000 FCFA or 2,500 NGN/kg.
- Bus capacity: 48 seats. Payment: Paystack (NGN) or Flutterwave (FCFA).
- Tracking: Telegram @Afriquecon_bot (24/7). Customs: 12-24 hours.
- No containerized, refrigerated, hazardous cargo.
- Ticket validity: 1 month. Date change: 48h notice. Cancellation: 35% fee.

RULES:
- Answer ONLY about Afriquecon services, schedules, agencies, pricing, booking, cargo, policies.
- Be SHORT: max 3-4 sentences unless listing data.
- Use the LIVE data above for schedules and agency questions — do not guess.
- Redirect off-topic questions politely back to Afriquecon topics.
- Suggest Telegram @Afriquecon_bot for live support.

User message: `;
}

export default function AIChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("routes").select("origin, destination, departure_days, departure_time").eq("active", true).order("origin"),
      supabase.from("agencies").select("name, city, country, address, phone").order("country"),
    ]).then(([routesRes, agenciesRes]) => {
      setSystemPrompt(buildSystemPrompt(routesRes.data ?? [], agenciesRes.data ?? []));
    }).catch(() => {
      setSystemPrompt(buildSystemPrompt([], []));
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      setMessages([{ role: "assistant", text: t("ai.welcome") }]);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !systemPrompt) return;
    const userMsg: Message = { role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { text } = await aiService.generateText(systemPrompt + trimmed);
      setMessages(prev => [...prev, { role: "assistant", text: text || t("ai.error") }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: t("ai.error") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isReady = systemPrompt !== null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className={`bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${isMinimized ? "h-14 w-72" : "w-80 sm:w-96 h-[480px]"}`}
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm leading-none">{t("ai.assistant")}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-green-400 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-blue-200 text-xs">{isReady ? t("ai.poweredBy") : "Loading data..."}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(m => !m)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title={t("ai.minimize")}>
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-100 rounded-bl-sm border border-white/5"}`}>
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
                        <span>{t("ai.thinking")}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-white/10 px-3 py-3 bg-gray-900/80 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isReady ? t("ai.placeholder") : "Loading live data..."}
                    disabled={loading || !isReady}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading || !isReady}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                    title={t("ai.send")}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleOpen}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          style={{ boxShadow: "0 4px 24px rgba(59,130,246,0.5)" }}
          aria-label={t("ai.assistant")}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40 pointer-events-none" />
          <span className="absolute right-16 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t("ai.assistant")}
          </span>
        </button>
      )}
    </div>
  );
}
