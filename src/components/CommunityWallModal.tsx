import React, { useState } from 'react';
import { UserProfile } from '../engine/profile';
import { 
  X, 
  Users, 
  Heart, 
  CheckCircle2, 
  MessageSquare, 
  Vote, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Award
} from 'lucide-react';

interface CommunityWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

interface ChildWish {
  id: string;
  childName: string;
  childAge: number;
  activityTitle: string;
  location: string;
  status: 'pending' | 'approved' | 'completed';
  solPointsSaved: number;
  costEstimateNok: number;
  noteFromChild: string;
}

interface ClassEvent {
  id: string;
  title: string;
  organizerName: string;
  groupName: string; // f.eks. "Klasse 2B — Møhlenpris skole"
  date: string;
  location: string;
  attendingChildren: string[];
  volunteers: { name: string; role: string }[];
  description: string;
}

interface CommunityPoll {
  id: string;
  title: string;
  description: string;
  options: { id: string; text: string; votes: number }[];
  userVotedId?: string;
}

export const CommunityWallModal: React.FC<CommunityWallModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'wishes' | 'wall' | 'polls'>('wishes');

  // 1. Barnas ønsker & Søskenfordeling
  const [wishes, setWishes] = useState<ChildWish[]>([
    {
      id: 'wish-1',
      childName: 'Milla',
      childAge: 4,
      activityTitle: 'Fløyen: Teatershow og Skattejakt i Trollskogen',
      location: 'Fløyen Toppstasjon',
      status: 'pending',
      solPointsSaved: 160,
      costEstimateNok: 160,
      noteFromChild: 'Pappa, jeg vil se trollene og få skattekart! 🧙‍♂️',
    },
    {
      id: 'wish-2',
      childName: 'Oliver',
      childAge: 7,
      activityTitle: 'Høyt & Lavt Klatrepark Nesttun',
      location: 'Nesttun',
      status: 'approved',
      solPointsSaved: 360,
      costEstimateNok: 360,
      noteFromChild: 'Jeg vil klatre i den høyeste ziplinen sammen med nabo-Jonas! 🌲',
    },
  ]);

  // 2. Venne- og klassevegg
  const [events, setEvents] = useState<ClassEvent[]>([
    {
      id: 'ev-1',
      title: 'Søndagstur til Fløyen & Grilling i Trollskogen',
      organizerName: 'Morten (Klassekontakt 2B)',
      groupName: 'Klasse 2B — Nabolaget & Skolen',
      date: 'Søndag kl. 11:30',
      location: 'Fløibanen nedre stasjon',
      attendingChildren: ['Oliver', 'Jonas', 'Sander', 'Emma', 'Sofie', 'Milla'],
      volunteers: [
        { name: 'Morten', role: 'Har med stormkjøkken & bålkaffe ☕' },
        { name: 'Silje (Mamma)', role: 'Har 3 ledige plasser i bilen 🚗' },
      ],
      description: 'Vi møtes for en felles tur i solskinn. Alle tar med niste, vi tenner bål på anvist plass!',
    },
    {
      id: 'ev-2',
      title: 'Sykkeltur & Is ved Nordnes Sjøbad',
      organizerName: 'Turleder i Nabolaget',
      groupName: 'Vennegjengen / Gaten',
      date: 'Onsdag kl. 16:30',
      location: 'Nordnesparken',
      attendingChildren: ['Henrik', 'Kari', 'Sindre', 'Ella'],
      volunteers: [
        { name: 'Turleder', role: 'Følgegruppe & Førstehjelpsansvarlig 🦺' },
      ],
      description: 'Rolig sykkeltur med barna langs bryggen, etterfulgt av lek på gressplenen i vestvendt kveldssol.',
    },
  ]);

  // 3. Spørreundersøkelser for uteområder
  const [polls, setPolls] = useState<CommunityPoll[]>([
    {
      id: 'poll-1',
      title: 'Hvilket nytt utendørselement ønsker barna seg mest på lekeplassen?',
      description: 'Innspill til FAU og bydelsutvalget for fordeling av nærmiljømidler.',
      options: [
        { id: 'opt-1', text: 'Zipline / Taubane i tretoppene 🪂', votes: 24 },
        { id: 'opt-2', text: 'Hinderløype i naturtømmer (Troll-stil) 🌲', votes: 19 },
        { id: 'opt-3', text: 'Pump track for sparkesykkel og BMX 🚲', votes: 31 },
        { id: 'opt-4', text: 'Utendørs scene for teater og musikk 🎭', votes: 11 },
      ],
      userVotedId: undefined,
    },
    {
      id: 'poll-2',
      title: 'Ønsker vi felles solskjerming eller vindskjul ved bryggekanten?',
      description: 'For å gjøre ettermiddagsturer mer behagelige på blåsende dager.',
      options: [
        { id: 'opt-21', text: 'Ja, levegg i naturtre med benker', votes: 42 },
        { id: 'opt-22', text: 'Nei, hold området helt åpent for solen', votes: 18 },
      ],
      userVotedId: undefined,
    },
  ]);

  const [volunteerRoleInput, setVolunteerRoleInput] = useState<{ [eventId: string]: string }>({});

  if (!isOpen) return null;

  const handleApproveWish = (wishId: string) => {
    setWishes(prev => prev.map(w => w.id === wishId ? { ...w, status: 'approved' } : w));
  };

  const handleAddVolunteer = (eventId: string) => {
    const roleText = volunteerRoleInput[eventId]?.trim() || 'Hjelper til som voksenfølge 👍';
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          volunteers: [...ev.volunteers, { name: `${profile.name} (Pappa/Mamma)`, role: roleText }],
        };
      }
      return ev;
    }));
    setVolunteerRoleInput(prev => ({ ...prev, [eventId]: '' }));
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        if (poll.userVotedId) return poll; // Allerede stemt
        return {
          ...poll,
          userVotedId: optionId,
          options: poll.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt),
        };
      }
      return poll;
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Klasse-, Venne- & Søskenveggen
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RETTFERDIGHET & SAMHOLD
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Barnas ønsker, rettferdig søskenfordeling, fellesutflukter for klassen og medvirkning.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faner */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('wishes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'wishes'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Barnas Ønsker & Søskenfordeling ({wishes.length})
          </button>

          <button
            onClick={() => setActiveTab('wall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'wall'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Venne- & Klasseveggen ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('polls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'polls'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            Spørreundersøkelser & Uteområder ({polls.length})
          </button>
        </div>

        {/* Modal innhold */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* FANE 1: BARNAS ØNSKER & SØSKENFORDELING */}
          {activeTab === 'wishes' && (
            <div className="space-y-4">
              {/* Rettferdighets-indikator */}
              <div className="p-4 bg-gradient-to-r from-orange-950/30 via-zinc-900 to-emerald-950/30 border border-orange-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-orange-400" />
                    Søsken-Rettferdighet Status:
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Balansert ⚖️
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Forrige helgeaktivitet var <strong>Oliver (7 år)</strong> sitt valg (Klatreparken).
                  Neste utflukt er det <strong className="text-orange-400">Milla (4 år)</strong> som har førsterett til å velge aktivitet for familien!
                </p>
              </div>

              {/* Liste over ønsker */}
              <div className="space-y-3">
                {wishes.map(wish => (
                  <div
                    key={wish.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-800 text-white">
                          👧 {wish.childName} ({wish.childAge} år)
                        </span>
                        <span className="text-xs font-bold text-white">{wish.activityTitle}</span>
                        {wish.status === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Godkjent av foreldre
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Venter på godkjenning
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 italic">«{wish.noteFromChild}»</p>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>📍 {wish.location}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400 font-medium">
                          Barnets egenandel: {wish.solPointsSaved.toLocaleString('no-NO')} Luks-poeng ({wish.solPointsSaved.toLocaleString('no-NO')} kr)
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                      {wish.status === 'pending' ? (
                        <button
                          onClick={() => handleApproveWish(wish.id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Godkjenn for familien</span>
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                          Planlagt som helgetur ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FANE 2: VENNE- & KLASSEVEGGEN */}
          {activeTab === 'wall' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center justify-between">
                <span>Her kan foreldre, klassekontakter og venner organisere samkjøring og felles dagslysturer.</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Trygg foreldresone
                </span>
              </div>

              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {ev.groupName}
                          </span>
                          <span className="text-xs text-zinc-400">Arrangør: {ev.organizerName}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{ev.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-orange-400 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{ev.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300">{ev.description}</p>

                    <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span>Oppmøtested: <strong>{ev.location}</strong></span>
                    </div>

                    {/* Påmeldte barn */}
                    <div className="p-3 bg-zinc-900/80 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                        <span>Påmeldte barn ({ev.attendingChildren.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.attendingChildren.map(name => (
                          <span
                            key={name}
                            className="px-2.5 py-1 rounded-full text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-200"
                          >
                            🧒 {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Voksne som hjelper til / Følgegruppe */}
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400">
                        Voksne i følgegruppe & transport:
                      </div>
                      <div className="space-y-1 text-xs text-zinc-300">
                        {ev.volunteers.map((vol, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-white">{vol.name}:</span>
                            <span className="text-zinc-400">{vol.role}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meld deg som voksenfølge */}
                      <div className="flex items-center gap-2 pt-2 border-t border-emerald-900/40">
                        <input
                          type="text"
                          placeholder="F.eks: Har 3 ledige plasser i bilen 🚗"
                          value={volunteerRoleInput[ev.id] || ''}
                          onChange={e => setVolunteerRoleInput({ ...volunteerRoleInput, [ev.id]: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleAddVolunteer(ev.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shrink-0"
                        >
                          Meld deg som følge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FANE 3: SPØRREUNDERSØKELSER & NÆRMILJØ */}
          {activeTab === 'polls' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Vote className="w-4 h-4 text-orange-400" />
                  Direkte Medvirkning for Lekeplasser & Uteområder
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Svarene aggregeres og overleveres til FAU, velforeninger og kommunen som dokumentert behov ved søknad om spillemidler og oppgradering av parker.
                </p>
              </div>

              <div className="space-y-4">
                {polls.map(poll => {
                  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

                  return (
                    <div key={poll.id} className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{poll.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{poll.description}</p>
                      </div>

                      <div className="space-y-2">
                        {poll.options.map(opt => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const isVoted = poll.userVotedId === opt.id;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVote(poll.id, opt.id)}
                              disabled={!!poll.userVotedId}
                              className={`w-full p-3 rounded-xl border text-left transition relative overflow-hidden flex items-center justify-between ${
                                isVoted
                                  ? 'border-orange-500 bg-orange-500/10'
                                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/80'
                              }`}
                            >
                              {/* Bakgrunnsbar for stemmeprosent */}
                              <div
                                className="absolute inset-y-0 left-0 bg-orange-500/10 -z-0 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />

                              <span className="text-xs font-medium text-white relative z-10 flex items-center gap-2">
                                {isVoted && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                                {opt.text}
                              </span>

                              <div className="text-xs font-mono font-bold text-zinc-400 relative z-10 shrink-0">
                                {pct}% <span className="text-[10px] text-zinc-500">({opt.votes} stemmer)</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                        <span>Totalt avgitte stemmer: {totalVotes}</span>
                        {poll.userVotedId && (
                          <span className="text-emerald-400 font-semibold">Takk for stemmen din! ✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-500">
          Sammen skaper vi trygge, solfylte nabolag der barna mestrer og opplever sammen.
        </div>
      </div>
    </div>
  );
};
