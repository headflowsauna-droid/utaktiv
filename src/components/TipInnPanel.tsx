import React, { useEffect, useState } from 'react';
import { loadPendingTips, LocalTip, savePendingTip, TipKind } from '../engine/localTips';

interface TipInnPanelProps {
  city: string;
  prefillTrail?: string | null;
  onPrefillConsumed?: () => void;
  onTipSaved?: (tip: LocalTip) => void;
}

const EMPTY = {
  trail: '',
  placeName: '',
  offer: '',
  link: '',
  kind: 'place' as TipKind,
};

export const TipInnPanel: React.FC<TipInnPanelProps> = ({
  city,
  prefillTrail,
  onPrefillConsumed,
  onTipSaved,
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [tips, setTips] = useState<LocalTip[]>(() => loadPendingTips());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prefillTrail && prefillTrail.trim()) {
      setOpen(true);
      setForm(prev => ({
        ...prev,
        trail: prefillTrail.trim(),
        kind: 'place',
      }));
      if (onPrefillConsumed) {
        onPrefillConsumed();
      }
    }
  }, [prefillTrail, onPrefillConsumed]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const placeName = form.placeName.trim();
    const trail = form.trail.trim();
    if (!placeName || !trail) {
      setMessage('Skriv stien og navnet. Uten det blir tipset liggende ufullstendig.');
      return;
    }
    const saved = savePendingTip({
      city: city || 'Ukjent',
      trail,
      placeName,
      offer: form.offer.trim(),
      link: form.link.trim(),
      kind: form.kind,
    });
    setTips(prev => [saved, ...prev]);
    setForm(EMPTY);
    if (onTipSaved) {
      onTipSaved(saved);
    }
    setMessage(
      form.kind === 'wish'
        ? 'Ønsket ligger i listen på denne maskinen. Det er ikke et sted på kartet.'
        : form.kind === 'trail'
          ? 'Turforslaget ligger som «vi sjekker turen» på denne maskinen.'
          : 'Tipset om bedriften ligger som «vi sjekker siden» og vises under ruten på denne maskinen.'
    );
  };

  const pendingHere = tips.filter(tip => tip.city.toLowerCase() === city.toLowerCase());

  return (
    <section
      id="utaktiv-tip-inn-panel"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E8622C] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full mb-1.5">
            Lokalkunnskap & Bedrifter langs veien
          </span>
          <h2 className="text-xl text-zinc-950" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Tips oss om en tur eller en bedrift langs veien
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed max-w-2xl">
            Vet du om en lokal turperle (som i Åsane eller Eidfjord), eller en besøksgård, kafé, badstue eller
            utleier langs stien? Tips oss her — så får turgåerne vite om stoppet, og vi kan hjelpe bedriften å få trafikk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setForm(prev => ({ ...prev, kind: 'place' }));
              setOpen(true);
            }}
            className="min-h-11 px-4 rounded-xl bg-[#E8622C] hover:bg-[#d55521] text-white text-xs sm:text-sm font-semibold transition"
          >
            + Tips om bedrift på veien
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(prev => ({ ...prev, kind: 'trail' }));
              setOpen(prev => !prev);
            }}
            className="min-h-11 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold transition"
          >
            {open ? 'Lukk skjema' : '+ Legg til tur'}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
          <fieldset className="sm:col-span-2 flex flex-wrap gap-3 text-xs sm:text-sm text-zinc-800 bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80">
            <legend className="sr-only">Hva vil du tipse om?</legend>
            <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="radio"
                name="tip-kind"
                checked={form.kind === 'place'}
                onChange={() => setForm(prev => ({ ...prev, kind: 'place' }))}
              />
              <span>🏪 Bedrift / gård langs veien (hjelp dem å få trafikk)</span>
            </label>
            <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="radio"
                name="tip-kind"
                checked={form.kind === 'trail'}
                onChange={() => setForm(prev => ({ ...prev, kind: 'trail' }))}
              />
              <span>🥾 Ny tur / lokal turperle</span>
            </label>
            <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="radio"
                name="tip-kind"
                checked={form.kind === 'wish'}
                onChange={() => setForm(prev => ({ ...prev, kind: 'wish' }))}
              />
              <span>💡 Ønske om noe som mangler</span>
            </label>
          </fieldset>

          <label className="text-xs font-semibold text-zinc-700">
            {form.kind === 'trail' ? 'Startsted og rute (f.eks. Hjortland til Vikinghytten)' : 'Sti eller tur der bedriften ligger'}
            <input
              value={form.trail}
              onChange={e => setForm(prev => ({ ...prev, trail: e.target.value }))}
              className="mt-1 w-full min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-normal text-zinc-950"
              placeholder="Den trondhjemske postvei bak IKEA Åsane"
            />
          </label>
          <label className="text-xs font-semibold text-zinc-700">
            {form.kind === 'trail' ? 'Navn på turen' : 'Navn på bedriften eller stedet'}
            <input
              value={form.placeName}
              onChange={e => setForm(prev => ({ ...prev, placeName: e.target.value }))}
              className="mt-1 w-full min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-normal text-zinc-950"
              placeholder={form.kind === 'trail' ? 'Vikinghytten / Postveien / Hæreid' : 'Sætregården, Sjel og Gane, lokal badstue'}
            />
          </label>
          <label className="text-xs font-semibold text-zinc-700">
            Hva tilbyr de / hva bør turgåere vite?
            <input
              value={form.offer}
              onChange={e => setForm(prev => ({ ...prev, offer: e.target.value }))}
              className="mt-1 w-full min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-normal text-zinc-950"
              placeholder="Åpen gård søndager 12–16, kaffe og vafler i varmestuen, gratis fjordbadstue..."
            />
          </label>
          <label className="text-xs font-semibold text-zinc-700">
            Lenke til nettside eller kart (valgfritt)
            <input
              value={form.link}
              onChange={e => setForm(prev => ({ ...prev, link: e.target.value }))}
              className="mt-1 w-full min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-normal text-zinc-950"
              placeholder="https://"
              inputMode="url"
            />
          </label>

          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="submit" className="min-h-11 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition">
              Legg i køen for {city}
            </button>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Vi sjekker siden før stedet legges fast på ruten. Tips kan også sendes direkte til tips@utaktiv.no eller post@utaktiv.no.
            </p>
          </div>
        </form>
      )}

      {message && <p className="mt-3 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">{message}</p>}

      {pendingHere.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pendingHere.map(tip => (
            <li key={tip.id} className="text-sm text-zinc-700 border-t border-zinc-100 pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800">
                {tip.kind === 'trail' ? '🥾 Ny tur' : tip.kind === 'wish' ? '💡 Ønske' : '🏪 Bedrift langs veien'}
              </span>
              <span className="font-semibold text-zinc-950">{tip.placeName}</span>
              {' · '}
              <span>{tip.trail}</span>
              {tip.offer ? ` · ${tip.offer}` : ''}
              {' · '}
              <span className="text-xs text-zinc-500">
                {tip.kind === 'wish' ? 'Ønske, ikke på kartet' : 'Vi sjekker siden'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
