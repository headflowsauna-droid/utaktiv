# Sky og Stripe

Appen kjører uten Supabase. Da er kjøpt saldo 0, og opptjente poeng ligger bare på enheten. De er merket opptjent og er ikke kroner. Logg inn for å beholde saldoen på tvers av telefoner.

Synk starter når begge disse er satt:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` skal bare ligge på webhook-serveren, aldri i frontend.

## Database

Kjør begge migreringene i Supabase-prosjektet, i denne rekkefølgen:

1. `supabase/migrations/20261022120000_sol_uteliv_cloud.sql`
2. `supabase/migrations/20261023110254_ledger_and_companions.sql`

Alle offentlige tabeller har RLS. Policies bruker `authenticated` og `auth.uid()`.

`point_entries` kan leses av eieren. Klienten kan ikke sette inn, endre eller slette rader. Kjøpte poeng skrives bare av webhooken med service-role, grunn `stripe_topup`, og nøkkelen er session-id. Opptjente poeng skrives av `credit_earned`. Trekk av kjøpte poeng går gjennom `spend_purchased`. Opptjente poeng kan ikke betale en regning, veksles til kjøpte poeng, eller sendes til en annen person.

`wallet_ledger` er ikke lenger skrivbar for innloggede brukere. Den andre migreringen trekker tilbake insert, update og delete.

Turfølge ligger i `match_cards`, `companion_posts` og `companion_interests`. Kortet har by, grovt voksenbånd, grove barnebånd og stikkord. Barnas navn, nøyaktig alder og hjemmeadresse ligger bare i eierens profil. Navn i en følgeforespørsel kommer fra `companion_names` etter at begge har godtatt.

Øvrige tabeller: `profiles`, `social_state`, `saving_goals`, `stripe_credits`, `push_subscriptions`.

## Stripe

Checkout-sessionen skal ha `metadata.package_id` og `metadata.user_id`. Gyldige pakker er `topup-starter` (500 poeng), `topup-family` (1200), `topup-sponsor` (3000) og `topup-season` (6500).

Webhooken er `supabase/functions/stripe-webhook`. Den godtar bare `checkout.session.completed` med gyldig `Stripe-Signature`. Den skriver `stripe_credits` og `point_entries`. Samme session-id krediteres én gang. Hvis poengraden mangler etter et tidligere forsøk, prøver webhooken den igjen.

Returadressen `/?payment=success` er bare et kvitteringsbilde. Den krediterer ikke lommeboken.

## Konto

E-post og passord går gjennom Supabase Auth. Én innlogget bruker eier profil, venner, følge og saldo. Ved utlogging tømmes poengspeilet på enheten.
