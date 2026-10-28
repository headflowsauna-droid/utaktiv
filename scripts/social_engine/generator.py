"""
Utaktiv Social Media Engine - Content Generator
Genererer skreddersydde, plattformoptimerte innlegg (X, LinkedIn, TikTok)
basert på videokonsepter (som Google Flow-videoene for Skattejakt & Space Capsule).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from scripts.social_engine.models import SocialPost, Platform, PostStatus, ContentFormat


# Forhåndsdefinerte kjerne-vinklinger basert på Alexanders pedagogiske og visuelle prinsipper:
VIDEO_CAMPAIGNS = {
    "skattekiste-fjell": {
        "title": "Åpning av Skattekisten i Vestlandsfjellene (Google Flow R2V)",
        "video_concept": "Opening treasure chest on mountain — AR-nøkkel fanges i sekken, Utaktiv sol-logo åpenbares over fjord og fjell.",
        "tiktok": {
            "title": "Vi gjemte en ekte skattekiste på fjellet. Finner du den?",
            "content": (
                "Slutt å la barna gro fast foran skjermen på en søndag. Vi bygde Utaktiv "
                "for å gjøre norsk natur til et ekte dataspill med AR og dagslysradar. "
                "Finner du kisten i Byfjellene, scanner du QR-koden og låser opp reelle premier "
                "(kafé-spanderinger, badstue-billetter og Sol-poeng). "
                "Hvem tar du med deg på skattejakt denne helgen?"
            ),
            "hashtags": ["utaktiv", "skattejakt", "norsknatur", "fjelltur", "bergen", "vestlandet", "aktivfamilie", "arspill"],
            "call_to_action": "Last ned appen gratis og se dagslyskartet på utaktiv.no"
        },
        "x": {
            "title": "Hvordan vi bruker Google Flow & Omni 1.1 Flash til å markedsføre en norsk AR-turapp",
            "content": (
                "Vi har akkurat generert de første teaservideoene for Utaktiv i Google Flow (Omni 1.1 Flash + Veo 3.1 R2V).\n\n"
                "Premisset for appen er enkelt: Dørstokkmila for barnefamilier er brutal. "
                "Ved å koble sanntids dagslysdata fra @Meteorologisk sammen med en fysisk skattekiste "
                "og AR-drops i fjellheimen, gjør vi søndagsturen til en jakt på ekte skatter.\n\n"
                "Her er arkitekturen bak prosjektet:\n"
                "— Vite + React + PWA (ingen App Store-friksjon)\n"
                "— MET Norway Solhøyde- & luks-kalkulator\n"
                "— Vipps & Sol-lommebok (1 Sol-poeng = 1 krone hos lokale partnere)\n\n"
                "Hva synes dere om video-loopen?"
            ),
            "hashtags": ["buildinpublic", "indiehacker", "ai", "googleflow", "gamification", "edtech"],
            "call_to_action": "Prøv webappen på https://utaktiv.no"
        },
        "linkedin": {
            "title": "Kan spillteori og kunstig intelligens løse den norske folkehelsefloken?",
            "content": (
                "Norske barn og voksne bruker mer tid foran skjermen enn noen gang før. "
                "Dørstokkmila er ikke et problem med viljestyrke — det er et designproblem.\n\n"
                "I Utaktiv har vi valgt å ikke kjempe MOT spillmekanikken, men BRUKE den. "
                "Gjennom Utaktiv-appen har vi plassert fysiske og digitale skattekister i den norske naturen. "
                "Gjennom sanntids dagslysvarsling og AR-funksjoner motiverer vi familier til å oppsøke solen "
                "når den faktisk skinner, og løse oppdrag sammen.\n\n"
                "For lokalt næringsliv (fjordbadstuer, fjellstuer, klatreparker) er dette en helt ny "
                "distribusjonskanal: Turgåere tjener Sol-poeng på tur som kan innløses direkte over kakedisken "
                "eller i badstuen.\n\n"
                "Se denne korte konseptvideoen vi nylig genererte via Google Flow. "
                "Vi søker nå samarbeidspartnere langs Bergens byfjell og på Vestlandet som vil være med på skattejakten."
            ),
            "hashtags": ["folkehelse", "innovasjon", "bærekraft", "reiseliv", "gamification", "norsknæringsliv", "utaktiv"],
            "call_to_action": "Les mer om B2B-partnerskap på https://utaktiv.no/b2b-onepager.html"
        }
    },
    "space-capsule-2027": {
        "title": "Vinn helgetur i Space Capsule sommeren 2027 (Samarbeidskampanje)",
        "video_concept": "Space capsule glamping i vill norsk natur — fremtidsrettet kuppel med panoramautsikt mot stjernehimmelen og midnattssolen.",
        "tiktok": {
            "title": "Tenk å våkne opp her til sommeren 2027... Helt gratis.",
            "content": (
                "Dette er ikke sci-fi. Det er en Tiny Dome / Space Capsule plassert midt i Norges råeste natur. "
                "I hele år samler du Sol-poeng og nøkler i Utaktiv-appen. "
                "Til sommeren 2027 trekker vi én familie som vinner en hel uke i denne futuristiske katedralen under stjernehimmelen. "
                "Tag en du ville tatt med deg!"
            ),
            "hashtags": ["glamping", "spacecapsule", "tinydome", "norge", "vestlandet", "utaktiv", "giveaway", "bucketlist"],
            "call_to_action": "Begynn å samle solpoeng nå på https://utaktiv.no"
        },
        "x": {
            "title": "Hardware meets Software: Hvordan vi kobler Tiny Dome Retreats med Utaktivs sol-økonomi",
            "content": (
                "Etter suksessen med skattekiste-konseptet tar vi neste steg: "
                "Storpremien til sommeren 2027 blir et eksklusivt opphold i en høyteknologisk Space Capsule / Tiny Dome.\n\n"
                "Mekanikken:\n"
                "1. Gå turer og logg soltimer i Utaktiv\n"
                "2. Hver skattekiste åpnet gir ett lodd til stjernetrekningen\n"
                "3. Lokale partnere sponser opplevelsen, appen driver organisk trafikk.\n\n"
                "Det mest spennende med generative AI-verktøy som Google Flow er at vi kan visualisere "
                "og stressteste slike opplevelser med 8-sekunders 4K videoer på minutter."
            ),
            "hashtags": ["indiebiz", "growthhacking", "aiagents", "norwaytech", "buildinpublic"],
            "call_to_action": "Sjekk konseptet på https://utaktiv.no"
        },
        "linkedin": {
            "title": "Fremtidens naturbaserte reiseliv: Hvorfor fremtidens hytte er en Space Capsule",
            "content": (
                "Glamping og spektakulære mikro-destinasjoner eksploderer i popularitet. "
                "Moderne reisende søker unike, bærekraftige opplevelser med minimalt fotavtrykk på naturen.\n\n"
                "I Utaktiv knytter vi nå bånd mellom appen vår og banebrytende aktører som Tiny Dome. "
                "Gjennom å koble 'Den Store Norske Skattejakten' sammen med unike destinasjoner skaper vi en vinn-vinn: "
                "Turgåere får en episk gulrot, mens overnattings- og opplevelsestilbydere får verifiserte, "
                "betalingsvillige besøkende utenom høysesong.\n\n"
                "Her er forhåndsvisningen av konseptet vi ruller ut frem mot sommeren 2027. "
                "Ta kontakt hvis din destinasjon ønsker å stå som en destinasjon på skattekartet."
            ),
            "hashtags": ["reiseliv", "destinasjonsutvikling", "glamping", "turisme", "norsknatur", "folkehelse"],
            "call_to_action": "Kontakt Alexander Robertsen på post@utaktiv.no"
        }
    }
}


class ContentGenerator:
    """Genererer pakker av SoMe-poster klare for vurdering og godkjenning."""

    @staticmethod
    def generate_campaign_posts(campaign_key: str) -> List[SocialPost]:
        if campaign_key not in VIDEO_CAMPAIGNS:
            raise ValueError(f"Ukjent kampanjenøkkel: {campaign_key}. Valg: {list(VIDEO_CAMPAIGNS.keys())}")

        data = VIDEO_CAMPAIGNS[campaign_key]
        now_str = datetime.now().strftime("%Y%m%d_%H%M")
        posts: List[SocialPost] = []

        # TikTok post
        tt = data["tiktok"]
        posts.append(SocialPost(
            id=f"tiktok_{campaign_key}_{now_str}",
            platform=Platform.TIKTOK,
            title=tt["title"],
            content=tt["content"],
            format=ContentFormat.VIDEO_9_16,
            hashtags=tt["hashtags"],
            video_concept=data["video_concept"],
            call_to_action=tt["call_to_action"],
            status=PostStatus.DRAFTED,
            campaign_id=campaign_key
        ))

        # X post
        x = data["x"]
        posts.append(SocialPost(
            id=f"x_{campaign_key}_{now_str}",
            platform=Platform.X,
            title=x["title"],
            content=x["content"],
            format=ContentFormat.THREAD,
            hashtags=x["hashtags"],
            video_concept=data["video_concept"],
            call_to_action=x["call_to_action"],
            status=PostStatus.DRAFTED,
            campaign_id=campaign_key
        ))

        # LinkedIn post
        li = data["linkedin"]
        posts.append(SocialPost(
            id=f"linkedin_{campaign_key}_{now_str}",
            platform=Platform.LINKEDIN,
            title=li["title"],
            content=li["content"],
            format=ContentFormat.SINGLE_POST,
            hashtags=li["hashtags"],
            video_concept=data["video_concept"],
            call_to_action=li["call_to_action"],
            status=PostStatus.DRAFTED,
            campaign_id=campaign_key
        ))

        return posts
