/**
 * useTurKurv — Custom React hook for Utaktiv sin "tur-kurv"
 * Fungerer som en handlevogn for planlagte turstopp.
 * Persisteres i localStorage under nøkkelen `utaktiv_tur_kurv` og synkroniseres til Supabase ved innlogging.
 */

import { useState, useCallback, useEffect } from 'react';
import { ActivityItem } from '../engine/activities';
import { pushTurKurv } from '../engine/cloudSync';

export interface TurStop {
  activityId: string;
  title: string;
  locationName: string;
  scheduledTime?: string;   // "14:30"
  scheduledDate?: string;   // "2026-10-25"
  imageUrl?: string;
  preBooked: boolean;       // har brukeren pre-booket noe her?
  preBookingNote?: string;  // "2x Skillingsbolle & kaffe + Fjordbadstue etter turen"
  basePriceNok?: number;    // Evt. billettpris på selve aktiviteten
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TurKurv {
  stops: TurStop[];
  city: string;
  createdAt: string;
}

const STORAGE_KEY = 'utaktiv_tur_kurv';

const EMPTY_KURV: TurKurv = {
  stops: [],
  city: 'Bergen',
  createdAt: new Date().toISOString(),
};

export function isTurKurv(val: unknown): val is TurKurv {
  if (!val || typeof val !== 'object') return false;
  const candidate = val as Partial<TurKurv>;
  return Array.isArray(candidate.stops) && typeof candidate.city === 'string';
}

/**
 * Koder en TurKurv + vennens navn til en kompakt, URL-sikker base64-streng
 * slik at hele ruten kan deles direkte via lenke (?tur=...) selv uten innlogging.
 */
export function encodeTurSharePayload(kurv: TurKurv, friendName?: string): string {
  try {
    const compact = {
      c: kurv.city,
      f: friendName || '',
      s: kurv.stops.map(st => ({
        i: st.activityId,
        t: st.title,
        l: st.locationName,
        tm: st.scheduledTime || '',
        dt: st.scheduledDate || '',
        im: st.imageUrl || '',
        pb: st.preBooked ? 1 : 0,
        pn: st.preBookingNote || '',
      })),
    };
    const json = JSON.stringify(compact);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

/**
 * Dekoder en URL-sikker ?tur=... parameter tilbake til TurKurv + vennens navn.
 */
export function decodeTurSharePayload(encoded: string): { kurv: TurKurv; friendName?: string } | null {
  try {
    if (!encoded || !encoded.trim()) return null;
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.s)) return null;

    const stops: TurStop[] = parsed.s.map((item: Record<string, unknown>) => ({
      activityId: String(item.i || `stop-${Math.random().toString(36).slice(2, 7)}`),
      title: String(item.t || ''),
      locationName: String(item.l || ''),
      scheduledTime: item.tm ? String(item.tm) : undefined,
      scheduledDate: item.dt ? String(item.dt) : undefined,
      imageUrl: item.im ? String(item.im) : undefined,
      preBooked: Boolean(item.pb),
      preBookingNote: item.pn ? String(item.pn) : undefined,
    }));

    return {
      kurv: {
        city: String(parsed.c || 'Bergen'),
        stops,
        createdAt: new Date().toISOString(),
      },
      friendName: parsed.f ? String(parsed.f) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Bygger en fullstendig delbar URL for turen.
 */
export function buildTurShareUrl(kurv: TurKurv, friendName?: string, baseOrigin?: string): string {
  const origin =
    baseOrigin ||
    (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin + window.location.pathname
      : 'https://utaktiv.no/');
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const payload = encodeTurSharePayload(kurv, friendName);
  if (!payload) return cleanOrigin;
  return `${cleanOrigin}/?tur=${payload}`;
}

function loadFromStorage(): TurKurv {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TurKurv;
        if (parsed && Array.isArray(parsed.stops)) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return { ...EMPTY_KURV, createdAt: new Date().toISOString() };
}

function saveToStorage(kurv: TurKurv): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kurv));
    }
  } catch {
    // ignore write errors
  }
}

export interface UseTurKurvReturn {
  kurv: TurKurv;
  addStop: (activity: ActivityItem, note?: string) => void;
  removeStop: (activityId: string) => void;
  updateStop: (activityId: string, updates: Partial<TurStop>) => void;
  moveStop: (activityId: string, direction: 'left' | 'right') => void;
  clearKurv: () => void;
  importSharedKurv: (shared: TurKurv) => void;
  isEmpty: boolean;
  count: number;
}

export function useTurKurv(): UseTurKurvReturn {
  const [kurv, setKurv] = useState<TurKurv>(loadFromStorage);

  // Sync til localStorage og best-effort Supabase ved endringer
  useEffect(() => {
    saveToStorage(kurv);
    void pushTurKurv(kurv);
  }, [kurv]);

  const addStop = useCallback((activity: ActivityItem, note?: string) => {
    setKurv(prev => {
      if (prev.stops.some(s => s.activityId === activity.id)) {
        return prev;
      }
      const newStop: TurStop = {
        activityId: activity.id,
        title: activity.title,
        locationName: activity.locationName,
        scheduledTime: activity.time,
        scheduledDate: activity.date,
        imageUrl: activity.imageUrl,
        preBooked: Boolean(note && note.trim()),
        preBookingNote: note,
        basePriceNok: activity.ticket?.priceNok || 0,
        coordinates: activity.coordinates,
      };
      return {
        ...prev,
        city: activity.city || prev.city,
        stops: [...prev.stops, newStop],
      };
    });
  }, []);

  const removeStop = useCallback((activityId: string) => {
    setKurv(prev => ({
      ...prev,
      stops: prev.stops.filter(s => s.activityId !== activityId),
    }));
  }, []);

  const updateStop = useCallback((activityId: string, updates: Partial<TurStop>) => {
    setKurv(prev => ({
      ...prev,
      stops: prev.stops.map(s =>
        s.activityId === activityId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const moveStop = useCallback((activityId: string, direction: 'left' | 'right') => {
    setKurv(prev => {
      const idx = prev.stops.findIndex(s => s.activityId === activityId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.stops.length) return prev;
      const nextStops = [...prev.stops];
      const [moved] = nextStops.splice(idx, 1);
      nextStops.splice(targetIdx, 0, moved);
      return {
        ...prev,
        stops: nextStops,
      };
    });
  }, []);

  const clearKurv = useCallback(() => {
    const fresh: TurKurv = { stops: [], city: 'Bergen', createdAt: new Date().toISOString() };
    setKurv(fresh);
  }, []);

  const importSharedKurv = useCallback((shared: TurKurv) => {
    setKurv(shared);
    saveToStorage(shared);
  }, []);

  return {
    kurv,
    addStop,
    removeStop,
    updateStop,
    moveStop,
    clearKurv,
    importSharedKurv,
    isEmpty: kurv.stops.length === 0,
    count: kurv.stops.length,
  };
}
