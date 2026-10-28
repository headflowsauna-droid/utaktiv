/**
 * Sol Concierge AI Klientservice for Utaktiv
 * Kommuniserer sikkert med server-side proxy (/api/chat.php) som benytter
 * Google Gemini 3.8 Flash og OpenAI GPT-4o-mini.
 * Inkluderer intelligent offline-fallback basert på sanntidsvær og pedagogisk veiledning.
 */

import { UserProfile } from './profile';
import { SolarStatus } from './solar';
import { MetForecast } from './weather';

export interface WeatherChatContext {
  temperatureC?: number;
  cloudCoverPercent?: number;
  precipitationMm?: number;
  lux?: number;
  condition?: string;
  windMps?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendChatOptions {
  messages: ChatMessage[];
  city?: string;
  weather?: WeatherChatContext;
  profile?: UserProfile;
  provider?: 'gemini' | 'openai';
}

export interface AIResponse {
  success: boolean;
  reply: string;
  model?: string;
  provider?: string;
  isFallback?: boolean;
}

/**
 * Bygg et værobjekt fra live SolarStatus og eventuell MetForecast
 */
export function buildWeatherContext(
  solar: SolarStatus,
  forecast?: MetForecast | null
): WeatherChatContext {
  const precip = forecast?.precipitationMm ?? 0;
  const temp = forecast?.temperatureC ?? (typeof solar.temperatureC === 'number' ? solar.temperatureC : 9);
  const cloud = forecast?.cloudCoverPercent ?? solar.cloudCoverPercent;
  const wind = forecast?.windMps ?? 3;
  const lux = solar.actualEstimatedLux > 0 ? solar.actualEstimatedLux : 5000;

  let condition = 'Varierende';
  if (precip > 1.0) condition = 'Regnbyger';
  else if (precip > 0.1) condition = 'Lett yr';
  else if (cloud <= 30) condition = 'Klart og solrikt';
  else if (cloud <= 65) condition = 'Lettskyet opplett';
  else condition = 'Overskyet opplett';

  return {
    temperatureC: temp,
    cloudCoverPercent: cloud,
    precipitationMm: precip,
    lux,
    condition,
    windMps: wind,
  };
}

/**
 * Send melding til Sol Concierge AI med automatisk timeout og lokal fallback
 */
export async function sendConciergeMessage(
  options: SendChatOptions,
  endpoint = '/api/chat.php'
): Promise<AIResponse> {
  const { messages, city = 'Bergen', weather, profile, provider = 'gemini' } = options;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

  try {
    const payload = {
      messages,
      city,
      weather: weather || {},
      profile: profile
        ? {
            name: profile.name,
            children: profile.children?.map(c => ({ name: c.name, age: c.age })),
            strollerNeeded: profile.children?.some(c => c.needsStroller),
            activityPreferences: profile.activityPreferences,
          }
        : undefined,
      provider,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        let replyText = String(data.reply).trim();
        // Sikre at setningen ikke er avkuttet midt i et ord
        if (!/[.!?»"”)]$/.test(replyText)) {
          const lastPeriod = Math.max(
            replyText.lastIndexOf('.'),
            replyText.lastIndexOf('!'),
            replyText.lastIndexOf('?')
          );
          if (lastPeriod > 40) {
            replyText = replyText.substring(0, lastPeriod + 1);
          }
        }

        return {
          success: true,
          reply: replyText,
          model: data.model || 'gemini-3.8-flash',
          provider: data.provider || provider,
          isFallback: false,
        };
      }
    }
  } catch (_err) {
    // Fortsett til trygg lokal fallback
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Intelligent lokal fallback med dyp forankring i dagslys, vær og pedagogikk
  const fallbackReply = generateLocalFallbackReply(messages, city, weather, profile);
  return {
    success: true,
    reply: fallbackReply,
    model: 'lokal-sol-concierge',
    provider: 'local',
    isFallback: true,
  };
}

/**
 * Genererer et realistisk, vakkert og pedagogisk svar hvis nettverket er nede
 */
export function generateLocalFallbackReply(
  messages: ChatMessage[],
  city: string,
  weather?: WeatherChatContext,
  profile?: UserProfile
): string {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
  const precip = weather?.precipitationMm ?? 0;
  const isRaining = precip > 0.2;
  const lux = weather?.lux ?? 6500;
  const temp = weather?.temperatureC ?? 9;

  const childNames = profile?.children && profile.children.length > 0
    ? profile.children.map(c => c.name).join(' og ')
    : '';

  if (lastUserMsg.includes('regn') || isRaining) {
    if (city.toLowerCase().includes('eidfjord')) {
      return `I Eidfjord er det perfekt å søke lunhet ved fjorden i dag! Med ${temp}°C og litt vestlandsregn anbefaler jeg en tur innom Sjel & Gane for varm suppe og nysteikt bakst, eller bestille en time i Heit Eidfjord Fjordbadstue der dere kan sitte lunt med panoramautsikt over fjorden.`;
    }
    return `Selv med ${precip > 0 ? `${precip} mm regn` : 'regn i luften'} i ${city} er dagslyset ute (~${lux.toLocaleString('no-NO')} luks) mange ganger sterkere enn innelys! Ta på regntøy og gå en lun tur under trekronene mot Skomakerdiket på Fløyen for en varm skillingsbolle, eller unn deg en varm time i Heit Fjordbadstue ved Puddefjorden.`;
  }

  if (lastUserMsg.includes('barn') || lastUserMsg.includes('familie') || childNames) {
    return `For ${childNames || 'barna'} er Trollskogen og lekeplassen på Fløyen midt i blinken nå! Været gir et fint opplett-vindu (${temp}°C), og stiene er supre for både små føtter og barnevogn. La barna være turledere – det skaper ekte mestringsfølelse!`;
  }

  if (lastUserMsg.includes('kaffe') || lastUserMsg.includes('bolle') || lastUserMsg.includes('utsikt')) {
    return `Ta turen opp Tippetue mot Fløistuen Kafé! Der får dere fantastisk vestvendt utsikt over Byfjorden og askøylandet, nystekte boller og akkurat det dagslysløftet hjernen trenger for kveldens søvnrytme.`;
  }

  return `Akkurat nå i ${city} har vi ca. ${lux.toLocaleString('no-NO')} luks dagslys og ${temp}°C. ${
    isRaining
      ? 'Det regner litt, så lune skogsløyper eller en varm fjordbadstue gir den beste opplevelsen.'
      : 'Det er fint opplett nå – et ypperlig vindu for en rask dagslystur langs Fløyen eller Nordnesparken!'
  } Skal jeg vise deg ruten på kartet?`;
}
