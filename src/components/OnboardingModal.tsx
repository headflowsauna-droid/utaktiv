import React, { useState, useEffect } from 'react';
import { UserProfile, ChildProfile, saveStoredProfile } from '../engine/profile';
import { X, User, Music, MapPin, Plus, Trash2, CheckCircle2, Baby, Send, ShieldCheck } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'basis' | 'family' | 'music' | 'outdoor'>('family');
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newArtist, setNewArtist] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [smsInviteCopiedFor, setSmsInviteCopiedFor] = useState<string | null>(null);

  const handleSendJuniorSmsInvite = async (child: ChildProfile) => {
    const childName = child.name.trim() || 'Junior';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://utaktiv.no';
    const juniorUrl = `${origin}/?junior=${encodeURIComponent(childName)}&parent=${encodeURIComponent(formData.name || 'Forelder')}`;
    const smsText = `Hei ${childName}! ☀️ Her er din egen Sol Junior-app fra ${formData.name || 'mamma/pappa'}. Her kan du samle Luks-poeng (1 poeng = 1 kr) når vi er på tur, måker snø eller lufter hunden, og spare til klatrepark og uteopplevelser (du trenger aldri poste noe offentlig!): ${juniorUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Sol Junior til ${childName}`,
          text: smsText,
          url: juniorUrl,
        });
        return;
      } catch {
        // Fallback til SMS-protokoll eller utklippstavle
      }
    }

    try {
      await navigator.clipboard.writeText(smsText);
      setSmsInviteCopiedFor(child.id);
      setTimeout(() => setSmsInviteCopiedFor(null), 3500);
    } catch {
      // ignore
    }
  };

  // Synkroniser formData hver gang modalen åpnes eller profilen endres
  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setSaveToast(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleAddChild = () => {
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      name: '',
      age: 4,
      needsStroller: false,
      energyLevel: 'high',
      interests: ['lekeplass', 'is'],
    };
    setFormData({
      ...formData,
      hasChildren: true,
      children: [...formData.children, newChild],
    });
  };

  const handleRemoveChild = (id: string) => {
    const remaining = formData.children.filter(c => c.id !== id);
    setFormData({
      ...formData,
      children: remaining,
      hasChildren: remaining.length > 0,
    });
  };

  const handleChildChange = (id: string, field: keyof ChildProfile, value: any) => {
    setFormData({
      ...formData,
      children: formData.children.map(c => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  const handleAddArtist = () => {
    if (!newArtist.trim()) return;
    if (!formData.musicTaste.favoriteArtists.includes(newArtist.trim())) {
      setFormData({
        ...formData,
        musicTaste: {
          ...formData.musicTaste,
          favoriteArtists: [...formData.musicTaste.favoriteArtists, newArtist.trim()],
        },
      });
    }
    setNewArtist('');
  };

  const handleRemoveArtist = (artist: string) => {
    setFormData({
      ...formData,
      musicTaste: {
        ...formData.musicTaste,
        favoriteArtists: formData.musicTaste.favoriteArtists.filter(a => a !== artist),
      },
    });
  };

  const handleSave = () => {
    // 1. Persister permanent til localStorage
    saveStoredProfile(formData);
    // 2. Oppdater App state
    onSaveProfile(formData);
    setSaveToast(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Bruker- & Familieprofil
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Profilen lagres lokalt og tilpasser alle turer, anbefalinger og solaktiviteter for familien.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faner */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 px-6 gap-2">
          <button
            onClick={() => setActiveTab('family')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'family'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Baby className="w-4 h-4" />
            Familie & Barn ({formData.children.length})
          </button>

          <button
            onClick={() => setActiveTab('basis')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'basis'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Basis & Bosted
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'music'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Music className="w-4 h-4" />
            Musikk & Artister
          </button>
        </div>

        {/* Innhold */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: FAMILIE & BARN */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Dine Barn & Familieoppsett
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Aktivitetene rangeres og merkes automatisk etter alder og barnevognbehov.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddChild}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 dark:hover:bg-orange-500/30 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Legg til barn
                </button>
              </div>

              {formData.children.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 text-xs">
                    Ingen barn registrert. Appen prioriterer da voksenaktiviteter og konserter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.children.map((child, idx) => (
                    <div
                      key={child.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                          <Baby className="w-4 h-4" />
                          Barn #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChild(child.id)}
                          className="text-zinc-400 hover:text-rose-500 p-1 transition"
                          title="Fjern barn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Barnets Navn
                          </label>
                          <input
                            type="text"
                            value={child.name}
                            onChange={e => handleChildChange(child.id, 'name', e.target.value)}
                            placeholder="f.eks. Milla"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Alder (år)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="18"
                            value={child.age}
                            onChange={e => handleChildChange(child.id, 'age', parseInt(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Aktivitetsnivå
                          </label>
                          <select
                            value={child.energyLevel}
                            onChange={e => handleChildChange(child.id, 'energyLevel', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                          >
                            <option value="high">Høyt (klatring, løping, hinderløyper)</option>
                            <option value="medium">Middels (kortere turer, lekeplass)</option>
                            <option value="low">Lavt (rolige turer, piknik, kafé)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Interesser (kommaseparert)
                          </label>
                          <input
                            type="text"
                            value={child.interests.join(', ')}
                            onChange={e =>
                              handleChildChange(
                                child.id,
                                'interests',
                                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="f.eks. lekeplass, trollsti, is, klatring"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div className="pt-1 space-y-2.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={child.needsStroller}
                            onChange={e => handleChildChange(child.id, 'needsStroller', e.target.checked)}
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300">
                            Trenger barnevogn (ekskluderer ulendt terreng og bratte stier for denne aktiviteten)
                          </span>
                        </label>

                        {/* Foreldrestyrt Sol Junior SMS-invitasjon */}
                        <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Trygg Barneprofil (Sol Junior) — Foreldrestyrt</span>
                            </div>
                            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/75 leading-snug">
                              Barn trenger <strong>aldri</strong> å poste offentlig for å få poeng. Send en egen Junior-lenke på SMS slik at {child.name || 'barnet'} kan se oppdrag og spare Luks-poeng (1 poeng = 1 kr).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendJuniorSmsInvite(child)}
                            className="shrink-0 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {smsInviteCopiedFor === child.id
                                ? 'SMS-invitasjon kopiert! ✓'
                                : `Send SMS-lenke til ${child.name || 'barnet'}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BASIS */}
          {activeTab === 'basis' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ditt Navn
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bostedsadresse / Nærområde
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="f.eks. Fløyen / Bergen Sentrum"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  By
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Foretrukket transport
                </label>
                <select
                  value={formData.transportMode}
                  onChange={e => setFormData({ ...formData, transportMode: e.target.value as any })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="foot">Til fots (nærområde & turstier)</option>
                  <option value="bike">Sykkel</option>
                  <option value="public">Kollektivtransport (buss, bybane, Fløibanen)</option>
                  <option value="car">Bil (for lengre turer)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: MUSIKK */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Favorittartister (matcher konserter og festivaler)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newArtist}
                    onChange={e => setNewArtist(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArtist();
                      }
                    }}
                    placeholder="Legg til artist..."
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddArtist}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm"
                  >
                    Legg til
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {formData.musicTaste.favoriteArtists.map(artist => (
                  <span
                    key={artist}
                    className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <Music className="w-3.5 h-3.5 text-purple-500" />
                    {artist}
                    <button
                      type="button"
                      onClick={() => handleRemoveArtist(artist)}
                      className="hover:text-rose-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {saveToast ? '✓ Profil lagret og oppdatert!' : 'Endringer lagres permanent på din enhet.'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Lukk
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lagre og Oppdater Aktiviteter
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
