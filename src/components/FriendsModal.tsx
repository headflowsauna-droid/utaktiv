import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  MessageCircle,
  Sun,
  Share2,
  Check,
  Send,
  Flame,
  Search,
  Bell,
  ThumbsUp,
  Home,
  Briefcase,
  CheckCircle2,
  Plus,
  MapPin,
} from 'lucide-react';
import {
  FriendProfile,
  FriendRequest,
  SocialFeedItem,
  SocialState,
  saveStoredSocialState,
  getStoredNeighborhoodGroups,
  saveStoredNeighborhoodGroups,
  claimNeighborhoodTask,
  completeNeighborhoodTask,
  approveNeighborhoodTask,
  postNeighborhoodTask,
  NeighborhoodGroup,
} from '../engine/friends';
import { UserProfile } from '../engine/profile';
import { CompanionsPanel } from './CompanionsPanel';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  socialState: SocialState;
  onUpdateSocialState: (newState: SocialState) => void;
  initialTab?: 'feed' | 'nabolag' | 'requests' | 'friends' | 'find' | 'folge';
  viewerId?: string;
  companionPreset?: { id: string; title: string; kind: 'plan' | 'trail' } | null;
  remoteAccount?: boolean;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  profile,
  socialState,
  onUpdateSocialState,
  initialTab = 'feed',
  viewerId = 'local',
  companionPreset = null,
  remoteAccount = false,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'nabolag' | 'requests' | 'friends' | 'find' | 'folge'>(initialTab);
  const [newPostText, setNewPostText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [cheeredIds, setCheeredIds] = useState<string[]>([]);

  // Nabolagsgrupper & Oppgaver
  const [groups, setGroups] = useState<NeighborhoodGroup[]>(getStoredNeighborhoodGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-korskirken');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskReward, setNewTaskReward] = useState<number>(150);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [groupPostText, setGroupPostText] = useState('');

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // 1. Godkjenn venneforespørsel
  const handleAcceptRequest = (req: FriendRequest) => {
    const newFriend: FriendProfile = {
      id: req.userId,
      name: req.name,
      avatar: req.avatar,
      city: req.city,
      mutualFriendsCount: req.mutualFriendsCount,
      totalLux: 6500,
      currentStreakDays: 1,
      statusText: 'Ble nettopp venner på Utaktiv! ☀️',
      isOnline: true,
    };

    const updatedState: SocialState = {
      ...socialState,
      incomingRequests: socialState.incomingRequests.filter(r => r.id !== req.id),
      friends: [newFriend, ...socialState.friends],
    };

    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
  };

  // 2. Avslå venneforespørsel
  const handleDeclineRequest = (reqId: string) => {
    const updatedState: SocialState = {
      ...socialState,
      incomingRequests: socialState.incomingRequests.filter(r => r.id !== reqId),
    };
    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
  };

  // 3. Legg til fra forslag
  const handleAddSuggestion = (sug: FriendProfile) => {
    const updatedState: SocialState = {
      ...socialState,
      suggestions: socialState.suggestions.filter(s => s.id !== sug.id),
      friends: [sug, ...socialState.friends],
    };
    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
  };

  // 4. Opprett nytt innlegg
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: SocialFeedItem = {
      id: `feed-${Date.now()}`,
      authorId: profile.id,
      authorName: profile.name,
      authorAvatar: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      content: newPostText.trim(),
      type: 'status',
      timestamp: 'Akkurat nå',
      likes: [],
      solarCheers: 0,
      comments: [],
    };

    const updatedState: SocialState = {
      ...socialState,
      feed: [newPost, ...socialState.feed],
    };

    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
    setNewPostText('');
  };

  // Nabolagsgruppe-handlinger
  const handleClaimTask = (taskId: string) => {
    const childName = profile.children && profile.children.length > 0
      ? `${profile.children[0].name} (${profile.children[0].age} år)`
      : `${profile.name} (ungdom)`;
    claimNeighborhoodTask(selectedGroupId, taskId, childName);
    setGroups(getStoredNeighborhoodGroups());
  };

  const handleCompleteTask = (taskId: string) => {
    completeNeighborhoodTask(selectedGroupId, taskId);
    setGroups(getStoredNeighborhoodGroups());
  };

  const handleApproveTask = (taskId: string) => {
    const res = approveNeighborhoodTask(selectedGroupId, taskId);
    if (res.success) {
      setGroups(getStoredNeighborhoodGroups());
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDesc.trim()) return;

    postNeighborhoodTask(selectedGroupId, {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      rewardPoints: Number(newTaskReward) || 150,
      posterName: profile.name || 'Nabo',
      posterAddress: 'Øvre Korskirkeallmenningen 8',
    });

    setGroups(getStoredNeighborhoodGroups());
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsNewTaskOpen(false);
  };

  const handleCreateGroupPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupPostText.trim()) return;

    const allGroups = getStoredNeighborhoodGroups();
    const grp = allGroups.find(g => g.id === selectedGroupId);
    if (grp) {
      grp.wallPosts = [
        {
          id: `wp-${Date.now()}`,
          authorName: `${profile.name} (Øvre Korskirkeallmenningen 8)`,
          text: groupPostText.trim(),
          timestamp: 'Akkurat nå',
        },
        ...grp.wallPosts,
      ];
      saveStoredNeighborhoodGroups([...allGroups]);
      setGroups(allGroups);
      setGroupPostText('');
      setIsNewPostOpen(false);
    }
  };

  // 5. Toggle like
  const handleToggleLike = (feedId: string) => {
    const currentUserId = profile.id;
    const updatedFeed = socialState.feed.map(item => {
      if (item.id !== feedId) return item;
      const hasLiked = item.likes.includes(currentUserId);
      const newLikes = hasLiked
        ? item.likes.filter(id => id !== currentUserId)
        : [...item.likes, currentUserId];
      return { ...item, likes: newLikes };
    });

    const updatedState = { ...socialState, feed: updatedFeed };
    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
  };

  // 6. Send Sol-heiarop (+10 lux)
  const handleSendSolarCheer = (feedId: string) => {
    if (cheeredIds.includes(feedId)) return;
    setCheeredIds(prev => [...prev, feedId]);

    const updatedFeed = socialState.feed.map(item => {
      if (item.id !== feedId) return item;
      return { ...item, solarCheers: item.solarCheers + 10 };
    });

    const updatedState = { ...socialState, feed: updatedFeed };
    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
  };

  // 7. Legg til kommentar
  const handleAddComment = (feedId: string) => {
    const text = commentInputs[feedId];
    if (!text || !text.trim()) return;

    const updatedFeed = socialState.feed.map(item => {
      if (item.id !== feedId) return item;
      return {
        ...item,
        comments: [
          ...item.comments,
          {
            id: `c-${Date.now()}`,
            authorId: profile.id,
            authorName: profile.name,
            authorAvatar: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            text: text.trim(),
            timestamp: 'Akkurat nå',
          },
        ],
      };
    });

    const updatedState = { ...socialState, feed: updatedFeed };
    onUpdateSocialState(updatedState);
    saveStoredSocialState(updatedState);
    setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
  };

  // 8. Kopiér invitasjonslenke
  const handleCopyInviteLink = () => {
    navigator.clipboard?.writeText(window.location.origin + '?ref=venn_' + profile.id);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredFriends = socialState.friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header (Facebook/Nordic Hybrid) */}
        <div className="shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Venner & Sosialt
                </h2>
                {socialState.incomingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                    {socialState.incomingRequests.length} nye
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Se hva vennene dine gjør i solen, planlegg fellesturer og del opplevelser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faner */}
        <div className="shrink-0 flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 px-4 sm:px-6 py-2.5 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Nyhetsstrøm ({socialState.feed.length})
          </button>

          <button
            onClick={() => setActiveTab('nabolag')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 ${
              activeTab === 'nabolag'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Home className="w-4 h-4 text-amber-300" />
            Nabolagsgrupper 🏘️
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 relative ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            Forespørsler
            {socialState.incomingRequests.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'requests' ? 'bg-white text-blue-600' : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {socialState.incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Mine Venner ({socialState.friends.length})
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 ${
              activeTab === 'find'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Finn venner ({socialState.suggestions.length})
          </button>

          <button
            onClick={() => setActiveTab('folge')}
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 ${
              activeTab === 'folge'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Sun className="w-4 h-4" />
            Følge
          </button>
        </div>

        {/* Fane-innhold */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-zinc-50/50 dark:bg-zinc-950/30">
          
          {/* TAB: NABOLAGSGRUPPER & OPPGAVER (KORSKIRKEALLMENNINGEN ETC.) */}
          {activeTab === 'nabolag' && (() => {
            const currentGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
            return (
              <div className="space-y-5">
                {/* Gruppebytte */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {groups.map(grp => (
                    <button
                      key={grp.id}
                      onClick={() => setSelectedGroupId(grp.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 cursor-pointer ${
                        selectedGroupId === grp.id
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-400'
                      }`}
                    >
                      <span>🏘️</span>
                      <span>{grp.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({grp.memberCount})</span>
                    </button>
                  ))}
                </div>

                {/* Aktiv Gruppe Header */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-500/30 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          {currentGroup.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {currentGroup.memberCount} naboer
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{currentGroup.area}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Adresse bekreftet (Øvre Korskirkeallmenningen 8)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300/90 leading-relaxed border-t border-amber-500/20 pt-2.5">
                    {currentGroup.description}
                  </p>
                </div>

                {/* Del 1: Nabolagsoppgaver for barna */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        Nabolagsoppgaver for barna & ungdommen
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Naboer lyser ut oppdrag med poengbetaling. Barna utfører oppgaven og tjener Luks-poeng til familieopplevelser!
                      </p>
                    </div>

                    <button
                      onClick={() => setIsNewTaskOpen(!isNewTaskOpen)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Legg ut oppgave</span>
                    </button>
                  </div>

                  {/* Skjema for ny oppgave */}
                  {isNewTaskOpen && (
                    <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-400/50 shadow-md space-y-3 animate-in fade-in">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">Lys ut nytt oppdrag i {currentGroup.name}:</div>
                      <div>
                        <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">Hva skal gjøres?</label>
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          placeholder="F.eks. Lufte hund eller feie trapp og fortau"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">Beskrivelse / Detaljer</label>
                        <input
                          type="text"
                          value={newTaskDesc}
                          onChange={e => setNewTaskDesc(e.target.value)}
                          placeholder="F.eks. Snill golden retriever trenger 45 min tur mot Skomakerdiket."
                          className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-zinc-500 dark:text-zinc-400">Belønning:</label>
                          <select
                            value={newTaskReward}
                            onChange={e => setNewTaskReward(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white font-mono font-bold"
                          >
                            <option value={100}>100 poeng</option>
                            <option value={150}>150 poeng</option>
                            <option value={200}>200 poeng</option>
                            <option value={250}>250 poeng</option>
                            <option value={350}>350 poeng</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsNewTaskOpen(false)}
                            className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            Avbryt
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                          >
                            Lys ut oppgave
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Oppgaveliste */}
                  <div className="space-y-3">
                    {currentGroup.tasks.map(task => {
                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                  {task.title}
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                  task.status === 'open' 
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : task.status === 'claimed'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : task.status === 'completed'
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {task.status === 'open' && '🟢 Åpen for oppdrag'}
                                  {task.status === 'claimed' && `🟡 Tatt av ${task.assignedChildName || 'barn'}`}
                                  {task.status === 'completed' && '🔵 Fullført – Venter på godkjenning'}
                                  {task.status === 'approved' && '✅ Godkjent & Utbetalt'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                {task.description}
                              </p>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-0.5">
                                <span>Utlyst av: <strong>{task.posterName}</strong> ({task.posterAddress})</span>
                                <span>• {task.createdAt}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                                +{task.rewardPoints} p
                              </div>
                            </div>
                          </div>

                          {/* Handlingsknapper basert på status */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                            {task.status === 'open' && (
                              <button
                                onClick={() => handleClaimTask(task.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Ta oppgaven (Barna)</span>
                              </button>
                            )}

                            {task.status === 'claimed' && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Merk som fullført</span>
                              </button>
                            )}

                            {task.status === 'completed' && (
                              <button
                                onClick={() => handleApproveTask(task.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Godkjenn & Overfør {task.rewardPoints} poeng til barnet</span>
                              </button>
                            )}

                            {task.status === 'approved' && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Belønning overført til barnets opplevelseskonto!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Del 2: Nabolagsveggen (Oppslagstavle) */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        Nabolagsveggen for {currentGroup.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Kaffekopper i solveggen, nabovarsler og hyggelige hilsener i smauene.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsNewPostOpen(!isNewPostOpen)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Skriv innlegg
                    </button>
                  </div>

                  {isNewPostOpen && (
                    <form onSubmit={handleCreateGroupPost} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-sm space-y-3">
                      <input
                        type="text"
                        value={groupPostText}
                        onChange={e => setGroupPostText(e.target.value)}
                        placeholder={`Skriv en hilsen til naboene i ${currentGroup.name}...`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewPostOpen(false)}
                          className="px-3 py-1 rounded-xl text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Avbryt
                        </button>
                        <button
                          type="submit"
                          disabled={!groupPostText.trim()}
                          className="px-4 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                        >
                          Del med nabolaget
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {currentGroup.wallPosts.map(post => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-900 dark:text-white">{post.authorName}</span>
                          <span className="text-[10px] text-zinc-400">{post.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {post.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 1: NYHETSSTRØM (FEED) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Opprett innlegg (Facebook style) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {profile.name.charAt(0)}
                    </div>
                    <input
                      type="text"
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      placeholder={`Hva har du og barna opplevd i solen i dag, ${profile.name}?`}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Deles med alle dine venner på Utaktiv
                    </span>
                    <button
                      type="submit"
                      disabled={!newPostText.trim()}
                      className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition shadow-sm"
                    >
                      Publiser
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed items */}
              {socialState.feed.map(item => {
                const isLiked = item.likes.includes(profile.id);
                const hasCheered = cheeredIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5"
                  >
                    {/* Header: Forfatter + tagget aktivitet */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.authorAvatar}
                          alt={item.authorName}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">
                              {item.authorName}
                            </span>
                            {item.activityTitle && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                • {item.type === 'checkin' ? 'sjekket inn på' : 'planlegger tur til'}{' '}
                                <strong className="text-zinc-800 dark:text-zinc-200">{item.activityTitle}</strong>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">{item.timestamp}</span>
                        </div>
                      </div>

                      {item.solarCheers > 0 && (
                        <div className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" />
                          +{item.solarCheers} Lux heiet
                        </div>
                      )}
                    </div>

                    {/* Innleggstekst */}
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.content}
                    </p>

                    {/* Eventuelt bilde */}
                    {item.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-64 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <img
                          src={item.imageUrl}
                          alt="Bilde"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Handlingsknapper: Like, Cheer, Comment */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleLike(item.id)}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs transition ${
                            isLiked
                              ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/15'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-blue-600' : ''}`} />
                          <span>{item.likes.length > 0 ? item.likes.length : ''} Liker</span>
                        </button>

                        <button
                          onClick={() => handleSendSolarCheer(item.id)}
                          disabled={hasCheered}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs transition ${
                            hasCheered
                              ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/20'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title="Send +10 luks som sol-oppmuntring"
                        >
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>{hasCheered ? 'Sol sendt! ☀️' : 'Gi 10 Lux'}</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)}
                          className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 font-semibold text-xs transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{item.comments.length > 0 ? item.comments.length : ''} Kommentar</span>
                        </button>
                      </div>
                    </div>

                    {/* Kommentar-seksjon */}
                    {(activeCommentId === item.id || item.comments.length > 0) && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        {item.comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2 text-xs">
                            <img
                              src={c.authorAvatar}
                              alt={c.authorName}
                              className="w-6 h-6 rounded-full object-cover mt-0.5"
                            />
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl px-3 py-1.5">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-1.5 text-[11px]">
                                {c.authorName}
                              </span>
                              <span className="text-zinc-700 dark:text-zinc-300 text-xs">
                                {c.text}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Skriv ny kommentar */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={commentInputs[item.id] || ''}
                            onChange={e =>
                              setCommentInputs({ ...commentInputs, [item.id]: e.target.value })
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(item.id);
                              }
                            }}
                            placeholder="Skriv en hyggelig kommentar..."
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(item.id)}
                            className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: VENNEFORESPØRSLER */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Vennskapsforespørsler som venter på ditt svar</span>
                <span className="font-semibold">{socialState.incomingRequests.length} forespørsler</span>
              </div>

              {socialState.incomingRequests.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <Users className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-zinc-500">Ingen nye venneforespørsler akkurat nå.</p>
                </div>
              ) : (
                socialState.incomingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.avatar}
                        alt={req.name}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          {req.name}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {req.city} • {req.mutualFriendsCount} felles venner
                        </p>
                        <span className="text-[10px] text-zinc-400">{req.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Godkjenn
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
                      >
                        Avslå
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: MINE VENNER */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Søk blant dine venner..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        {friend.isOnline && (
                          <div
                            className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-0 right-0"
                            title="Online i solen"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {friend.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {friend.city} • {friend.mutualFriendsCount} felles
                        </p>
                      </div>
                    </div>

                    {/* Status og Sol-streak */}
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                      "{friend.statusText}"
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        {friend.currentStreakDays} dager streak
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                        {friend.totalLux.toLocaleString('no-NO')} luks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FINN VENNER & FORSLAG */}
          {activeTab === 'find' && (
            <div className="space-y-5">
              {/* Inviter venner lenke */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-500" />
                    Inviter venner til Utaktiv
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Del din personlige venne-lenke på Messenger, SMS eller WhatsApp.
                  </p>
                </div>
                <button
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Kopiert lenke! ✓' : 'Kopier lenke'}</span>
                </button>
              </div>

              {/* Personer du kanskje kjenner */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Personer du kanskje kjenner i Bergen
                </h3>

                {socialState.suggestions.length === 0 ? (
                  <p className="text-xs text-zinc-500">Ingen flere forslag for øyeblikket.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {socialState.suggestions.map(sug => (
                      <div
                        key={sug.id}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center space-y-3"
                      >
                        <img
                          src={sug.avatar}
                          alt={sug.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {sug.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {sug.mutualFriendsCount} felles venner
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddSuggestion(sug)}
                          className="w-full py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Legg til</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'folge' && (
            <CompanionsPanel
              profile={profile}
              viewerId={viewerId}
              preset={companionPreset}
              remoteAccount={remoteAccount}
            />
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{socialState.friends.filter(f => f.isOnline).length} venner aktive nå</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
