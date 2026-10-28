import React, { useState } from 'react';
import { X } from 'lucide-react';
import { isCloudEnabled } from '../engine/cloudSync';
import {
  signInWithPassword,
  signOutAccount,
  signUpWithPassword,
  signInWithVipps,
  signInWithSocialProvider,
  SocialAuthProvider,
  AccountSession,
} from '../engine/account';
import { getStoredProfile, saveStoredProfile } from '../engine/profile';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AccountSession | null;
  onSessionCleared: () => void;
  onProfileNameUpdated?: (newName: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionCleared,
  onProfileNameUpdated,
}) => {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vippsPhone, setVippsPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cloud = isCloudEnabled();

  if (!isOpen) return null;

  const applyDisplayNameIfProvided = (fallbackName?: string) => {
    const clean = displayName.trim() || fallbackName?.trim();
    if (!clean) return;
    const current = getStoredProfile();
    const updated = { ...current, name: clean };
    saveStoredProfile(updated);
    onProfileNameUpdated?.(clean);
  };

  const handleSocialLogin = async (provider: SocialAuthProvider) => {
    setBusy(true);
    setMessage(null);
    if (displayName.trim()) {
      applyDisplayNameIfProvided(displayName.trim());
    }
    const res = await signInWithSocialProvider(provider, displayName || undefined);
    setBusy(false);
    if (res.ok) {
      if (res.redirected) {
        const label =
          provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook';
        setMessage(`Videresender til ${label} for ekte innlogging…`);
        return;
      }
      applyDisplayNameIfProvided(res.session?.name);
      const label =
        provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook';
      setMessage(`Registrert og logget inn med ${label}!`);
      setTimeout(() => onClose(), 550);
    } else {
      setMessage(res.error || 'Kunne ikke logge inn.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = mode === 'in'
      ? await signInWithPassword(email, password)
      : await signUpWithPassword(email, password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error ?? 'Kontoen svarte ikke.');
      return;
    }
    setPassword('');
    setMessage(mode === 'up'
      ? 'Kontoen er opprettet. Bekreft e-posten hvis prosjektet krever det, og logg inn.'
      : 'Du er logget inn. Profil, følge og saldo hentes til denne kontoen.');
    if (mode === 'in') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="shrink-0 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Konto</h2>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-xl text-zinc-500" aria-label="Lukk">
            <X className="w-5 h-5 mx-auto" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {!cloud && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Innlogging på tvers av telefoner starter når VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY er satt.
              Inntil da er følge og opptjente poeng bare på denne enheten. Kjøpte poeng kan ikke lages her.
            </p>
          )}
          {session ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 space-y-3">
                <div className="flex items-center gap-3">
                  {session.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt={session.name || 'Profilbilde'}
                      className="w-10 h-10 rounded-full border border-orange-300 dark:border-orange-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/60 border border-orange-300 dark:border-orange-700 flex items-center justify-center text-sm font-bold text-orange-700 dark:text-orange-300 shrink-0">
                      {(session.name || session.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-orange-950 dark:text-orange-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">
                        Logget inn med {session.provider === 'google' ? 'Google' : session.provider === 'facebook' ? 'Facebook' : session.provider === 'apple' ? 'Apple' : session.provider === 'vipps' ? 'Vipps' : 'e-post'}!
                      </span>
                    </div>
                    {session.name && (
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {session.name}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
                      {session.phone
                        ? `Mobilnummer: ${session.phone}`
                        : session.email
                        ? `Konto: ${session.email}`
                        : 'Tilkoblet konto'}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-orange-200/60 dark:border-orange-800/60">
                  {session.provider === 'vipps'
                    ? 'Lokal hurtigsesjon (venter på Vipps produksjonsavtale). Luks-poeng og turer lagres lokalt på enheten.'
                    : 'Profilen din, opptjente luks-poeng og turer er synkronisert i skyen på tvers av enheter.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  className="min-h-11 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition cursor-pointer"
                  onClick={async () => {
                    await signOutAccount();
                    onSessionCleared();
                    setShowPhoneInput(true);
                  }}
                >
                  Bytt mobilnummer / Logg inn med annen konto
                </button>

                <button
                  type="button"
                  className="min-h-11 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold transition cursor-pointer"
                  onClick={() => {
                    void signOutAccount().then(() => {
                      onSessionCleared();
                      onClose();
                    });
                  }}
                >
                  Logg ut
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Valgfritt fornavn slik at profilen og turplakaten får ditt navn med én gang */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hva heter du? (vises når du inviterer venner på tur)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="F.eks. Kari, Per eller Maria"
                  className="w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* 1-klikks registrering med Google, Facebook, Apple & Vipps */}
              <div className="space-y-2.5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Registrer deg eller logg inn med 1 klikk
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Ekte sky-innlogging
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSocialLogin('google')}
                    className="min-h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    title="Logg inn med din ekte Google-konto"
                  >
                    <span className="text-sm font-black text-[#4285F4]">G</span>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSocialLogin('apple')}
                    className="min-h-11 px-3 rounded-xl bg-black hover:bg-zinc-900 text-white border border-zinc-800 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    title="Logg inn med din Apple-ID"
                  >
                    <span className="text-sm"></span>
                    <span>Apple</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSocialLogin('facebook')}
                    className="min-h-11 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    title="Logg inn med din ekte Facebook-konto"
                  >
                    <span className="text-sm font-black">f</span>
                    <span>Facebook</span>
                  </button>
                </div>

                {showPhoneInput && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Ditt mobilnummer
                    </label>
                    <input
                      type="tel"
                      value={vippsPhone}
                      onChange={e => setVippsPhone(e.target.value)}
                      placeholder="F.eks. 400 01 448"
                      className="w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-900 dark:text-white mb-2 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const res = await signInWithVipps(vippsPhone || undefined);
                    setBusy(false);
                    if (res.ok) {
                      if (res.redirected) return;
                      applyDisplayNameIfProvided();
                      setMessage(`Logget inn med Vipps! (${res.session?.phone || 'Aktiv'})`);
                      setTimeout(() => onClose(), 600);
                    }
                  }}
                  className="w-full min-h-12 rounded-2xl bg-[#FF5B24] hover:bg-[#e04815] text-white font-bold text-sm transition flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <span className="font-extrabold tracking-tight text-base">vipps</span>
                  <span>Fortsett med Vipps</span>
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium ml-auto">
                    Simulert
                  </span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Google og Facebook er ekte innlogging. Vipps er simulert inntil godkjenning.</span>
                  <button
                    type="button"
                    onClick={() => setShowPhoneInput(!showPhoneInput)}
                    className="text-orange-600 dark:text-orange-400 font-semibold underline hover:text-orange-700 shrink-0 ml-2"
                  >
                    {showPhoneInput ? 'Skjul nummer' : 'Angi mobilnummer'}
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-zinc-400 font-medium">
                eller med e-post
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMode('in')} className={`min-h-11 px-3 rounded-xl text-sm font-semibold ${mode === 'in' ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>Logg inn</button>
                  <button type="button" onClick={() => setMode('up')} className={`min-h-11 px-3 rounded-xl text-sm font-semibold ${mode === 'up' ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>Ny konto</button>
                </div>
                <label className="block text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                  E-post
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="mt-1 w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-zinc-900 dark:text-white"
                    autoComplete="email"
                    placeholder="din@epost.no"
                  />
                </label>
                <label className="block text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                  Passord
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="mt-1 w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-zinc-900 dark:text-white"
                    autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
                    placeholder="Minst 6 tegn"
                  />
                </label>
                <button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-sm font-bold disabled:opacity-50 transition shadow-sm">
                  {busy ? 'Venter…' : mode === 'in' ? 'Logg inn med e-post' : 'Opprett konto'}
                </button>
              </form>
            </div>
          )}
          {message && (
            <p className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-xs text-orange-800 dark:text-orange-300 font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
