import React, { useState } from 'react';
import { ScoredRecommendation } from '../engine/recommender';
import { UserProfile } from '../engine/profile';
import { CompletedCheckin } from '../engine/checkin';
import { ActivityItem, ActivityAddOn } from '../engine/activities';
import { FriendProfile } from '../engine/friends';
import { SupportedLanguage, t } from '../engine/i18n';
import { EidfjordPartnerModal, EidfjordModalMode } from './EidfjordPartnerModal';
import { TurDetailModal } from './TurDetailModal';
import { SpatialActivityCard } from './SpatialActivityCard';
import {
  Music,
  Compass,
  Mountain,
  Bed,
  Globe,
  Baby,
  Armchair,
  MapPin,
} from 'lucide-react';

interface ActivityFeedProps {
  recommendations: ScoredRecommendation[];
  profile: UserProfile;
  completedCheckins: CompletedCheckin[];
  selectedCity?: string;
  friends?: FriendProfile[];
  lang?: SupportedLanguage;
  onOpenTicket: (activity: ActivityItem, selectedAddOns?: ActivityAddOn[]) => void;
  onOpenCheckin: (activity: ActivityItem) => void;
  onOpenMap?: () => void;
  onOpenGiftActivity?: (activity: ActivityItem) => void;
  onOpenPlanActivity?: (activity: ActivityItem) => void;
  onOpenFriends?: () => void;
  onFindCompany?: (activity: ActivityItem, kind: 'plan' | 'trail') => void;
  onAddToTur?: (activity: ActivityItem) => void;
  turActivityIds?: string[];
  cloudCoverPercent?: number;
  cloudIsMeasured?: boolean;
  onTipRouteBusiness?: (activity: ActivityItem) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  recommendations,
  profile,
  completedCheckins,
  selectedCity,
  friends: _friends = [],
  lang = 'no',
  onOpenTicket,
  onOpenCheckin,
  onOpenMap,
  onOpenGiftActivity,
  onOpenPlanActivity,
  onOpenFriends: _onOpenFriends,
  onFindCompany,
  onAddToTur,
  turActivityIds = [],
  cloudCoverPercent: _cloudCoverPercent,
  cloudIsMeasured: _cloudIsMeasured,
  onTipRouteBusiness,
}) => {
  const [filter, setFilter] = useState<'all' | 'hike' | 'ski' | 'family' | 'concert' | 'nature' | 'cafebar' | 'accommodation' | 'senior' | 'tourist'>('all');
  const [childFilter, setChildFilter] = useState<'all' | 'stroller' | string>('all');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [eidfjordModalMode, setEidfjordModalMode] = useState<EidfjordModalMode>(null);
  const [selectedTurActivity, setSelectedTurActivity] = useState<ActivityItem | null>(null);

  const toggleSave = (id: string) => {
    setSavedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isActivityCompleted = (actId: string) => {
    return completedCheckins.some(c => c.activityId === actId);
  };

  const filtered = recommendations.filter(r => {
    // 0. By-filter hvis valgt (f.eks. Bergen, Stavanger, Trondheim, Kristiansand, Bodø)
    if (selectedCity && selectedCity !== 'all') {
      if (r.activity.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
    }

    // 1. Kategori-filter
    if (filter !== 'all') {
      if (filter === 'hike' && r.activity.category !== 'hike') return false;
      if (filter === 'ski' && r.activity.category !== 'ski') return false;
      if (filter === 'family' && r.activity.category !== 'family') return false;
      if (filter === 'concert' && r.activity.category !== 'concert' && r.activity.category !== 'festival') return false;
      if (filter === 'nature' && r.activity.category !== 'nature') return false;
      if (filter === 'cafebar' && r.activity.category !== 'cafebar') return false;
      if (filter === 'accommodation' && r.activity.category !== 'accommodation' && r.activity.category !== 'hostel') return false;
      if (filter === 'senior') {
        const isSeniorFriendly =
          (r.activity.seniorSafety && (
            r.activity.seniorSafety.surface === 'paved' ||
            r.activity.seniorSafety.surface === 'firm_gravel' ||
            r.activity.seniorSafety.benchDensity === 'frequent'
          )) ||
          (!r.activity.seniorSafety && r.activity.strollerAccessible && (
            r.activity.trail?.difficulty === 'green' ||
            r.activity.category === 'nature' ||
            r.activity.category === 'cafebar' ||
            r.activity.category === 'accommodation' ||
            r.activity.category === 'hostel'
          ));
        if (!isSeniorFriendly) return false;
      }
      if (filter === 'tourist') {
        const isTouristHighlight =
          Boolean(r.activity.touristSecurity) ||
          (r.activity.tripAdvisorRating !== undefined && r.activity.tripAdvisorRating >= 4.8) ||
          r.activity.category === 'accommodation' ||
          r.activity.category === 'hostel' ||
          r.activity.trail?.type === 'mountain_hike';
        if (!isTouristHighlight) return false;
      }
    }

    // 2. Barne- og familiefilter
    if (childFilter === 'stroller') {
      return r.activity.strollerAccessible;
    }
    if (childFilter !== 'all') {
      const matchChild = r.familyDetails?.childDetails?.find(c => c.childId === childFilter);
      if (matchChild && !matchChild.compatible) {
        return false;
      }
    }

    return true;
  });

  const ordered = [
    ...filtered.filter(r => r.activity.stopKind),
    ...filtered.filter(r => !r.activity.stopKind),
  ];

  return (
    <div className="space-y-4">
      {/* Hovedkategori-tabs med DNT Fjell- og Skiløyper */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center ${
            filter === 'all'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          Alle ({filtered.length})
        </button>

        <button
          onClick={() => setFilter('hike')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'hike'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          Fjell & Toppturer
        </button>

        <button
          onClick={() => setFilter('ski')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'ski'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <span className="text-xs">⛷️</span>
          Skiløyper (DNT/Sporet)
        </button>

        <button
          onClick={() => setFilter('family')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'family'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Baby className="w-3.5 h-3.5" />
          Familie & Lek
        </button>

        <button
          onClick={() => setFilter('concert')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'concert'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Konserter & Musikk
        </button>

        <button
          onClick={() => setFilter('nature')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'nature'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Kyst & Turer
        </button>

        <button
          onClick={() => setFilter('accommodation')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
            filter === 'accommodation'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Accommodation & Stays' : 'Overnatting & Hostel'}
        </button>

        <button
          onClick={() => setFilter('senior')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center gap-1.5 ${
            filter === 'senior'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Armchair className="w-3.5 h-3.5" />
          {t('seniorFilter', lang)} 🪑
        </button>

        <button
          onClick={() => setFilter('tourist')}
          className={`min-h-11 px-3.5 rounded-2xl text-xs font-bold transition shrink-0 inline-flex items-center gap-1.5 ${
            filter === 'tourist'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          {t('touristFilter', lang)} 🌍
        </button>

        {onOpenMap && (
          <button
            onClick={onOpenMap}
            className="ml-auto px-3.5 py-2 rounded-2xl text-xs font-bold bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/25 transition flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Kart</span>
          </button>
        )}
      </div>

      {/* Familiefilter (kun når brukeren har barn) */}
      {profile.hasChildren && profile.children.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs bg-orange-50/50 dark:bg-orange-950/20 p-2 rounded-2xl border border-orange-200/60 dark:border-orange-500/20">
          <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1 shrink-0 pl-1">
            <Baby className="w-3.5 h-3.5 text-orange-500" />
            Familiefilter:
          </span>

          <button
            onClick={() => setChildFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 ${
              childFilter === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-orange-50'
            }`}
          >
            👨‍👩‍👧‍👦 Alle ({profile.children.map(c => c.name).join(' & ')})
          </button>

          {profile.children.map(child => (
            <button
              key={child.id}
              onClick={() => setChildFilter(childFilter === child.id ? 'all' : child.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 ${
                childFilter === child.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-orange-50'
              }`}
            >
              🧒 Kun {child.name} ({child.age} år)
            </button>
          ))}

          <button
            onClick={() => setChildFilter(childFilter === 'stroller' ? 'all' : 'stroller')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 ${
              childFilter === 'stroller'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-orange-50'
            }`}
          >
            🍼 Barnevogn
          </button>
        </div>
      )}

      {ordered.some(r => r.activity.stopKind) && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Steder der siden er lest. Ingen av disse går til betaling her.
        </p>
      )}

      {/* Liste med aktivitetskort (Spatial Spotlight & Kompakt Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ordered.map(({ activity, score, distanceKm, travelMinWalk, openNow, deal, matchReasons }) => {
          const isSaved = savedIds.includes(activity.id);
          const completed = isActivityCompleted(activity.id);
          const isInTur = turActivityIds.includes(activity.id);

          return (
            <SpatialActivityCard
              key={activity.id}
              activity={activity}
              score={score}
              isSaved={isSaved}
              isInTur={isInTur}
              isCompleted={completed}
              distanceKm={distanceKm}
              travelMinWalk={travelMinWalk}
              openNow={openNow}
              deal={deal}
              lang={lang}
              matchReasons={matchReasons}
              onSelect={(act) => setSelectedTurActivity(act)}
              onToggleSave={toggleSave}
              onAddToTur={(act) => onAddToTur?.(act)}
            />
          );
        })}
      </div>

      <EidfjordPartnerModal
        mode={eidfjordModalMode}
        onClose={() => setEidfjordModalMode(null)}
      />

      <TurDetailModal
        activity={selectedTurActivity}
        isOpen={Boolean(selectedTurActivity)}
        onClose={() => setSelectedTurActivity(null)}
        isInTur={selectedTurActivity ? turActivityIds.includes(selectedTurActivity.id) : false}
        isSaved={selectedTurActivity ? savedIds.includes(selectedTurActivity.id) : false}
        isCompleted={selectedTurActivity ? completedCheckins.some(c => c.activityId === selectedTurActivity.id) : false}
        onToggleSave={(id) => setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onAddToTur={(act) => onAddToTur?.(act)}
        onOpenCheckin={onOpenCheckin}
        onOpenTicket={onOpenTicket}
        onOpenPartnerModal={(mode) => setEidfjordModalMode(mode)}
        onOpenFullMap={onOpenMap}
        onFindCompany={onFindCompany}
        onOpenPlanActivity={onOpenPlanActivity}
        onOpenGiftActivity={onOpenGiftActivity}
        onTipRouteBusiness={onTipRouteBusiness}
        lang={lang}
      />
    </div>
  );
};
