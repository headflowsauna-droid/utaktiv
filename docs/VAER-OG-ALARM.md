# Vær og sol-alarm

## MET Norway

`fetchMetForecast(lat, lng)` kaller `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=&lon=` med User-Agent `Utaktiv/1.0 (https://utaktiv.no)`. Nærmeste timeserie gir `cloud_area_fraction`, `air_temperature`, `wind_speed` og nedbør fra `next_1_hours` når feltet finnes (ellers 0 mm, ikke et påfunnet varsel). Posisjon caches i minnet i 20 minutter, avrundet til 2 desimaler. Feil kaster `MetForecastError`. Ingen tall finnes på.

`buildSolarStatusFromMet` setter `weatherSource: 'met-norway'` og temperatur. `App.tsx` er ikke koblet til dette ennå og sender fortsatt et fast skydekke til `getSolarStatus`. Uten `weatherSource` viser radaren «Estimert skydekke (ingen MET-kontakt)».

Azimut regnes med NOAA-cos av deklinasjon, bredde og timevinkel, med klokken fra nord. Høydeformelen er uendret.

## Løypeføre

`fetchTrailConditions` bruker samme MET-kall på løypas koordinater. `grooming` er alltid `'unknown'`. Skisporet.no og UT.no kalles ikke, og HTML skrapes ikke. Feed-kort henter ikke nettverk. ActivityFeed er ikke endret: «Oppkjørt spor» er en statisk løypetype i katalogen, ikke live preparering.

## PWA og alarm

Manifest og service worker ligger i `public/`. Worker cacher bare `/` og manifestet, nettverk først, og cache-fallback kun for navigasjon. Den registreres bare når `import.meta.env.PROD` er sant.

`findSolWindow` og `formatSolAlarm` er rene. De kaller ikke Notification. `enableSolAlarmNotifications` ber om tillatelse til lokal varsling. `saveLocalPushSubscription` lagrer endepunkt og nøkler under `sol_uteliv_push_sub_v1`. Web Push sendes ikke herfra. Det krever VAPID og server.
