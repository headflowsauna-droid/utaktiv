import React, { useState, useMemo, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { HeroBanner } from './components/HeroBanner';
import { SunRadar } from './components/SunRadar';
import { ActivityFeed } from './components/ActivityFeed';
import { ConciergeChat } from './components/ConciergeChat';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { TicketModal } from './components/TicketModal';
import { GpsCheckinModal } from './components/GpsCheckinModal';
import { InteractiveMap } from './components/InteractiveMap';
import { DaylightSensorWidget } from './components/DaylightSensorWidget';
import { SolStoreModal } from './components/SolStoreModal';
import { JuniorChoresModal } from './components/JuniorChoresModal';
import { CommunityWallModal } from './components/CommunityWallModal';
import { WalletModal } from './components/WalletModal';
import { GiftModal } from './components/GiftModal';
import { ChristmasGiftModal } from './components/ChristmasGiftModal';
import { PlannerModal } from './components/PlannerModal';
import { SavingsModal } from './components/SavingsModal';
import { IosInstallPrompt } from './components/IosInstallPrompt';
import { FriendsModal } from './components/FriendsModal';
import { AccountModal } from './components/AccountModal';
import { LocationPrompt, LocationStatus } from './components/LocationPrompt';
import { AppTab, MobileNav } from './components/MobileNav';
import { TurKurvPill } from './components/TurKurvPill';
import { TurBuilderModal } from './components/TurBuilderModal';
import { WeatherStrip } from './components/WeatherStrip';
import { LiveWeatherCard } from './components/LiveWeatherCard';
import { SolarAstrolabe } from './components/SolarAstrolabe';
import { SkattekisteModal } from './components/SkattekisteModal';
import { SolCameraAR } from './components/SolCameraAR';
import { FamilieEventyrModal } from './components/FamilieEventyrModal';
import { NatureQuestModal } from './components/NatureQuestModal';
import { TinydomeModal } from './components/TinydomeModal';
import { TipInnPanel } from './components/TipInnPanel';
import { useTurKurv, decodeTurSharePayload, isTurKurv } from './hooks/useTurKurv';
import { turNoteForStop } from './data/sourcedStops';
import { UserProfile, getStoredProfile, isUserProfile, saveStoredProfile, DEFAULT_USER_PROFILE } from './engine/profile';
import { INITIAL_ACTIVITIES, ActivityItem, ActivityAddOn, SUPPORTED_CITIES } from './engine/activities';
import { buildSolarStatusFromMet, calculateSolarAltitude, getSolarStatus, SolarStatus } from './engine/solar';
import { fetchMetForecast, fetchMetOutlook, MetForecast, MetOutlookPoint } from './engine/weather';
import { findSolWindow, formatSolAlarm } from './engine/solAlarm';
import { enableSolAlarmNotifications } from './pwa/register';
import { rankActivitiesForProfile } from './engine/recommender';
import { LatLng, nearestCity, saveSelectedCityToStorage, getSelectedCityFromStorage } from './engine/location';
import { Deal, Place } from './engine/places';
import placesData from './data/places.json';
import { getCompletedCheckins, CompletedCheckin } from './engine/checkin';
import { getUserPointsBalance, getEarnedPointsBalance } from './engine/gamification';
import { grantEarned, pullPointEntries, pullProfile, pullSocialState, pullTurKurv, pushProfile, pushSocialState } from './engine/cloudSync';
import { getStoredSocialState, isSocialState, saveStoredSocialState, SocialState } from './engine/friends';
import { AccountSession, readSession, watchSession, setVippsSession } from './engine/account';
import { completeVippsLogin } from './engine/vipps';
import { clearPointEntries, earnedBalance, purchasedBalance } from './engine/pointsLedger';
import { cardFromProfile, publishMatchCard, readAdultBand } from './engine/companionStore';
import { ExploreNorwayCarousel } from './components/ExploreNorwayCarousel';
import { SupportedLanguage, getStoredLanguage, saveStoredLanguage, t } from './engine/i18n';
import { Sun, MessageSquare, Compass, Users, Settings, Moon, ChevronRight, Award, Zap, MapPin, ShoppingBag, HeartHandshake, Wallet, Cake, Plane, UserRound, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [mapFocus, setMapFocus] = useState<{
    query?: string;
    category?: string;
    lat?: number;
    lng?: number;
    zoom?: number;
  } | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [selectedCity, setSelectedCity] = useState<string>(
    () => getSelectedCityFromStorage() || getStoredProfile().city || 'Bergen'
  );
  const [gpsPosition, setGpsPosition] = useState<LatLng | null>(null);
  const [isLocationPromptOpen, setIsLocationPromptOpen] = useState(false);
  const [isRequestingGps, setIsRequestingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [socialState, setSocialState] = useState<SocialState>(getStoredSocialState);
  const [activities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [completedCheckins, setCompletedCheckins] = useState<CompletedCheckin[]>([]);
  const [userPoints, setUserPoints] = useState<number>(getUserPointsBalance());
  const [earnedPoints, setEarnedPoints] = useState<number>(getEarnedPointsBalance());
  const [session, setSession] = useState<AccountSession | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [friendsTab, setFriendsTab] = useState<'feed' | 'requests' | 'friends' | 'find' | 'folge'>('feed');
  const [companionPreset, setCompanionPreset] = useState<{ id: string; title: string; kind: 'plan' | 'trail' } | null>(null);
  const [liveSolar, setLiveSolar] = useState<SolarStatus | null>(null);
  const [solAlarmText, setSolAlarmText] = useState<string | null>(null);
  const [alarmNote, setAlarmNote] = useState<string | null>(null);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sol_uteliv_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light'; // Standard hvit bakgrunn som ønsket av Alexander
  });
  const [lang, setLang] = useState<SupportedLanguage>(getStoredLanguage);

  const handleToggleLanguage = () => {
    const next: SupportedLanguage = lang === 'no' ? 'en' : 'no';
    setLang(next);
    saveStoredLanguage(next);
  };

  useEffect(() => {
    try {
      localStorage.setItem('sol_uteliv_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Modaler
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isChristmasModalOpen, setIsChristmasModalOpen] = useState(false);
  const [giftInitialActivity, setGiftInitialActivity] = useState<ActivityItem | null>(null);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [plannerInitialActivity, setPlannerInitialActivity] = useState<ActivityItem | null>(null);
  const [plannerInitialTab, setPlannerInitialTab] = useState<'events' | 'new_birthday' | 'new_trip' | 'trail_demand'>('events');
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isJuniorModalOpen, setIsJuniorModalOpen] = useState(false);
  const [isCommunityWallOpen, setIsCommunityWallOpen] = useState(false);
  const [ticketActivity, setTicketActivity] = useState<ActivityItem | null>(null);
  const [ticketAddOns, setTicketAddOns] = useState<ActivityAddOn[]>([]);
  const [checkinActivity, setCheckinActivity] = useState<ActivityItem | null>(null);
  const [showRadarDetails, setShowRadarDetails] = useState(false);
  const [isTurBuilderOpen, setIsTurBuilderOpen] = useState(false);
  const [isSkattekisteOpen, setIsSkattekisteOpen] = useState(false);
  const [isSolCameraOpen, setIsSolCameraOpen] = useState(false);
  const [isFamilieEventyrOpen, setIsFamilieEventyrOpen] = useState(false);
  const [isNatureQuestOpen, setIsNatureQuestOpen] = useState(false);
  const [isTinydomeModalOpen, setIsTinydomeModalOpen] = useState(false);
  const [tipPrefillTrail, setTipPrefillTrail] = useState<string | null>(null);
  const [metForecast, setMetForecast] = useState<MetForecast | null>(null);
  const [metOutlook, setMetOutlook] = useState<MetOutlookPoint[]>([]);
  const { kurv, addStop, removeStop, updateStop, moveStop, clearKurv, importSharedKurv, count: turCount } = useTurKurv();

  useEffect(() => {
    setCompletedCheckins(getCompletedCheckins());

    // Sjekk URL query parameters for spleiskode, delt tur (?tur=...) eller fullført Stripe betaling
    try {
      const params = new URLSearchParams(window.location.search);
      const spleisCode = params.get('spleis');
      if (spleisCode) {
        setIsSavingsModalOpen(true);
      }
      const sharedTurParam = params.get('tur');
      if (sharedTurParam) {
        const decoded = decodeTurSharePayload(sharedTurParam);
        if (decoded && decoded.kurv.stops.length > 0) {
          importSharedKurv(decoded.kurv);
          if (decoded.kurv.city) {
            setSelectedCity(decoded.kurv.city);
          }
          setIsTurBuilderOpen(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      const paymentStatus = params.get('payment');
      if (paymentStatus === 'success') {
        setPaymentNote('Stripe har sendt deg tilbake. Poeng krediteres når webhooken bekrefter betalingen.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const juniorParam = params.get('junior');
      if (juniorParam) {
        setIsJuniorModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const julParam = params.get('jul') || params.get('julegave') || params.get('gave');
      if (julParam) {
        setIsChristmasModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const skattParam = params.get('skatt') || params.get('rebus') || params.get('mysterium');
      if (skattParam) {
        setIsSkattekisteOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const arParam = params.get('ar') || params.get('kamera') || params.get('jakt') || params.get('pokemon');
      if (arParam) {
        setIsSolCameraOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const eventyrParam = params.get('eventyr') || params.get('familie') || params.get('soljakten');
      if (eventyrParam) {
        setIsFamilieEventyrOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      const refParam = params.get('ref');
      if (refParam) {
        try {
          localStorage.setItem('utaktiv_referrer', refParam);
        } catch {
          // ignore
        }
        if (refParam.toLowerCase().includes('alexander')) {
          setPaymentNote('Velkommen! Du ble invitert av Alexander. Bli med ut i dagslyset og samle Luks-poeng!');
        } else {
          setPaymentNote('Velkommen til Utaktiv! Bli med ut i dagslyset og opplev mer sammen.');
        }
      }
      const savedVippsState = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('utaktiv_vipps_auth_state')
        : null;
      const urlError = params.get('error');
      const urlErrorDesc = params.get('error_description');
      if (urlError) {
        if (savedVippsState) {
          if (urlError === 'access_denied') {
            setPaymentNote('Innlogging med Vipps ble avbrutt.');
          } else {
            setPaymentNote(`Vipps-innlogging feilet: ${urlErrorDesc || urlError}`);
          }
          try {
            sessionStorage.removeItem('utaktiv_vipps_auth_state');
          } catch {
            // ignore
          }
        } else {
          if (urlError === 'access_denied') {
            setPaymentNote('Innlogging ble avbrutt.');
          } else {
            setPaymentNote(`Innlogging feilet: ${urlErrorDesc || urlError}`);
          }
        }
        params.delete('error');
        params.delete('error_description');
        params.delete('error_code');
        const restSearch = params.toString();
        const cleanUrl = `${window.location.pathname}${restSearch ? '?' + restSearch : ''}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      const vippsCode = params.get('code');
      const vippsState = params.get('state');
      if (vippsCode && vippsState && savedVippsState && vippsState === savedVippsState) {
        completeVippsLogin(vippsCode, vippsState, window.location.origin + window.location.pathname)
          .then((res) => {
            if (res.success && res.user) {
              const newSession = setVippsSession(res.user);
              setSession(newSession);
              setPaymentNote(`Velkommen tilbake, ${res.user.name || 'Vipps-bruker'}! Du er nå logget inn med Vipps.`);
            } else if (res.error) {
              setPaymentNote(`Vipps innlogging: ${res.error}`);
            }
          })
          .catch(() => {});
        params.delete('code');
        params.delete('state');
        const restSearch = params.toString();
        const cleanUrl = `${window.location.pathname}${restSearch ? '?' + restSearch : ''}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // ignore
    }
  }, [importSharedKurv]);

  const refreshBalances = () => {
    setUserPoints(purchasedBalance());
    setEarnedPoints(earnedBalance());
  };

  useEffect(() => {
    let alive = true;
    let ready = false;
    let currentUserId: string | null = null;
    let currentSessionKey: string | null = null;

    const applyBalances = () => {
      if (!alive) return;
      setUserPoints(purchasedBalance());
      setEarnedPoints(earnedBalance());
    };

    const hydrate = async (userId: string, sessionAvatar?: string) => {
      await pullPointEntries();
      applyBalances();
      const remote = await pullProfile();
      if (!alive) return;
      if (remote.ok && isUserProfile(remote.profile)) {
        let mergedProfile = remote.profile;
        let needsUpdate = false;
        if (!mergedProfile.avatarUrl && sessionAvatar) {
          mergedProfile = { ...mergedProfile, avatarUrl: sessionAvatar };
          needsUpdate = true;
        }
        if (mergedProfile.id !== userId) {
          mergedProfile = { ...mergedProfile, id: userId };
          needsUpdate = true;
        }
        if (needsUpdate) {
          void pushProfile(mergedProfile);
        }
        saveStoredProfile(mergedProfile);
        setProfile(mergedProfile);
        if (mergedProfile.city) setSelectedCity(mergedProfile.city);
        await publishMatchCard(cardFromProfile(mergedProfile, readAdultBand()), userId);
      } else {
        const local = getStoredProfile();
        await pushProfile(local);
        await publishMatchCard(cardFromProfile(local, readAdultBand()), userId);
      }
      const social = await pullSocialState();
      if (!alive) return;
      if (social.ok && isSocialState(social.state)) {
        saveStoredSocialState(social.state);
        setSocialState(social.state);
      }
      const remoteTur = await pullTurKurv();
      if (!alive) return;
      if (remoteTur.ok && isTurKurv(remoteTur.kurv) && remoteTur.kurv.stops.length > 0) {
        importSharedKurv(remoteTur.kurv);
      }
    };

    const accept = (next: AccountSession | null) => {
      if (!alive) return;
      const nextKey = next ? `${next.userId}-${next.provider || 'email'}` : null;
      if (nextKey === currentSessionKey && ready) return;

      const previousUserId = currentUserId;
      currentUserId = next?.userId ?? null;
      currentSessionKey = nextKey;
      ready = true;
      setSession(next);

      if (previousUserId && !next) {
        clearPointEntries();
        setUserPoints(0);
        setEarnedPoints(0);
        saveStoredProfile(DEFAULT_USER_PROFILE);
        setProfile(DEFAULT_USER_PROFILE);
      }

      if (next) {
        if (previousUserId && previousUserId !== next.userId) {
          clearPointEntries();
          setUserPoints(0);
          setEarnedPoints(0);
        }

        let chosenName = next.name;
        if (typeof sessionStorage !== 'undefined') {
          try {
            const pendingName = sessionStorage.getItem('utaktiv_pending_display_name');
            if (pendingName) {
              chosenName = pendingName;
              sessionStorage.removeItem('utaktiv_pending_display_name');
            }
            const oauthProvider = sessionStorage.getItem('utaktiv_oauth_in_progress');
            if (oauthProvider) {
              sessionStorage.removeItem('utaktiv_oauth_in_progress');
              const providerLabel =
                oauthProvider === 'google'
                  ? 'Google'
                  : oauthProvider === 'facebook'
                  ? 'Facebook'
                  : oauthProvider === 'apple'
                  ? 'Apple'
                  : oauthProvider;
              setPaymentNote(`Velkommen${chosenName ? ', ' + chosenName : ''}! Du er nå logget inn med ${providerLabel}.`);
            }
          } catch {
            // ignore
          }
        }

        const currentProfile = getStoredProfile();
        let shouldUpdateProfile = false;
        const updated = { ...currentProfile };

        if (chosenName && (!currentProfile.name || currentProfile.name === 'Gjest' || chosenName !== currentProfile.name)) {
          updated.name = chosenName;
          shouldUpdateProfile = true;
        }

        if (currentProfile.id !== next.userId) {
          updated.id = next.userId;
          shouldUpdateProfile = true;
        }

        if (next.avatarUrl && (!currentProfile.avatarUrl || currentProfile.avatarUrl !== next.avatarUrl)) {
          updated.avatarUrl = next.avatarUrl;
          shouldUpdateProfile = true;
        }

        if (shouldUpdateProfile) {
          saveStoredProfile(updated);
          setProfile(updated);
        }

        void hydrate(next.userId, next.avatarUrl);
      }
    };

    void readSession().then(current => {
      accept(current);
    });
    const stop = watchSession(next => {
      accept(next);
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const lat = profile.coordinates.lat;
    const lng = profile.coordinates.lng;
    setLiveSolar(null);

    (async () => {
      try {
        const met = await fetchMetForecast(lat, lng);
        const outlook = await fetchMetOutlook(lat, lng);
        if (cancelled) return;
        setMetForecast(met);
        setMetOutlook(outlook);
        setLiveSolar(buildSolarStatusFromMet(new Date(), lat, lng, met));
        const samples = outlook.map(point => ({
          time: point.time,
          cloudCoverPercent: point.cloudCoverPercent,
          altitudeDegrees: calculateSolarAltitude(new Date(point.time), lat, lng).altitude,
        }));
        const solWindow = findSolWindow(samples, 20000);
        setSolAlarmText(solWindow ? formatSolAlarm(profile.city || selectedCity, solWindow) : null);
      } catch {
        if (!cancelled) {
          setLiveSolar(null);
          setSolAlarmText(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile.coordinates.lat, profile.coordinates.lng, profile.city, selectedCity]);

  const handleSolAlarm = async () => {
    if (!solAlarmText) return;
    const permission = await enableSolAlarmNotifications();
    if (permission !== 'granted') {
      setAlarmNote('Varsling er ikke tillatt i nettleseren.');
      return;
    }
    if (typeof Notification === 'undefined') {
      setAlarmNote(solAlarmText);
      return;
    }
    new Notification('Sol-alarm', { body: solAlarmText });
    setAlarmNote('Varsel sendt på denne enheten.');
  };

  // Sanntids solstatus. MET når kallet lykkes, ellers estimert skydekke.
  const solarStatus = useMemo(() => {
    if (liveSolar) return liveSolar;
    return {
      ...getSolarStatus(new Date(), profile.coordinates.lat, profile.coordinates.lng, 35),
      weatherSource: 'fallback' as const,
    };
  }, [liveSolar, profile.coordinates]);

  // Rangere aktiviteter for profilen (bruker GPS-kontekst og partnertilbud når GPS er aktiv)
  const placesMap = useMemo(() => {
    const map: Record<string, Place> = {};
    for (const p of (placesData.places as unknown as Place[])) {
      map[p.id] = p;
    }
    return map;
  }, []);

  const rankedActivities = useMemo(() => {
    const cityObj = SUPPORTED_CITIES.find(c => c.name.toLowerCase() === selectedCity.toLowerCase());
    const weatherData = {
      precipitationMm: metForecast?.precipitationMm ?? 0,
      temperatureC: metForecast?.temperatureC ?? solarStatus.temperatureC,
      windMps: metForecast?.windMps ?? 3,
      cloudCoverPercent: metForecast?.cloudCoverPercent ?? solarStatus.cloudCoverPercent,
      isOpplett: (metForecast?.precipitationMm ?? 0) <= 0.1,
      isRain: (metForecast?.precipitationMm ?? 0) > 0.2,
    };

    return rankActivitiesForProfile(profile, activities, solarStatus, {
      position: gpsPosition || undefined,
      city: cityObj ? { id: cityObj.id, name: cityObj.name, lat: cityObj.lat, lng: cityObj.lng } : undefined,
      now: new Date(),
      deals: placesData.deals as unknown as Deal[],
      placesMap,
      allowDayTrip: true,
      weather: weatherData,
    });
  }, [profile, activities, solarStatus, gpsPosition, selectedCity, placesMap, metForecast]);

  // Total opptjent luks fra fullførte sjekk-inn
  const totalEarnedLux = useMemo(() => {
    return completedCheckins.reduce((acc, c) => acc + (c.luxEarned || 0), 0);
  }, [completedCheckins]);

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setGpsPosition(null);
    saveSelectedCityToStorage(cityName);
    const cityCfg = SUPPORTED_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (cityCfg) {
      const updatedProfile: UserProfile = {
        ...profile,
        city: cityCfg.name,
        coordinates: {
          lat: cityCfg.lat,
          lng: cityCfg.lng,
        },
      };
      setProfile(updatedProfile);
      saveStoredProfile(updatedProfile);
      void pushProfile(updatedProfile);
    }
  };

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Nettleseren din støtter ikke posisjonsdeling. Velg by under.');
      return;
    }
    setIsRequestingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsRequestingGps(false);
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsPosition(coords);
        const nearest = nearestCity(
          coords,
          SUPPORTED_CITIES.map(c => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng }))
        );
        setSelectedCity(nearest.name);
        saveSelectedCityToStorage(nearest.name);
        setIsLocationPromptOpen(false);
      },
      _err => {
        setIsRequestingGps(false);
        setGpsError('Kunne ikke hente posisjon. Velg din by i listen under.');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleTicketPurchased = (_actId: string, _qty: number) => {
    // Ticket purchased callback
  };

  const openFriends = (tab: 'feed' | 'folge' = 'feed') => {
    setFriendsTab(tab);
    if (tab !== 'folge') setCompanionPreset(null);
    setIsFriendsModalOpen(true);
  };

  const handleCheckinSuccess = (newCheckin: CompletedCheckin) => {
    setCompletedCheckins(prev => [newCheckin, ...prev.filter(c => c.activityId !== newCheckin.activityId)]);
    void grantEarned({
      points: 20,
      reason: 'checkin',
      idempotencyKey: `checkin-${newCheckin.activityId}`,
    }).then(() => refreshBalances());
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC] dark:bg-[#141311] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Animert Splash Screen ved oppstart */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Topp-header: Ren, minimalistisk og luksuriøs */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141311]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shrink-0 border border-orange-500/30 bg-black flex items-center justify-center">
            <img
              src="/utaktiv-logo.png"
              alt="Utaktiv Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                Utaktiv
              </h1>
              <div className="relative hidden md:flex items-center gap-2">
                <select
                  value={selectedCity}
                  onChange={e => handleCityChange(e.target.value)}
                  className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 text-zinc-900 dark:text-white text-xs font-bold rounded-xl px-2.5 py-1 cursor-pointer focus:outline-none transition shadow-sm"
                  title="Velg din by for lokale turer, dagslys og fjellstier"
                >
                  {SUPPORTED_CITIES.map(c => (
                    <option key={c.id} value={c.name}>
                      📍 {c.name}
                    </option>
                  ))}
                </select>
                <LocationStatus
                  city={selectedCity}
                  usingGps={Boolean(gpsPosition)}
                  onOpenPrompt={() => setIsLocationPromptOpen(true)}
                />
              </div>
            </div>
            <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {t('brandTagline', lang)}
            </p>
          </div>
        </div>

        {/* Høyre side: Språkbryter, Tema-veksler, Sol-Lommebok, Venner & Profil */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Språkbryter (🇳🇴 NO / 🇬🇧 EN) */}
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 transition shadow-sm text-xs font-bold cursor-pointer"
            title={lang === 'no' ? 'Switch to English (Plan your Norway trip)' : 'Bytt til Norsk'}
          >
            <span className="text-sm">{lang === 'no' ? '🇳🇴' : '🇬🇧'}</span>
            <span className="text-[11px] font-black tracking-wider uppercase">
              {lang === 'no' ? 'NO' : 'EN'}
            </span>
          </button>

          <button
            onClick={() => openFriends('feed')}
            className="hidden md:flex items-center gap-1.5 min-h-11 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-bold shadow-sm shadow-blue-500/20"
            title="Venner, forespørsler og sosial feed"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Venner</span>
            {socialState.incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                {socialState.incomingRequests.length}
              </span>
            )}
          </button>

          {/* Tema-veksler (☀️ Lys / 🌙 Mørk) */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="hidden md:inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40 transition shadow-sm"
            title={theme === 'dark' ? 'Bytt til hvit bakgrunn (lys versjon)' : 'Bytt til mørk fjellgrafitt (mørk versjon)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Sol-Lommebok & Valuta Saldo-chip */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 min-h-11 px-3 rounded-full bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 hover:border-orange-500 transition shadow-sm group"
            title="Kjøpte poeng brukes på billetter etter en bekreftet Stripe-betaling. Opptjente poeng er ikke kroner og kan ikke sendes."
          >
            <Wallet className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">{userPoints.toLocaleString('no-NO')} p</span>
            <span className="hidden sm:inline text-[11px] text-orange-600 dark:text-orange-300 font-medium">
              ({userPoints.toLocaleString('no-NO')} kr)
            </span>
            <span className="hidden lg:inline text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
              {earnedPoints.toLocaleString('no-NO')} opptjent
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAccountOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 min-h-11 px-3 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
          >
            <UserRound className="w-3.5 h-3.5" />
            {session ? 'Konto' : 'Logg inn'}
          </button>

          {/* Profil-avatar-chip */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 min-h-11 px-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 transition text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer"
            title="Rediger profil og navn"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-zinc-950 font-black text-[10px]">
              {session?.avatarUrl || profile.avatarUrl ? (
                <img
                  src={session?.avatarUrl || profile.avatarUrl}
                  alt={profile.name || 'Profil'}
                  className="w-full h-full object-cover"
                />
              ) : profile.name === 'Gjest' || !profile.name ? (
                <UserRound className="w-3 h-3 text-zinc-950" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>
            <span className="hidden sm:inline font-semibold">
              {profile.name === 'Gjest' || !profile.name ? 'Min profil' : profile.name}
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-400 hidden sm:block" />
          </button>
        </div>
        </div>
        <label className="md:hidden block mt-2">
          <span className="sr-only">By</span>
          <select
            value={selectedCity}
            onChange={e => handleCityChange(e.target.value)}
            className="w-full min-h-11 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-base font-semibold rounded-xl px-3 cursor-pointer focus:outline-none"
          >
            {SUPPORTED_CITIES.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Hovedinnhold */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 space-y-6">
        {/* Lys, forbrukervennlig Hero som forklarer konseptet og alltid viser valgt bys beste dagstur */}
        <HeroBanner
          city={selectedCity}
          solar={solarStatus}
          solAlarmText={solAlarmText}
          onTriggerSolAlarm={handleSolAlarm}
          featuredActivity={
            rankedActivities.find(
              r => r.activity.city.toLowerCase() === selectedCity.toLowerCase() && r.activity.addOns?.length
            )?.activity ||
            rankedActivities.find(
              r => r.activity.city.toLowerCase() === selectedCity.toLowerCase()
            )?.activity ||
            rankedActivities[0]?.activity
          }
          onSelectActivity={act => {
            setActiveTab('feed');
            if (act.addOns && act.addOns.length > 0) {
              setTicketActivity(act);
              setTicketAddOns(act.addOns);
            }
          }}
          onAddToTur={act => {
            addStop(act);
            setIsTurBuilderOpen(true);
          }}
          onOpenGift={() => setIsGiftModalOpen(true)}
          onOpenChristmasGift={() => setIsChristmasModalOpen(true)}
          onOpenOnboarding={() => setIsProfileModalOpen(true)}
          onOpenStore={() => setIsStoreModalOpen(true)}
          onToggleRadar={() => setShowRadarDetails(prev => !prev)}
          showRadar={showRadarDetails}
          usingGps={Boolean(gpsPosition)}
          onOpenLocationPrompt={() => setIsLocationPromptOpen(true)}
          lang={lang}
        />

        {/* DET TAKTILE SOL-ASTROLABIET: Alltid synlig som Utaktivs sentrale levende instrument */}
        <SolarAstrolabe
          city={selectedCity}
          lat={profile.coordinates.lat}
          lng={profile.coordinates.lng}
          currentSolar={solarStatus}
          lang={lang}
        />

        {/* DEN STORE NORSKE SKATTEJAKTEN — LEVENDE LOKALMYSTERIUM */}
        <div className="relative rounded-3xl p-5 sm:p-6 bg-[#181614] border border-amber-500/40 shadow-xl shadow-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-100 p-0.5 shadow-lg shadow-amber-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#141311] rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-amber-300 animate-spin" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  {lang === 'en' ? 'The Great Norwegian Treasure Hunt' : 'Den Store Norske Skattejakten'}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {lang === 'en' ? `1 code-locked chest in ${selectedCity}` : `1 kodelåst kiste gjemt i ${selectedCity}`}
                </span>
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  🌲 {lang === 'en' ? 'Family Adventure (Ages 4–8)' : 'Familieeventyr for 4–8 år'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-serif-display mt-0.5">
                {lang === 'en' ? "This Month's Living Mystery & Family Adventure" : 'Månedens Levende Lokalmysterium & Familieeventyr'}
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                {lang === 'en'
                  ? 'Walk the trail, solve 3 physical riddles in nature, and crack the lock on the chest!'
                  : 'Gå ruten, la Lys-speideren finne hemmeligheten, løs gåtene i terrenget og lås opp kisten i skogen!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {/* Én fokusert og ren handlingsknapp for Skattejakten */}
            <button
              type="button"
              onClick={() => setIsSkattekisteOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-[#E8622C] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-2 border border-amber-300/40 active:scale-95"
            >
              <span>{lang === 'en' ? 'Open Treasure Chest' : 'Åpne Skattekisten'}</span>
              <span className="text-base">🔓</span>
            </button>
          </div>
        </div>

        {/* Reis gjennom Norge: Visuell oppdagelsesreise med autentiske bilder */}
        <ExploreNorwayCarousel
          selectedCity={selectedCity}
          onSelectCity={handleCityChange}
          lang={lang}
        />

        {/* Synlig Værmelding & Opplett-radar (Time-for-time opplett & dagslysvarsel) */}
        <WeatherStrip
          city={selectedCity}
          solar={solarStatus}
          forecast={metForecast}
          outlook={metOutlook}
          lat={profile.coordinates.lat}
          lng={profile.coordinates.lng}
          onPlanInWindow={startHour => {
            const bestAct =
              rankedActivities.find(
                r => r.activity.city.toLowerCase() === selectedCity.toLowerCase()
              )?.activity || rankedActivities[0]?.activity;

            if (bestAct) {
              if (kurv.stops.length === 0) {
                addStop(bestAct, '2x Skillingsbolle & kaffe');
                updateStop(bestAct.id, { scheduledTime: startHour });
              } else {
                updateStop(kurv.stops[0].activityId, { scheduledTime: startHour });
              }
            }
            setIsTurBuilderOpen(true);
          }}
        />

        {alarmNote && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{alarmNote}</p>
        )}
        {paymentNote && (
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{paymentNote}</p>
        )}

        {/* Utfoldbar detaljert Solradar & Dagslysmåler */}
        {showRadarDetails && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <SunRadar solar={solarStatus} city={selectedCity} />
            <DaylightSensorWidget
              solar={solarStatus}
              onOpenStore={() => setIsStoreModalOpen(true)}
              onOpenJunior={() => setIsJuniorModalOpen(true)}
              onOpenWallet={() => setIsWalletModalOpen(true)}
              userPoints={userPoints}
              onPointsUpdated={() => refreshBalances()}
            />
          </div>
        )}

        {/* Ryddig handling-hub (4 stilrene kort som erstatter rotete piller) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setIsSavingsModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-md transition text-left group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Plane className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t('tripSavings', lang)}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{t('tripSavingsSub', lang)}</div>
            </div>
          </button>

          <button
            onClick={() => {
              setPlannerInitialActivity(null);
              setPlannerInitialTab('events');
              setIsPlannerModalOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 hover:shadow-md transition text-left group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Cake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t('familyPlanner', lang)}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{t('familyPlannerSub', lang)}</div>
            </div>
          </button>

          <button
            onClick={() => setIsJuniorModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-md transition text-left group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t('sunJunior', lang)}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{t('sunJuniorSub', lang)}</div>
            </div>
          </button>

          <button
            onClick={() => setIsStoreModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 hover:shadow-md transition text-left group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t('sunMarket', lang)}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{t('sunMarketSub', lang)}</div>
            </div>
          </button>

          <button
            onClick={() => setIsTinydomeModalOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 dark:bg-zinc-900 border border-amber-500/40 hover:border-amber-400 hover:shadow-md transition text-left group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition text-lg">
              🛸
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                <span>Tinydome Samfunn</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400/20 text-amber-500 dark:text-amber-300">Juli</span>
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">1/12 Space Capsule • Sommerfinale</div>
            </div>
          </button>
        </div>

        {/* Hovedfanevelger: Ren og fokusert */}
        <div id="utaktiv-feed-anchor" className="hidden md:flex border-b border-zinc-200 dark:border-zinc-800 gap-6 overflow-x-auto scrollbar-none transition-colors">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-3 text-sm font-semibold transition shrink-0 flex items-center gap-2 border-b-2 ${
              activeTab === 'feed'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Opplevelser & Billetter
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300">
              {rankedActivities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 text-sm font-semibold transition shrink-0 flex items-center gap-2 border-b-2 ${
              activeTab === 'map'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Kart & GPS
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-3 text-sm font-semibold transition shrink-0 flex items-center gap-2 border-b-2 ${
              activeTab === 'badges'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Mine Turer & Merker
            {completedCheckins.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {completedCheckins.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-semibold transition shrink-0 flex items-center gap-2 border-b-2 ${
              activeTab === 'chat'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Sol Concierge AI
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('circadian')}
            className={`pb-3 text-sm font-semibold transition shrink-0 flex items-center gap-2 border-b-2 ${
              activeTab === 'circadian'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            Døgnrytme & Biologi
          </button>
        </div>

        {/* Fane-visninger */}
        {activeTab === 'feed' && (
          <>
          <LiveWeatherCard
            city={selectedCity}
            solar={solarStatus}
            forecast={metForecast}
            onOpenChat={() => setActiveTab('chat')}
            onOpenRadar={() => setShowRadarDetails(true)}
          />
          <TipInnPanel
            city={selectedCity}
            prefillTrail={tipPrefillTrail}
            onPrefillConsumed={() => setTipPrefillTrail(null)}
          />
          <ActivityFeed
            recommendations={rankedActivities}
            profile={profile}
            selectedCity={selectedCity}
            completedCheckins={completedCheckins}
            friends={socialState.friends}
            lang={lang}
            cloudCoverPercent={solarStatus.cloudCoverPercent}
            cloudIsMeasured={solarStatus.weatherSource === 'met-norway'}
            onTipRouteBusiness={act => {
              setTipPrefillTrail(act.title);
              setTimeout(() => {
                document.getElementById('utaktiv-tip-inn-panel')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            onOpenTicket={(act, addOns) => {
              const extras = addOns || [];
              if (act.stopKind || (!act.ticket && extras.length === 0)) return;
              setTicketActivity(act);
              setTicketAddOns(extras);
            }}
            onOpenCheckin={act => setCheckinActivity(act)}
            onOpenMap={() => setActiveTab('map')}
            onOpenGiftActivity={act => {
              setGiftInitialActivity(act);
              setIsGiftModalOpen(true);
            }}
            onOpenPlanActivity={act => {
              setPlannerInitialActivity(act);
              setPlannerInitialTab('new_trip');
              setIsPlannerModalOpen(true);
            }}
            onFindCompany={(activity, kind) => {
              setCompanionPreset({ id: activity.id, title: activity.title, kind });
              openFriends('folge');
            }}
            onOpenFriends={() => openFriends('feed')}
            onAddToTur={act => {
              if (kurv.stops.some(s => s.activityId === act.id)) {
                setIsTurBuilderOpen(true);
              } else {
                addStop(act, turNoteForStop(act.id));
              }
            }}
            turActivityIds={kurv.stops.map(s => s.activityId)}
          />
          </>
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            activities={activities}
            profile={profile}
            completedCheckins={completedCheckins}
            focusTarget={mapFocus}
            onClearFocus={() => setMapFocus(null)}
            onOpenTicket={act => {
              setTicketActivity(act);
              setTicketAddOns([]);
            }}
            onOpenCheckin={act => setCheckinActivity(act)}
          />
        )}

        {activeTab === 'badges' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-none transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  Dine Fullførte Turer & Offisielle Sol-Badges
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Verifiserte innsjekker via GPS på fjelltopper, løp, klatreparker og konserter.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  +{Math.round(totalEarnedLux / 100).toLocaleString('no-NO')} Luks-poeng fra turer
                </span>
              </div>
            </div>

            {completedCheckins.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl space-y-2">
                <Compass className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Ingen turer stemplet ennå.</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs">
                  Gå til en aktivitet i listen (f.eks. Fløyen, 7-fjell eller Koengen) og trykk på «Sjekk inn (GPS)» for å registrere turen!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedCheckins.map(chk => (
                  <div
                    key={chk.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 shadow-sm dark:shadow-none dark:glow-orange transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{chk.badgeName}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {new Date(chk.completedAt).toLocaleDateString('no-NO')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-900 dark:text-white font-medium">{chk.activityTitle}</p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-900">
                      <span>GPS-verifisert</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                        +{Math.round(chk.luxEarned / 100).toLocaleString('no-NO')} Luks-poeng
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <ConciergeChat
            profile={profile}
            solar={solarStatus}
            activities={activities}
            forecast={metForecast}
            onNavigateToMap={target => {
              setMapFocus(target || null);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'circadian' && (
          <div className="space-y-6">
            <SunRadar solar={solarStatus} city={selectedCity} />
            <DaylightSensorWidget
              solar={solarStatus}
              onOpenStore={() => setIsStoreModalOpen(true)}
              onOpenJunior={() => setIsJuniorModalOpen(true)}
              onOpenWallet={() => setIsWalletModalOpen(true)}
              userPoints={userPoints}
              onPointsUpdated={() => refreshBalances()}
            />
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none transition-colors">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                Sirkadisk Dagslyskvote & Familieeffekt
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Dagslys kalibrerer kroppens biologiske masterklokke (SCN) i hjernen. Når barna og du får over 10 000 luks på formiddagen eller tidlig ettermiddag:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl transition-colors">
                  <div className="text-orange-600 dark:text-orange-400 font-bold text-sm mb-1">Raskere innsovning</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Melatoninnivået stiger 1,5 time tidligere på kvelden, noe som gjør leggetid for barna harmonisk og friksjonsfri.
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl transition-colors">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">Dopamin & Humør</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Dagslyseksponering stimulerer netthinnens ipRGC-celler og øker dopaminfrigjøring for energi og fokus.
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl transition-colors">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-1">Naturlig D-vitamin</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Selv ved lett overskyet himmel oppnår dere dagslysdoser som er 10–20 ganger sterkere enn innelys.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fast Innstillinger-knapp (⚙️) nede i venstre hjørne ifølge Alexanders regel */}
      <div className="fixed bottom-4 left-4 z-40 hidden md:block">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-3 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-xl transition backdrop-blur-md group"
          title="Innstillinger & API-nøkler"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>

      <MobileNav
        activeTab={activeTab}
        onChange={setActiveTab}
        friendRequests={socialState.incomingRequests.length}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onOpenFriends={() => openFriends('feed')}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Modaler */}
      <OnboardingModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={updated => {
          saveStoredProfile(updated);
          setProfile(updated);
          void pushProfile(updated);
        }}
      />

      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        profile={profile}
        socialState={socialState}
        onUpdateSocialState={newState => {
          saveStoredSocialState(newState);
          setSocialState(newState);
          void pushSocialState(newState);
        }}
        initialTab={friendsTab}
        viewerId={session?.userId ?? 'local'}
        companionPreset={companionPreset}
        remoteAccount={Boolean(session)}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        session={session}
        onSessionCleared={() => {
          clearPointEntries();
          setSession(null);
          refreshBalances();
        }}
        onProfileNameUpdated={newName => {
          setProfile(prev => {
            const next = { ...prev, name: newName };
            saveStoredProfile(next);
            return next;
          });
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
        lang={lang}
        onLanguageChange={l => {
          setLang(l);
          saveStoredLanguage(l);
        }}
      />

      <TicketModal
        isOpen={ticketActivity !== null}
        onClose={() => {
          setTicketActivity(null);
          setTicketAddOns([]);
        }}
        activity={ticketActivity}
        selectedAddOns={ticketAddOns}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
        onTicketPurchased={handleTicketPurchased}
      />

      <GpsCheckinModal
        isOpen={checkinActivity !== null}
        onClose={() => setCheckinActivity(null)}
        activity={checkinActivity}
        onCheckinSuccess={handleCheckinSuccess}
      />

      <SolStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
        onSelectActivityTicket={actId => {
          const found = activities.find(a => a.id === actId);
          if (found) setTicketActivity(found);
        }}
      />

      <JuniorChoresModal
        isOpen={isJuniorModalOpen}
        onClose={() => setIsJuniorModalOpen(false)}
        solar={solarStatus}
        onPointsUpdated={() => refreshBalances()}
      />

      <CommunityWallModal
        isOpen={isCommunityWallOpen}
        onClose={() => setIsCommunityWallOpen(false)}
        profile={profile}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
        onOpenStore={() => setIsStoreModalOpen(true)}
      />

      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => {
          setIsGiftModalOpen(false);
          setGiftInitialActivity(null);
        }}
        activities={activities}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
        initialActivity={giftInitialActivity}
        onOpenChristmasGift={() => setIsChristmasModalOpen(true)}
      />

      <ChristmasGiftModal
        isOpen={isChristmasModalOpen}
        onClose={() => setIsChristmasModalOpen(false)}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
      />

      <PlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => {
          setIsPlannerModalOpen(false);
          setPlannerInitialActivity(null);
          setPlannerInitialTab('events');
        }}
        activities={activities}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
        onOpenGifts={() => {
          setIsPlannerModalOpen(false);
          setIsGiftModalOpen(true);
        }}
        initialTab={plannerInitialTab}
        initialActivity={plannerInitialActivity}
        defaultCity={selectedCity}
      />

      <SavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        userPoints={userPoints}
        onPointsUpdated={() => refreshBalances()}
      />

      <IosInstallPrompt />

      <TurKurvPill
        count={turCount}
        onOpen={() => setIsTurBuilderOpen(true)}
      />

      <TurBuilderModal
        isOpen={isTurBuilderOpen}
        onClose={() => setIsTurBuilderOpen(false)}
        kurv={kurv}
        onUpdateStop={updateStop}
        onRemoveStop={removeStop}
        onMoveStop={moveStop}
        onAddStop={act => addStop(act, turNoteForStop(act.id))}
        availableActivities={activities.filter(
          a =>
            a.city.toLowerCase() === selectedCity.toLowerCase() ||
            a.city.toLowerCase() === kurv.city.toLowerCase()
        )}
        onClearKurv={clearKurv}
        onOpenStore={() => setIsStoreModalOpen(true)}
      />

      <LocationPrompt
        isOpen={isLocationPromptOpen}
        selectedCity={selectedCity}
        cities={SUPPORTED_CITIES.map(c => ({ id: c.id, name: c.name }))}
        onUseGps={handleRequestGps}
        onSelectCityManual={cityName => {
          handleCityChange(cityName);
          setIsLocationPromptOpen(false);
        }}
        onDismiss={() => setIsLocationPromptOpen(false)}
        isRequestingGps={isRequestingGps}
        gpsError={gpsError}
      />
      <SkattekisteModal
        isOpen={isSkattekisteOpen}
        onClose={() => setIsSkattekisteOpen(false)}
        city={selectedCity}
        lang={lang}
        onAwardPoints={pts => {
          const today = new Date().toISOString().split('T')[0];
          void grantEarned({
            points: pts,
            reason: 'checkin',
            idempotencyKey: `skattekiste-${selectedCity}-${today}`,
          }).then(() => refreshBalances());
        }}
        onOpenTurBuilderWithTrail={trailTitle => {
          const matchingAct = activities.find(
            a =>
              a.title.toLowerCase().includes(trailTitle.toLowerCase()) ||
              a.city.toLowerCase() === selectedCity.toLowerCase()
          );
          if (matchingAct) {
            addStop(matchingAct, 'Skattejakt & kodelås');
          }
          setIsTurBuilderOpen(true);
        }}
        onOpenFamilieEventyr={() => {
          setIsSkattekisteOpen(false);
          setIsFamilieEventyrOpen(true);
        }}
        onOpenAR={() => {
          setIsSkattekisteOpen(false);
          setIsSolCameraOpen(true);
        }}
      />
      <SolCameraAR
        isOpen={isSolCameraOpen}
        onClose={() => setIsSolCameraOpen(false)}
        userLat={gpsPosition?.lat}
        userLng={gpsPosition?.lng}
        onPointsUpdated={() => {
          void refreshBalances();
        }}
      />
      <FamilieEventyrModal
        isOpen={isFamilieEventyrOpen}
        onClose={() => setIsFamilieEventyrOpen(false)}
        lang={lang}
        onAwardPoints={pts => {
          const today = new Date().toISOString().split('T')[0];
          void grantEarned({
            points: pts,
            reason: 'checkin',
            idempotencyKey: `familie-soljakten-${today}`,
          }).then(() => refreshBalances());
        }}
      />
      <NatureQuestModal
        isOpen={isNatureQuestOpen}
        onClose={() => setIsNatureQuestOpen(false)}
        onAddCoinsToWallet={pts => {
          const today = new Date().toISOString().split('T')[0];
          void grantEarned({
            points: pts,
            reason: 'checkin',
            idempotencyKey: `naturequest-${today}`,
          }).then(() => refreshBalances());
        }}
      />
      <TinydomeModal
        isOpen={isTinydomeModalOpen}
        onClose={() => setIsTinydomeModalOpen(false)}
      />
    </div>
  );
};

export default App;
