import React, { useState } from 'react';
import { X, ExternalLink, Phone, Mail, MapPin, UtensilsCrossed, Flame, Check, Clock, ShieldCheck } from 'lucide-react';

export type EidfjordModalMode = 'sjel_og_gane' | 'heit_sauna' | null;

export interface EidfjordPartnerModalProps {
  mode: EidfjordModalMode;
  onClose: () => void;
  onChangeMode?: (mode: Exclude<EidfjordModalMode, null>) => void;
}

export const SJEL_OG_GANE_MENU = {
  name: 'Sjel & Gane — Restaurant og Bar',
  host: 'Kokken Arthur',
  address: 'Eidfjordvegen 300 (Heggjagarden), 5783 Eidfjord',
  phone: '+47 932 57 370',
  email: 'post@kokken-arthur.no',
  hardangerUrl: 'https://hardangerfjord.com/en/eidfjord/food-and-drinks/sjel-gane-restaurant-and-bar-2485603',
  menykortUrl: 'https://menykort.menu/restaurants/eidfjord/sjel-og-gane-bar-og-restaurant',
  heroImageUrl: 'https://media.newmindmedia.com/TellUs/image/?file=Sjel_Gane_av_Heidi_Kvamsdal_4_1476431691.jpg',
  photoCredit: '@ Heidi Kvamsdal / Visit Hardangerfjord',
  story:
    'Velkommen inn i et 300 år gammelt hus — Eidfjords aller første gjestgiveri og øltapperi. Her har Arthur skapt Cognacloft og kokebokbibliotek i 3. etasje, et intimt «vannhull» i kjelleren, og en lun urte- og bærhage i solveggen.',
  sections: [
    {
      title: 'Sjømat & Hardangerfjord',
      badge: 'Fersk fra fjorden',
      items: [
        {
          dish: 'Marinert, ovnsbakt seirygg fra fjorden',
          details: 'Serveres med tomatiserte grønnsaker, kremet potetmos og urtesmørsaus laget på urter fra egen hage.',
        },
        {
          dish: 'Smørbakt kveite & dagens egenfangede fisk og skalldyr',
          details: 'Med langtidskokt, hjemmelaget fisk- og skalldyrkraft og sesongens rotgrønnsaker.',
        },
      ],
    },
    {
      title: 'Kjøtt, Vilt & Eget Røykeri',
      badge: 'Kortreist & Egenrøkt',
      items: [
        {
          dish: 'Hjemmerøkte spesialiteter & Carpaccio',
          details: 'Fra eget røykeri ved huset, servert med nyplukkede urter, bær og lokal gardsost.',
        },
        {
          dish: 'Farsert økologisk landkylling & sesongens vilt fra Hardangervidda',
          details: 'Tilberedt etter Arthurs klassiske håndverk med kraftsaus og grønnsaker fra hagen.',
        },
      ],
    },
    {
      title: 'Eplesaft fra egen hage, Hardanger-sider & Vin',
      badge: 'Egen hage & Kjeller',
      items: [
        {
          dish: 'Selvpresset eplesaft & prisvinnende Hardanger-sider',
          details: 'Epler presset fra egen hage i Eidfjord og håndplukkede sidere fra lokale fruktgarder.',
        },
        {
          dish: 'Utvalgte viner & Cognacloft',
          details: 'Klassiske viner fra Frankrike, Spania og Italia — og kaffe/avec på Cognacloftet med kokebokbiblioteket i 3. etasje.',
        },
      ],
    },
  ],
};

export const HEIT_EIDFJORD_BOOKING = {
  name: 'Heit Eidfjord Sauna & Gratis Fjordbadstue',
  location: 'Kråkeskarvet / Eidfjord kai helt i vannkanten av Hardangerfjorden',
  hours: 'Åpent hver dag kl. 06:00–22:00 (ubetjent med dørkode på SMS)',
  phone: '+47 46 52 99 32',
  email: 'post@heiteidfjord.no',
  websiteUrl: 'https://heiteidfjord.no/?utm_source=utaktiv',
  dropInUrl:
    'https://minside.periode.no/booking/FsNahzdYU8xmgrVvMbyk/IlVLto9LhoBJ6DRpVT81?utm_source=utaktiv',
  privateUrl:
    'https://minside.periode.no/booking/FsNahzdYU8xmgrVvMbyk/qIB0ZAfRTdbTG8IORgme?utm_source=utaktiv',
  punchPassUrl:
    'https://minside.periode.no/m/FsNahzdYU8xmgrVvMbyk/punch-pass/bIIyR4BKZ6DnJJ5SOEx4?utm_source=utaktiv',
  giftCardUrl:
    'https://minside.periode.no/gift-card/DvCnYxQYPDKXnzh17q0X?utm_source=utaktiv',
};

export const EidfjordPartnerModal: React.FC<EidfjordPartnerModalProps> = ({ mode, onClose, onChangeMode }) => {
  const [internalTab, setInternalTab] = useState<'sjel_og_gane' | 'heit_sauna'>(
    mode === 'heit_sauna' ? 'heit_sauna' : 'sjel_og_gane'
  );
  const [guestCount, setGuestCount] = useState(2);
  const [preferredTime, setPreferredTime] = useState('18:00');
  const [copiedSms, setCopiedSms] = useState(false);

  React.useEffect(() => {
    if (mode) setInternalTab(mode);
  }, [mode]);

  if (!mode) return null;

  const activeTab = internalTab;
  const switchTab = (next: 'sjel_og_gane' | 'heit_sauna') => {
    setInternalTab(next);
    onChangeMode?.(next);
  };

  const handleCopyBookingSms = async () => {
    const smsBody = `Hei Arthur på Sjel & Gane! Vi har planlagt tur i Eidfjord via Utaktiv.no og ønsker gjerne å høre om dere har plass til ${guestCount} personer ca. kl. ${preferredTime}?`;
    try {
      await navigator.clipboard.writeText(smsBody);
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8622C]/15 text-[#E8622C] flex items-center justify-center">
              {activeTab === 'sjel_og_gane' ? (
                <UtensilsCrossed className="w-5 h-5" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {activeTab === 'sjel_og_gane'
                  ? SJEL_OG_GANE_MENU.name
                  : 'Bestill plass i Badstue ved fjorden (Eidfjord)'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#E8622C]" />
                <span>
                  {activeTab === 'sjel_og_gane'
                    ? SJEL_OG_GANE_MENU.address
                    : HEIT_EIDFJORD_BOOKING.location}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab-velger mellom Sjel & Gane og Badstue */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => switchTab('sjel_og_gane')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'sjel_og_gane'
                ? 'bg-white dark:bg-zinc-900 text-[#E8622C] shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Sjel & Gane Menykort</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('heit_sauna')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'heit_sauna'
                ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Badstue (0 kr / 199 kr)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'sjel_og_gane' ? (
            <>
              {/* Offisielt bilde fra Visit Hardangerfjord */}
              <div className="relative h-44 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img
                  src={SJEL_OG_GANE_MENU.heroImageUrl}
                  alt="Sjel & Gane restaurant i Eidfjord"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3.5 justify-between">
                  <span className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                    300 år gammelt tømmerhus • Eidfjordvegen 300
                  </span>
                  <span className="text-[10px] text-zinc-300 font-mono">
                    Foto: {SJEL_OG_GANE_MENU.photoCredit}
                  </span>
                </div>
              </div>

              {/* Historien om 300-årshuset */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Eidfjords første gjestgiveri og øltapperi • Cognacloft & urtehage
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {SJEL_OG_GANE_MENU.story}
                </p>
              </div>

              {/* Menykortet */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Menykort & Spesialiteter hos Kokken Arthur
                  </h4>
                  <a
                    href={SJEL_OG_GANE_MENU.menykortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#E8622C] hover:underline flex items-center gap-1"
                  >
                    <span>Åpne menykort.menu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {SJEL_OG_GANE_MENU.sections.map(sec => (
                  <div
                    key={sec.title}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {sec.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300">
                        {sec.badge}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {sec.items.map(item => (
                        <div
                          key={item.dish}
                          className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/80 first:border-t-0 first:pt-0"
                        >
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            • {item.dish}
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                            {item.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bordforespørsel til Arthur */}
              <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    Bestill bord / forhåndsbestill gruppe hos Arthur
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Kun forhåndsbestilling
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Arthur lager maten fra bunnen av etter avtale. Velg antall og ønsket tidspunkt etter turen, og send forespørsel direkte:
                </p>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Antall gjester</label>
                    <select
                      value={guestCount}
                      onChange={e => setGuestCount(Number(e.target.value))}
                      className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'person' : 'personer'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Ønsket klokkeslett</label>
                    <input
                      type="time"
                      value={preferredTime}
                      onChange={e => setPreferredTime(e.target.value)}
                      className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <a
                    href={`sms:+4793257370?&body=${encodeURIComponent(
                      `Hei Arthur på Sjel & Gane! Vi planlegger tur i Eidfjord via Utaktiv.no og lurer på om dere har ledig bord til ${guestCount} personer kl. ${preferredTime}?`
                    )}`}
                    onClick={handleCopyBookingSms}
                    className="py-2.5 px-3 rounded-xl bg-[#E8622C] hover:bg-[#d4531f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{copiedSms ? 'SMS-tekst klar ✓' : 'Send SMS (932 57 370)'}</span>
                  </a>

                  <a
                    href={`mailto:${SJEL_OG_GANE_MENU.email}?subject=${encodeURIComponent(
                      `Bordforespørsel Sjel & Gane (${guestCount} pers kl. ${preferredTime} via Utaktiv.no)`
                    )}&body=${encodeURIComponent(
                      `Hei Arthur!\n\nVi har planlagt tur i Eidfjord via Utaktiv.no og ønsker gjerne å bestille bord til ${guestCount} personer ca. kl. ${preferredTime}.\n\nVennlig hilsen`
                    )}`}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send e-post</span>
                  </a>

                  <a
                    href={SJEL_OG_GANE_MENU.hardangerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Visit Hardangerfjord</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Snarvei til å kombinere med badstue */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    Vil du ta et friskt fjordbad og varme deg før eller etter måltidet?
                  </span>
                  <button
                    type="button"
                    onClick={() => switchTab('heit_sauna')}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Se badstue i Eidfjord →</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VALG 1: GRATIS BADSTUE HELT NEDE VED FJORDEN */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>🌊</span>
                    <span>Alternativ 1: Gratis Badstue helt nede ved fjorden</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                    0 kr (Gratis)
                  </span>
                </div>
                <p className="text-xs text-emerald-900/90 dark:text-emerald-200/80 leading-relaxed">
                  Helt nede ved fjordkanten i Eidfjord sentrum ligger den gratis badstuen med åpent fjordbad i Hardangerfjorden. Perfekt etter turen til Vøringsfossen, Kjeåsen eller Hæreid!
                </p>
              </div>

              {/* VALG 2: HEIT EIDFJORD SAUNA — DIREKTE TIDSBOOKING MED SMS-KODE */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Alternativ 2: Forhåndsbook garantert tid hos Heit Eidfjord Sauna
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{HEIT_EIDFJORD_BOOKING.hours}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Vil du være helt sikker på ledig plass og ferdig oppvarmet panoramabadstue når dere kommer ned fra fjellet? Velg billettype under for å gå rett til tidsvelgeren og få dørkode på SMS:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Enkeltbillett / Fellesbadstue */}
                  <a
                    href={HEIT_EIDFJORD_BOOKING.dropInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-orange-400/70 hover:border-[#E8622C] transition flex flex-col justify-between gap-3 shadow-sm group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                          Enkeltbillett (Fellesbadstue)
                        </span>
                        <span className="text-sm font-black font-mono text-[#E8622C]">199 kr</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        90 minutter varm panoramabadstue på Kråkeskarvet med badetrapp rett i fjorden.
                      </p>
                    </div>
                    <div className="py-2 px-3 rounded-xl bg-[#E8622C] group-hover:bg-[#d4531f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition">
                      <span>Velg klokkeslett (199 kr)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>

                  {/* Privat badstue */}
                  <a
                    href={HEIT_EIDFJORD_BOOKING.privateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#E8622C] transition flex flex-col justify-between gap-3 shadow-sm group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                          Privat Badstue (Hele gruppen)
                        </span>
                        <span className="text-sm font-black font-mono text-zinc-900 dark:text-white">
                          1 000 kr
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Book hele badstuen privat i 90 minutter for familie eller vennegjeng (opptil 6 pers).
                      </p>
                    </div>
                    <div className="py-2 px-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 group-hover:bg-[#E8622C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition">
                      <span>Book privat badstue</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                </div>

                {/* Ekstra Heit opsjoner: Klippekort og Gavekort */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={HEIT_EIDFJORD_BOOKING.punchPassUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Klippekort (faste gjester)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={HEIT_EIDFJORD_BOOKING.giftCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Gi badstue som gavekort</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <a
                    href={HEIT_EIDFJORD_BOOKING.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E8622C] font-bold text-[11px] flex items-center gap-1 hover:underline"
                  >
                    <span>Åpne heiteidfjord.no</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/90 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Bookingen åpnes direkte hos <strong>Heit Eidfjord Sauna</strong> (med henvisning fra Utaktiv.no) slik at du får dørkoden rett på SMS til valgt klokkeslett.
                  </span>
                </div>

                {/* Snarvei til middag på Sjel & Gane */}
                <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-zinc-900 border border-orange-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
                    Sulten etter et varmt bad og fjorddupp?
                  </div>
                  <button
                    type="button"
                    onClick={() => switchTab('sjel_og_gane')}
                    className="text-xs font-bold text-[#E8622C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Se Sjel & Gane menyen →</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Direkte til lokal bedrift i Eidfjord</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            Lukk vindu
          </button>
        </div>
      </div>
    </div>
  );
};
