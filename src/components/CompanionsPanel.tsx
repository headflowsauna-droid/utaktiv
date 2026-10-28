import React, { useEffect, useState } from 'react';
import { UserProfile } from '../engine/profile';
import { AdultAgeBand, CompanionPost, publicAuthorLabel, rankPosts, cardFromPost } from '../engine/companions';
import {
  appendCompanionMessage,
  cardFromProfile,
  createCompanionPost,
  expressInterest,
  loadCompanionBoard,
  publishMatchCard,
  readAdultBand,
  saveAdultBand,
  setInterestStatus,
} from '../engine/companionStore';
import { CompanionInterest } from '../engine/companions';

interface CompanionsPanelProps {
  profile: UserProfile;
  viewerId: string;
  preset?: { id: string; title: string; kind: 'plan' | 'trail' } | null;
  remoteAccount: boolean;
}

const BANDS: AdultAgeBand[] = ['uoppgitt', '18-29', '30-44', '45-59', '60+'];

export const CompanionsPanel: React.FC<CompanionsPanelProps> = ({
  profile,
  viewerId,
  preset,
  remoteAccount,
}) => {
  const [posts, setPosts] = useState<CompanionPost[]>([]);
  const [interests, setInterests] = useState<CompanionInterest[]>([]);
  const [remote, setRemote] = useState(false);
  const [note, setNote] = useState('');
  const [band, setBand] = useState<AdultAgeBand>(readAdultBand());
  const [kind, setKind] = useState<'plan' | 'trail'>(preset?.kind ?? 'plan');
  const [activityTitle, setActivityTitle] = useState(preset?.title ?? '');
  const [activityId, setActivityId] = useState(preset?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const reload = async () => {
    const board = await loadCompanionBoard(profile.city);
    setPosts(board.posts);
    setInterests(board.interests);
    setRemote(board.remote);
  };

  useEffect(() => {
    void reload();
  }, [profile.city, viewerId]);

  useEffect(() => {
    if (!preset) return;
    setActivityId(preset.id);
    setActivityTitle(preset.title);
    setKind(preset.kind);
  }, [preset]);

  const mine = cardFromProfile(profile, band);
  const ranked = rankPosts(mine, posts.map(post => ({ post, card: cardFromPost(post) })));

  const publish = async () => {
    setStatus(null);
    saveAdultBand(band);
    await publishMatchCard(mine, viewerId);
    const result = await createCompanionPost({
      profile,
      viewerId,
      activityId: activityId || 'tur',
      activityTitle: activityTitle.trim() || (kind === 'trail' ? 'Synlig på denne turen' : 'Tur'),
      note,
      kind,
    });
    setStatus(result.ok ? 'Innlegget er ute. Navn vises først når begge har sagt ja.' : (result.error ?? 'Kunne ikke lagre.'));
    if (result.ok) {
      setNote('');
      await reload();
    }
  };

  const interestFor = (postId: string) => interests.find(item => item.postId === postId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Andre ser by, aktivitetsønske og aldersbånd som «barn 4–6». Barnas navn og adresse deles ikke.
        {remoteAccount && remote
          ? ' Innleggene ligger på kontoen din.'
          : ' Uten innlogging ligger følge bare på denne enheten.'}
      </p>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <label className="block text-sm">
          Voksen alder
          <select
            value={band}
            onChange={event => setBand(event.target.value as AdultAgeBand)}
            className="mt-1 w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3"
          >
            {BANDS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Aktivitet
          <input
            value={activityTitle}
            onChange={event => setActivityTitle(event.target.value)}
            className="mt-1 w-full min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3"
            placeholder="For eksempel Fløyen"
          />
        </label>
        <label className="block text-sm">
          Notat
          <textarea
            value={note}
            onChange={event => setNote(event.target.value)}
            maxLength={280}
            className="mt-1 w-full min-h-20 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
            placeholder="Ikke skriv barnas navn."
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setKind('plan')} className={`min-h-11 px-3 rounded-xl text-sm font-semibold ${kind === 'plan' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Leter etter følge</button>
          <button type="button" onClick={() => setKind('trail')} className={`min-h-11 px-3 rounded-xl text-sm font-semibold ${kind === 'trail' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800'}`}>Synlig på denne turen i 3 timer</button>
        </div>
        <button type="button" onClick={() => void publish()} className="min-h-11 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-bold">
          Publiser
        </button>
        {status && <p className="text-sm text-zinc-700 dark:text-zinc-200">{status}</p>}
      </div>

      <div className="space-y-3">
        {ranked.length === 0 && <p className="text-sm text-zinc-500">Ingen åpne følgeinnlegg i {profile.city} ennå.</p>}
        {ranked.map(({ post }) => {
          const interest = interestFor(post.id);
          const owns = post.authorId === viewerId || (viewerId === 'local' && post.authorId === 'local');
          const label = owns ? 'Deg' : publicAuthorLabel(post, interest, viewerId);
          const accepted = interests.filter(item => item.postId === post.id && item.status === 'accepted');
          return (
            <article key={post.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{label}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {post.activityTitle} · {post.partyLabel} · {post.kind === 'trail' ? 'Synlig på turen' : 'Planlagt'}
              </p>
              {post.note && <p className="text-sm text-zinc-600 dark:text-zinc-300">{post.note}</p>}
              {!owns && !interest && (
                <button
                  type="button"
                  className="min-h-11 px-3 rounded-xl bg-orange-500 text-zinc-950 text-sm font-semibold"
                  onClick={() => void expressInterest(post, viewerId).then(reload)}
                >
                  Jeg vil bli med
                </button>
              )}
              {owns && interests.filter(item => item.postId === post.id && item.status === 'pending').map(item => (
                <div key={item.id} className="flex gap-2">
                  <span className="text-sm">Ny forespørsel</span>
                  <button type="button" className="min-h-11 px-3 rounded-xl bg-emerald-600 text-white text-sm" onClick={() => void setInterestStatus(item, 'accepted').then(reload)}>Godta</button>
                  <button type="button" className="min-h-11 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm" onClick={() => void setInterestStatus(item, 'declined').then(reload)}>Nei</button>
                </div>
              ))}
              {(owns ? accepted : interest?.status === 'accepted' && interest ? [interest] : []).map(item => (
                <div key={item.id} className="space-y-2">
                  {item.fromName && <p className="text-sm font-semibold">{item.fromName}</p>}
                  {item.messages.map(message => (
                    <p key={message.id} className="text-sm text-zinc-700 dark:text-zinc-200">{message.body}</p>
                  ))}
                  <form
                    className="flex gap-2"
                    onSubmit={event => {
                      event.preventDefault();
                      const body = drafts[item.id] ?? '';
                      void appendCompanionMessage(item, viewerId, body).then(result => {
                        if (!result.ok) setStatus(result.error ?? 'Meldingen ble ikke sendt.');
                        setDrafts(current => ({ ...current, [item.id]: '' }));
                        void reload();
                      });
                    }}
                  >
                    <input
                      value={drafts[item.id] ?? ''}
                      onChange={event => setDrafts(current => ({ ...current, [item.id]: event.target.value }))}
                      className="flex-1 min-h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 bg-white dark:bg-zinc-950"
                      placeholder="Kort melding"
                    />
                    <button type="submit" className="min-h-11 px-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold">Send</button>
                  </form>
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </div>
  );
};
