import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../engine/profile';
import { SolarStatus } from '../engine/solar';
import { ActivityItem } from '../engine/activities';
import { MetForecast } from '../engine/weather';
import {
  sendConciergeMessage,
  buildWeatherContext,
  ChatMessage,
} from '../engine/aiChat';
import { Send, Sun, Bot, User, MapPin, Sparkles, Loader2 } from 'lucide-react';

export interface MapNavigationTarget {
  query?: string;
  category?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

interface ConciergeChatProps {
  profile: UserProfile;
  solar: SolarStatus;
  activities: ActivityItem[];
  forecast?: MetForecast | null;
  onSelectActivity?: (activity: ActivityItem) => void;
  onNavigateToMap?: (target?: MapNavigationTarget) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  modelBadge?: string;
  suggestedAction?: {
    label: string;
    url?: string;
  };
}

export const ConciergeChat: React.FC<ConciergeChatProps> = ({
  profile,
  solar,
  activities: _activities,
  forecast,
  onSelectActivity: _onSelectActivity,
  onNavigateToMap,
}) => {
  const greetingName = profile.name === 'Gjest' || !profile.name ? '' : ` ${profile.name}`;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const weatherCtx = buildWeatherContext(solar, forecast);
  const isRaining = (weatherCtx.precipitationMm ?? 0) > 0.2;

  const childrenText =
    profile.children && profile.children.length > 0
      ? `\n\nSiden barna ${profile.children.map(c => `${c.name} (${c.age} år)`).join(' og ')} er med, tilpasser jeg turene for dem!`
      : '\n\nHer er noen herlige utflukter og kosestopp som gir maksimalt med sol og frisk luft!';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hei${greetingName}! ☀️ Jeg er Sol Concierge AI. Været i ${profile.city} nå er ${(weatherCtx.condition || 'opplett').toLowerCase()} (${weatherCtx.temperatureC}°C, ca. ${weatherCtx.lux?.toLocaleString('no-NO')} luks ute).${childrenText}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelBadge: 'Gemini 3.8 Flash',
    },
    {
      id: 'msg-2',
      sender: 'ai',
      text: isRaining
        ? `💡 Sanntidstips: Med litt bergensregn i luften er en varm time i Heit Fjordbadstue eller lun skogstur mot Skomakerdiket for kakao helt fantastisk. Hva har du lyst til å gjøre?`
        : `💡 Sanntidstips: Det er opplett og flott dagslys ute nå! Tippetue og Fløyen gir herlig lys og Byfjordutsikt. Skal jeg foreslå en rute?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelBadge: 'Gemini 3.8 Flash',
      suggestedAction: {
        label: isRaining ? 'Se badstuer og lune stopp' : 'Vis Fløyen-ruter på kartet',
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendPrompt = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isThinking) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const chatHistory: ChatMessage[] = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      chatHistory.push({ role: 'user', content: trimmed });

      const aiResponse = await sendConciergeMessage({
        messages: chatHistory,
        city: profile.city || 'Bergen',
        weather: weatherCtx,
        profile,
        provider: 'gemini',
      });

      const modelBadge = aiResponse.isFallback
        ? 'Lokal Sol Concierge'
        : aiResponse.provider === 'gemini'
        ? 'Gemini 3.8 Flash'
        : 'GPT-4o-mini';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelBadge,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Skulle aldri kastes da sendConciergeMessage har lokal fallback
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col h-[70dvh] min-h-[460px] md:h-[540px] overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      {/* Header med live status */}
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-500/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              Sol Concierge AI
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Sanntidsvær: {weatherCtx.condition} • {weatherCtx.temperatureC}°C • {profile.city}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-500/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500 dark:text-orange-400" />
          <span>Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Meldinger */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAFBFD] dark:bg-transparent">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              {msg.sender === 'ai' ? (
                <>
                  <Sun className="w-2.5 h-2.5 text-orange-500 dark:text-orange-400" />
                  <span>Sol AI</span>
                  {msg.modelBadge && (
                    <span className="px-1.5 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[9px] text-zinc-600 dark:text-zinc-400 font-mono">
                      {msg.modelBadge}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User className="w-2.5 h-2.5 text-zinc-400" />
                  <span>{profile.name || 'Deg'}</span>
                </>
              )}
              <span>• {msg.time}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white rounded-br-none shadow-md shadow-orange-500/20'
                  : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}

              {msg.suggestedAction && (
                <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                  <button
                    onClick={() => {
                      if (onNavigateToMap) {
                        const isSauna = msg.suggestedAction?.label.toLowerCase().includes('badstu');
                        if (isSauna) {
                          onNavigateToMap({ category: 'sports', query: 'badstue', lat: 60.3835, lng: 5.3312, zoom: 14 });
                        } else {
                          onNavigateToMap({ query: 'Fløyen', lat: 60.3980, lng: 5.3340, zoom: 15 });
                        }
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold border border-orange-400 shadow-sm shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span>{msg.suggestedAction.label}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              <Sun className="w-2.5 h-2.5 text-orange-500 animate-spin" />
              <span>Sol AI tenker...</span>
            </div>
            <div className="rounded-2xl px-4 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
              <span>Analyserer sanntidsvær og lokale ruter...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Raske vær-reaktive forslag */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">Hurtigvalg:</span>
        {isRaining ? (
          <>
            <button
              onClick={() => handleSendPrompt('Hva er den beste opplevelsen i regnet akkurat nå?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              🌧️ Best i regnværet
            </button>
            <button
              onClick={() => handleSendPrompt('Fortell om Heit fjordbadstue i dag')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              🔥 Varm Fjordbadstue
            </button>
            <button
              onClick={() => handleSendPrompt('Hvor kan vi gå tur under trærne i le for regnet?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              🌲 Lun skogssti
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSendPrompt('Hvor fanger vi mest dagslys i ettermiddag?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              ☀️ Mest dagslys i ettermiddag
            </button>
            <button
              onClick={() => handleSendPrompt('Hva passer best for barna i dag?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              👶 Tur med barna
            </button>
            <button
              onClick={() => handleSendPrompt('Hvilken kafé har best utsikt og kveldssol?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 text-[10px] shrink-0 border border-zinc-200 dark:border-zinc-700/60 transition shadow-sm"
            >
              ☕ Kafé & solnedgang
            </button>
          </>
        )}
      </div>

      {/* Inputfelt */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2 transition-colors">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendPrompt(input)}
          placeholder={`Spør Sol Concierge (f.eks. "Hva bør vi finne på i ettermiddag?")`}
          disabled={isThinking}
          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-60"
        />
        <button
          onClick={() => handleSendPrompt(input)}
          disabled={!input.trim() || isThinking}
          className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white transition shadow-md shadow-orange-500/20 cursor-pointer"
        >
          {isThinking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
