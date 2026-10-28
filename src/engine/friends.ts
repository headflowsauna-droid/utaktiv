/**
 * Sosial- og vennemotor for Utaktiv (Facebook-stil)
 * Håndterer venner, venneforespørsler, forslag, nyhetsstrøm og sosial deltakelse på aktiviteter.
 */

export interface FriendComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

export interface SocialFeedItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  activityId?: string;
  activityTitle?: string;
  activityLocation?: string;
  content: string;
  type: 'checkin' | 'plan' | 'status';
  timestamp: string;
  likes: string[]; // user IDs who liked
  solarCheers: number; // lux sent as cheers
  comments: FriendComment[];
  imageUrl?: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  city: string;
  mutualFriendsCount: number;
  totalLux: number;
  currentStreakDays: number;
  statusText?: string;
  isOnline: boolean;
  upcomingActivityId?: string;
  upcomingActivityTitle?: string;
}

export interface FriendRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  city: string;
  mutualFriendsCount: number;
  timestamp: string;
}

export interface SocialState {
  friends: FriendProfile[];
  incomingRequests: FriendRequest[];
  suggestions: FriendProfile[];
  feed: SocialFeedItem[];
}

export function isSocialState(value: unknown): value is SocialState {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<SocialState>;
  return Array.isArray(row.friends)
    && Array.isArray(row.incomingRequests)
    && Array.isArray(row.suggestions)
    && Array.isArray(row.feed);
}

export const FRIENDS_STORAGE_KEY = 'sol_uteliv_social_state_v1';

export const INITIAL_FRIENDS: FriendProfile[] = [
  {
    id: 'f-1',
    name: 'Kristian Dahl',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 14,
    totalLux: 18450,
    currentStreakDays: 6,
    statusText: 'Ute på Fløyen med ungene i ettermiddagssola! ☀️',
    isOnline: true,
    upcomingActivityId: 'act-floyen-lekeplass',
    upcomingActivityTitle: 'Fløyen Klatrepark & Trollsti',
  },
  {
    id: 'f-2',
    name: 'Maria Solheim',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 9,
    totalLux: 14200,
    currentStreakDays: 4,
    statusText: 'Klar for Bergenfest og uteservering på USF Verftet!',
    isOnline: true,
    upcomingActivityId: 'act-bergenfest-2026',
    upcomingActivityTitle: 'Bergenfest 2026: Utendørs Hovedscene',
  },
  {
    id: 'f-3',
    name: 'Henrik Wiig',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 22,
    totalLux: 29800,
    currentStreakDays: 12,
    statusText: 'Lader opp til 7-fjellsturen! 🏃‍♂️⛰️',
    isOnline: false,
    upcomingActivityId: 'act-7-fjellsturen',
    upcomingActivityTitle: '7-fjellsturen Bergen 2026',
  },
  {
    id: 'f-4',
    name: 'Silje Lunde',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 5,
    totalLux: 8900,
    currentStreakDays: 2,
    statusText: 'Iskaffe i solkroken på USF ☀️☕',
    isOnline: true,
    upcomingActivityId: 'act-usf-uteservering',
    upcomingActivityTitle: 'USF Verftet Solsiden Kveldssol',
  },
];

export const INITIAL_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    userId: 'u-thomas',
    name: 'Thomas Berg',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 7,
    timestamp: 'For 2 timer siden',
  },
  {
    id: 'req-2',
    userId: 'u-camilla',
    name: 'Camilla Vik',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 3,
    timestamp: 'I går',
  },
];

export const INITIAL_SUGGESTIONS: FriendProfile[] = [
  {
    id: 'sug-1',
    name: 'Jonas Eide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 11,
    totalLux: 11200,
    currentStreakDays: 3,
    isOnline: false,
  },
  {
    id: 'sug-2',
    name: 'Astrid Fosse',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 6,
    totalLux: 16700,
    currentStreakDays: 5,
    isOnline: true,
  },
  {
    id: 'sug-3',
    name: 'Sander Nilsen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    city: 'Bergen',
    mutualFriendsCount: 4,
    totalLux: 7300,
    currentStreakDays: 1,
    isOnline: false,
  },
];

export const INITIAL_FEED: SocialFeedItem[] = [
  {
    id: 'feed-1',
    authorId: 'f-1',
    authorName: 'Kristian Dahl',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    activityId: 'act-floyen-lekeplass',
    activityTitle: 'Fløyen Klatrepark & Trollsti',
    activityLocation: 'Fløyen, Bergen',
    content: 'Fantastisk ettermiddag på Fløyen med barna! Klatret løypen to ganger og avsluttet med skillingsbolle i solen. Anbefales varmt! 🌲☀️🧗‍♂️',
    type: 'checkin',
    timestamp: 'For 45 minutter siden',
    likes: ['user-alexander'],
    solarCheers: 40,
    comments: [
      {
        id: 'c-1',
        authorId: 'f-2',
        authorName: 'Maria Solheim',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        text: 'Så koselig! Vi vurderer å ta turen dit i morgen formiddag 🙌',
        timestamp: 'For 20 min siden',
      },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'feed-2',
    authorId: 'f-2',
    authorName: 'Maria Solheim',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    activityId: 'act-bergenfest-2026',
    activityTitle: 'Bergenfest 2026: Utendørs Hovedscene',
    activityLocation: 'Koengen, Bergen',
    content: 'Har akkurat sikret meg billett til Bergenfest! Hvem andre skal dit? Hadde vært supert med felles samling i solkroken før konserten! 🎶☀️',
    type: 'plan',
    timestamp: 'For 3 timer siden',
    likes: ['f-1', 'f-4'],
    solarCheers: 20,
    comments: [],
  },
  {
    id: 'feed-3',
    authorId: 'f-3',
    authorName: 'Henrik Wiig',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    activityId: 'act-7-fjellsturen',
    activityTitle: '7-fjellsturen Bergen 2026',
    activityLocation: 'Bergen',
    content: 'Fullførte 18 km testtur over Ulriken og Vidden i dag. Solen sto rett på og ga 45 000 luks! Nå er kroppen klar for 7-fjellsturen 🚀🏔️',
    type: 'checkin',
    timestamp: 'I formiddag',
    likes: ['user-alexander', 'f-1', 'f-2'],
    solarCheers: 60,
    comments: [
      {
        id: 'c-2',
        authorId: 'f-1',
        authorName: 'Kristian Dahl',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        text: 'Rått tempo, Henrik! Heia!',
        timestamp: 'For 2 timer siden',
      },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
  },
];

let _memorySocialState: SocialState | null = null;

export function getStoredSocialState(): SocialState {
  if (_memorySocialState) {
    return _memorySocialState;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.friends) && Array.isArray(parsed.incomingRequests)) {
          _memorySocialState = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Kunne ikke laste sosial tilstand:', e);
  }

  const initial: SocialState = {
    friends: INITIAL_FRIENDS,
    incomingRequests: INITIAL_REQUESTS,
    suggestions: INITIAL_SUGGESTIONS,
    feed: INITIAL_FEED,
  };
  _memorySocialState = initial;
  return initial;
}

export function saveStoredSocialState(state: SocialState): void {
  _memorySocialState = state;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Kunne ikke lagre sosial tilstand:', e);
  }
}

/**
 * Henter venner som har planlagt eller sjekket inn på en gitt aktivitet
 */
export function getFriendsForActivity(activityId: string, friends: FriendProfile[]): FriendProfile[] {
  return friends.filter(f => f.upcomingActivityId === activityId);
}

export interface NeighborhoodTask {
  id: string;
  groupId: string;
  title: string;
  description: string;
  rewardPoints: number;
  posterName: string;
  posterAddress: string;
  assignedChildName?: string;
  status: 'open' | 'claimed' | 'completed' | 'approved';
  createdAt: string;
}

export interface NeighborhoodGroup {
  id: string;
  name: string;
  area: string;
  description: string;
  memberCount: number;
  isMember?: boolean;
  wallPosts: {
    id: string;
    authorName: string;
    text: string;
    timestamp: string;
  }[];
  tasks: NeighborhoodTask[];
}

export const GROUPS_STORAGE_KEY = 'sol_uteliv_neighborhood_groups_v1';

export const INITIAL_GROUPS: NeighborhoodGroup[] = [
  {
    id: 'grp-korskirken',
    name: 'Korskirkeallmenningen Nabolag',
    area: 'Øvre & Nedre Korskirkeallmenningen, 5017 Bergen',
    description: 'Nabolagsgruppe for beboere i Korskirkeallmenningen og Vågsbunnen. Her deler vi nyheter, låner ut verktøy og gir trygge småoppdrag til nabolagsbarna!',
    memberCount: 48,
    isMember: true,
    wallPosts: [
      {
        id: 'wp-1',
        authorName: 'Ingrid H. (Korskirkeallmenningen 12)',
        text: 'Nydelig ettermiddagssol i smauene nå! Vi setter ut en kaffekanne og noen nysteikte vafler på benken ved fontenen kl 16:30 for alle naboer som vil slå av en prat. ☀️🧇',
        timestamp: 'I dag kl. 14:15',
      },
      {
        id: 'wp-2',
        authorName: 'Alexander Robertsen (Øvre Korskirkeallmenningen 8)',
        text: 'Oliver og jeg har ryddet fortauet og stilt i stand benkene. Kjekt om barna i gaten vil ta noen småoppdrag på oppgaveveggen under her!',
        timestamp: 'I går',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        groupId: 'grp-korskirken',
        title: 'Lufte golden retrieveren Balder på Fløyen',
        description: 'Balder trenger 45 min tur i frisk luft opp mot Tippetue eller Skomakerdiket. Snill og glad hund!',
        rewardPoints: 250,
        posterName: 'Ingrid H.',
        posterAddress: 'Korskirkeallmenningen 12',
        status: 'open',
        createdAt: 'I dag kl. 11:00',
      },
      {
        id: 'task-2',
        groupId: 'grp-korskirken',
        title: 'Feie trappen og fortauet for løv og grus',
        description: 'Feie inngangspartiet og trappen ned mot smauet så det er pent og trygt for naboene.',
        rewardPoints: 150,
        posterName: 'Alexander Robertsen',
        posterAddress: 'Øvre Korskirkeallmenningen 8',
        assignedChildName: 'Oliver (9 år)',
        status: 'claimed',
        createdAt: 'I dag kl. 09:30',
      },
      {
        id: 'task-3',
        groupId: 'grp-korskirken',
        title: 'Bære inn to sekker tørr bjørkeved fra bakgården',
        description: 'Bære to sekker ved opp til 2. etasje før kvelden. Lett og grei jobb for to spreke bein!',
        rewardPoints: 200,
        posterName: 'Per Morten',
        posterAddress: 'Nedre Korskirkeallmenningen 3',
        status: 'open',
        createdAt: 'I går',
      },
    ],
  },
  {
    id: 'grp-mohlenpris',
    name: 'Møhlenpris & Puddefjorden',
    area: 'Møhlenpris & Cornerteateret',
    description: 'For familier og naboer på Møhlenpris. Sammen om lekeparken og turer langs Puddefjorden!',
    memberCount: 36,
    isMember: false,
    wallPosts: [
      {
        id: 'wp-m1',
        authorName: 'Eirik T.',
        text: 'Kajakkutlån ved Puddefjorden er åpent for nabolaget i helgen!',
        timestamp: 'For 3 dager siden',
      },
    ],
    tasks: [
      {
        id: 'task-m1',
        groupId: 'grp-mohlenpris',
        title: 'Rake hagen ved Cornerteateret',
        description: 'Samle tørt løv i tre sekker ved lekeplassen.',
        rewardPoints: 180,
        posterName: 'Maren T.',
        posterAddress: 'Professor Hansteens gate',
        status: 'open',
        createdAt: 'I går',
      },
    ],
  },
];

let _memoryGroups: NeighborhoodGroup[] | null = null;

export function getStoredNeighborhoodGroups(): NeighborhoodGroup[] {
  if (_memoryGroups) return _memoryGroups;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _memoryGroups = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Kunne ikke laste nabolagsgrupper:', e);
  }
  _memoryGroups = INITIAL_GROUPS;
  return INITIAL_GROUPS;
}

export function saveStoredNeighborhoodGroups(groups: NeighborhoodGroup[]): void {
  _memoryGroups = groups;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    }
  } catch (e) {
    console.error('Kunne ikke lagre nabolagsgrupper:', e);
  }
}

export function claimNeighborhoodTask(groupId: string, taskId: string, childName: string): boolean {
  const groups = getStoredNeighborhoodGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  const task = group.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'open') return false;

  task.status = 'claimed';
  task.assignedChildName = childName;
  saveStoredNeighborhoodGroups([...groups]);
  return true;
}

export function completeNeighborhoodTask(groupId: string, taskId: string): boolean {
  const groups = getStoredNeighborhoodGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  const task = group.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'claimed') return false;

  task.status = 'completed';
  saveStoredNeighborhoodGroups([...groups]);
  return true;
}

export function approveNeighborhoodTask(groupId: string, taskId: string): { success: boolean; points: number } {
  const groups = getStoredNeighborhoodGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return { success: false, points: 0 };
  const task = group.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'completed') return { success: false, points: 0 };

  task.status = 'approved';
  saveStoredNeighborhoodGroups([...groups]);
  return { success: true, points: task.rewardPoints };
}

export function postNeighborhoodTask(
  groupId: string,
  task: Omit<NeighborhoodTask, 'id' | 'groupId' | 'status' | 'createdAt'>
): NeighborhoodTask {
  const groups = getStoredNeighborhoodGroups();
  const group = groups.find(g => g.id === groupId);
  const newTask: NeighborhoodTask = {
    ...task,
    id: `task-${Date.now()}`,
    groupId,
    status: 'open',
    createdAt: 'Akkurat nå',
  };
  if (group) {
    group.tasks = [newTask, ...group.tasks];
    saveStoredNeighborhoodGroups([...groups]);
  }
  return newTask;
}
