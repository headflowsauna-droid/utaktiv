import React, { useState } from 'react';
import { X, Settings, Bell, Moon, Sun, Shield, Key, DollarSign, Check, Copy, Globe } from 'lucide-react';
import { getStoredApiKeys, saveStoredApiKeys, ApiKeysConfig } from '../engine/tickets';
import { SupportedLanguage } from '../engine/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  lang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  theme = 'dark',
  onThemeChange,
  lang = 'no',
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'apikeys'>('app');
  const [apiKeys, setApiKeys] = useState<ApiKeysConfig>(getStoredApiKeys());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedIosLink, setCopiedIosLink] = useState(false);

  if (!isOpen) return null;

  const handleSaveApiKeys = () => {
    saveStoredApiKeys(apiKeys);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white">Innstillinger & Kommersielt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fanevelger */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/20 px-5 gap-3">
          <button
            onClick={() => setActiveTab('app')}
            className={`py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'app'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            App & Varsler
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'apikeys'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            API-Nøkler & Billettsalg
          </button>
        </div>

        {/* Innhold */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'app' ? (
            <>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-semibold text-zinc-200">App-tema & Bakgrunnsfarge</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    {theme === 'light' ? '☀️ Lys versjon' : '🌙 Mørk versjon'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Velg mellom dyp fjellgrafitt (mørk) eller ren nordisk hvit bakgrunn.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onThemeChange?.('light')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      theme === 'light'
                        ? 'bg-white text-zinc-900 border-orange-500 shadow-sm font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hvit bakgrunn (Lys)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange?.('dark')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      theme === 'dark'
                        ? 'bg-zinc-800 text-white border-orange-500 shadow-sm font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fjellgrafitt (Mørk)</span>
                  </button>
                </div>
              </div>

              {/* Språk / Language */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-semibold text-zinc-200">Språk / Language</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    {lang === 'no' ? '🇳🇴 Norsk' : '🇬🇧 English'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {lang === 'no'
                    ? 'Velg norsk for lokalt innhold eller engelsk for turister og internasjonale reisebyråer («Plan Your Norway Trip»).'
                    : 'Choose English for global tourists & travel agencies planning adventures in Norway.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onLanguageChange?.('no')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                      lang === 'no'
                        ? 'bg-zinc-800 text-white border-orange-500 shadow-sm font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>🇳🇴 Norsk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange?.('en')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                      lang === 'en'
                        ? 'bg-zinc-800 text-white border-orange-500 shadow-sm font-semibold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Bruker- & Familieprofil</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Rediger profil →
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Endre adresse, barnas alder, musikkartister og transportmåte.
                </p>
              </div>

              {/* Android APK Nedlasting */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    📱 Android App (.apk)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Signert & Klar
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Installer Utaktiv direkte på din Android-telefon for en fullverdig native opplevelse med GPS-turstempling og sanntids dagslys.
                </p>
                <a
                  href="/Utaktiv.apk"
                  download="Utaktiv.apk"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  Last ned Utaktiv.apk (717 KB)
                </a>
              </div>

              {/* iOS / iPhone App (PWA & Xcode) */}
              <div className="p-3.5 bg-gradient-to-r from-sky-950/40 via-zinc-950 to-zinc-950 border border-sky-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    🍏 iPhone / iOS (Ekte fullskjerm)
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    iOS Standalone
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Slik installerer datteren din Utaktiv på sin iPhone (tar 5 sekunder uten App Store):
                </p>
                <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal pl-4">
                  <li>Åpne lenken i <strong>Safari</strong> på iPhone.</li>
                  <li>Trykk på <strong>Del-ikonet (⎋)</strong> nederst i Safari.</li>
                  <li>Velg <strong>«Legg til på Hjem-skjerm» (+)</strong>.</li>
                </ol>
                <p className="text-[10px] text-sky-300/80 italic">
                  Appen legger seg på hjemskjermen med eget ikon og åpnes i 100% fullskjerm uten nettleserrammer.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.origin;
                    navigator.clipboard.writeText(url);
                    setCopiedIosLink(true);
                    setTimeout(() => setCopiedIosLink(false), 2500);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {copiedIosLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lenke kopiert! Send til datteren din</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier lenke for å sende (iMessage/SMS)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-orange-400" />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Solluke-varsler</div>
                      <div className="text-[10px] text-zinc-500">Varsle når skyene sprekker opp før et show</div>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-zinc-700 bg-zinc-800 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Konsert- & Kulturradar</div>
                      <div className="text-[10px] text-zinc-500">Skrap etter utendørskonserter (Jason Mraz m.fl.)</div>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-zinc-700 bg-zinc-800 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition">
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Døgnrytmepåminnelse</div>
                      <div className="text-[10px] text-zinc-500">Morgensollys før kl. 10:00</div>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-zinc-700 bg-zinc-800 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/40 transition">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">Lokal databehandling</div>
                      <div className="text-[10px] text-zinc-500">Profil og GPS lagres kun på din enhet</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">AKTIV</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-950/20 border border-orange-500/20 rounded-xl text-xs text-orange-200/90 leading-relaxed">
                <strong className="text-white flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  Kommersialisering & Salg av Appen
                </strong>
                Legg inn dine nøkler og partner-ID-er under. Billettsalg, påmeldinger (7-fjell, maraton, klatrepark) og AI-tjenester rutes direkte til dine kontoer.
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Ticketmaster Partner API-nøkkel
                </label>
                <input
                  type="text"
                  value={apiKeys.ticketmasterApiKey}
                  onChange={e => setApiKeys({ ...apiKeys, ticketmasterApiKey: e.target.value })}
                  placeholder="TM_LIVE_..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Affiliate Partner-ID (Provisjonssporing)
                </label>
                <input
                  type="text"
                  value={apiKeys.ticketmasterAffiliateId}
                  onChange={e => setApiKeys({ ...apiKeys, ticketmasterAffiliateId: e.target.value })}
                  placeholder="f.eks. sol_alexander_partner"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Legges automatisk til på alle eksterne billett- og arrangementslenker.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={apiKeys.stripePublishableKey}
                  onChange={e => setApiKeys({ ...apiKeys, stripePublishableKey: e.target.value })}
                  placeholder="pk_live_..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Stripe Produktlenker for Poengpakker & Gavekort */}
              <div className="p-3.5 bg-zinc-950/80 border border-orange-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-orange-400" />
                    Stripe Produktlenker (Payment Links)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Ekte Betalinger
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Opprett produktlenker i ditt Stripe Dashboard (dashboard.stripe.com/payment-links) og lim dem inn her. Pengene går 100 % inn på din Stripe-konto med støtte for Vipps, Apple Pay og kort.
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                      50 kr pakke (Nabolags-Spire / 500p)
                    </label>
                    <input
                      type="url"
                      value={apiKeys.stripeProductLinks?.package50Url || ''}
                      onChange={e => setApiKeys({
                        ...apiKeys,
                        stripeProductLinks: { ...apiKeys.stripeProductLinks, package50Url: e.target.value }
                      })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                      100 kr pakke (Aktiv Familiehelg / 1 200p)
                    </label>
                    <input
                      type="url"
                      value={apiKeys.stripeProductLinks?.package100Url || ''}
                      onChange={e => setApiKeys({
                        ...apiKeys,
                        stripeProductLinks: { ...apiKeys.stripeProductLinks, package100Url: e.target.value }
                      })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                      250 kr pakke (Storsponsor / 3 000p)
                    </label>
                    <input
                      type="url"
                      value={apiKeys.stripeProductLinks?.package250Url || ''}
                      onChange={e => setApiKeys({
                        ...apiKeys,
                        stripeProductLinks: { ...apiKeys.stripeProductLinks, package250Url: e.target.value }
                      })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                      500 kr pakke (Festival & Sesongpott / 6 500p)
                    </label>
                    <input
                      type="url"
                      value={apiKeys.stripeProductLinks?.package500Url || ''}
                      onChange={e => setApiKeys({
                        ...apiKeys,
                        stripeProductLinks: { ...apiKeys.stripeProductLinks, package500Url: e.target.value }
                      })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                      Gavekort / Valgfritt beløp
                    </label>
                    <input
                      type="url"
                      value={apiKeys.stripeProductLinks?.giftCardCustomUrl || ''}
                      onChange={e => setApiKeys({
                        ...apiKeys,
                        stripeProductLinks: { ...apiKeys.stripeProductLinks, giftCardCustomUrl: e.target.value }
                      })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  TicketCo Partner API-nøkkel (Norsk festival- & kulturplattform)
                </label>
                <input
                  type="text"
                  value={apiKeys.ticketCoApiKey || ''}
                  onChange={e => setApiKeys({ ...apiKeys, ticketCoApiKey: e.target.value })}
                  placeholder="TC_LIVE_..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Google Gemini / AI Concierge API-nøkkel
                </label>
                <input
                  type="password"
                  value={apiKeys.geminiApiKey}
                  onChange={e => setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Sol SaaS Lisens- & Salgsnøkkel
                </label>
                <input
                  type="text"
                  value={apiKeys.solCommercialLicenseKey}
                  onChange={e => setApiKeys({ ...apiKeys, solCommercialLicenseKey: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Gjør det mulig å selge appen som en ferdig white-label løsning til kommuner, festivaler og bedrifter.</p>
              </div>

              <button
                onClick={handleSaveApiKeys}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Nøklene er lagret!</span>
                  </>
                ) : (
                  <span>Lagre API-konfigurasjon</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/50">
          <span className="text-[10px] text-zinc-500 font-mono">Utaktiv v1.1.0 Commercial</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
