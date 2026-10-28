"""
Utaktiv Partner Outreach Engine - E-postmaler & Personalisering
Genererer autentiske, tillitsvekkende e-poster tilpasset hver kategori og bedrift.
"""

from typing import Tuple
from .models import PartnerLead, PartnerCategory


def _get_salutation(lead: PartnerLead) -> str:
    name = (lead.contact_name or "").strip()
    if not name or name in ("Daglig leder", "Booking / Daglig leder", "Nyhetsredaksjonen", "Nyhetsdesken", "Redaksjonen"):
        return "dere"
    if "Kokken Arthur" in name:
        return "Arthur"
    if "&" in name or " og " in name:
        return name.split("(")[0].strip()
    clean = name.split("(")[0].strip()
    return clean.split()[0]


def generate_outreach_email(lead: PartnerLead) -> Tuple[str, str]:
    """
    Returnerer (emne, brødtekst) tilpasset bedriftens profil og rute.
    """
    first_name = _get_salutation(lead)
    offer = lead.custom_offer or "et stopp på ruten"
    
    # 1. BADSTUER & SJØBAD
    if lead.category == PartnerCategory.SAUNA:
        subject = f"Samarbeid med Utaktiv.no: Flere turgåere inn til {lead.business_name}?"
        body = f"""Hei {first_name},

Jeg kontakter deg fra Utaktiv (utaktiv.no) — vi er en norsk dagslys- og aktivitetsapp som guider turgåere og familier ut i naturen og til de beste opplevelsene i nærområdet.

Når brukerne våre går tur i området ({lead.associated_trail}), beregner appen automatisk solforholdene og foreslår et helhetlig opplegg. For mange er det ingenting som slår et oppvarmende badstuebesøk og et forfriskende sjøbad etter turen.

Vi har veldig lyst til å løfte frem {lead.business_name} som det anbefalte restitusjonsstoppet i appen:
• Turgåerne kan se åpningstider og reservere/innløse opplevelsen direkte via appen.
• Brukerne samler Luks-poeng på turer (1 poeng = 1 krone) og kan bruke disse som delbetaling hos dere — dere får fullt oppgjør.
• Det koster ingenting å være oppført, og det er ingen faste avgifter eller bindingstid.

Vi har samlet en kort oppsummering her:
https://utaktiv.no/b2b-onepager.html

Passer det med 3–4 minutters prat på telefonen i løpet av uken, eller kan jeg stikke innom for en kjapp kaffe?

Vennlig hilsen,
Alexander Robertsen
Grunnlegger, Utaktiv.no
Tlf: 411 19 608
E-post: post@utaktiv.no
"""
        return subject, body

    # 2. KAFEER, FJELLSTUER & BAKERIER
    if lead.category == PartnerCategory.CAFE:
        subject = f"Samarbeid med Utaktiv.no: Anbefalt kaffestopp for turgåere hos {lead.business_name}?"
        body = f"""Hei {first_name},

Jeg skriver til deg fra Utaktiv (utaktiv.no). Vi er en dagslys- og tur-app som hjelper barnefamilier, mosjonister og turgåere med å finne solfylte stier og gode opplevelser ute.

Langs ruten ved {lead.associated_trail} ({lead.location}) passerer det ukentlig hundrevis av glade turgåere. Mange av dem planlegger turen sin i Utaktiv og ser etter et koselig stopp for kaffe, nystekte vafler eller lunsj.

Vi vil gjerne profilere {lead.business_name} som det offisielle anbefalte stoppet langs ruten:
• Turgåere kan forhåndsvelge f.eks. «{offer}» rett i appen.
• Barna kan bruke opptjente Luks-poeng (fra oppgaver i nabolaget) som betaling på disken.
• Ingen faste kostnader eller etableringsgebyr — kun en ren formidlingsmodell for faktiske gjester vi sender inn døren.

Du kan se en enkel onepager om konseptet her:
https://utaktiv.no/b2b-onepager.html

Har du tid til en kjapp prat på 3 minutter over telefonen denne uken, eller passer det at jeg tar turen innom?

Beste hilsen,
Alexander Robertsen
Utaktiv.no
Tlf: 411 19 608
E-post: post@utaktiv.no
"""
        return subject, body

    # 3. KLATREPARKER & FAMILIEAKTIVITETER
    if lead.category == PartnerCategory.CLIMBING_PARK:
        subject = f"Samarbeid med Utaktiv.no: Familieaktiviteter og Luks-poeng hos {lead.business_name}"
        body = f"""Hei {first_name},

Jeg kontakter deg fra Utaktiv (utaktiv.no) — en norsk plattform bygget for å få barnefamilier bort fra passiv skjermtid og ut i aktivitet i dagslys.

Gjennom appen motiverer vi barn til å gjøre nyttige oppgaver i nabolaget (klippe gress, måke snø, hjelpe besteforeldre) for å samle «Luks-poeng» (1 poeng = 1 kr). Disse poengene kan utelukkende brukes på felles opplevelser og friluftsliv — aldri spill eller plastleker.

Vi ønsker veldig gjerne å inkludere {lead.business_name} som en av våre fremste opplevelsespartnere:
• Familiene kan spare opp og delbetale/fullbetale inngangsbilletter og klatredager med Luks-poeng via Vipps.
• Dere får dedikert synlighet for tusenvis av aktive barnefamilier i regionen.
• Ingen faste kostnader, lisenser eller binding.

En kort oppsummering for bedrifter finnes her:
https://utaktiv.no/b2b-onepager.html

Hadde det passet med en kort telefonprat på 5 minutter en av de nærmeste dagene for å se om dette er spennende for dere?

Vennlig hilsen,
Alexander Robertsen
Utaktiv.no
Tlf: 411 19 608
E-post: post@utaktiv.no
"""
        return subject, body

    # 4. AVISER & PRESSE (BA & BT) - SKATTEJAKTEN & 5000 LUKS-POENG STORPREMIE
    if lead.category == PartnerCategory.PRESS:
        is_ba = "ba.no" in lead.email.lower() or "bergensavisen" in lead.business_name.lower()
        
        if is_ba:
            subject = "PRESSETIPS: Gjemmer massiv skattekiste i Byfjellene – gir bort 5 000 kr i opplevelsespremie for å hente barna ut av skjermgraven"
            body = """Hei redaksjonen i BA,

Jeg tipser dere om et helt nytt, lokalt folkehelse- og naturtiltak i Bergen: «Den Store Norske Skattejakten» via Utaktiv.no.

I en tid der ungdom og barnefamilier sliter med passiv skjermtid, tapt døgnrytme og mangel på naturlig dagslys, har vi snudd gaming-logikken på hodet: Vi har plassert en massiv, spesialsmidd skattekiste med kodelås et hemmelig sted i Byfjellene. 

For å finne kisten og knekke kodelåsen, må familiene ut i terrenget og løse tre analoge gåter knyttet til natur og dagslys – oppgaver som er fullstendig umulige å google eller løse fra sofaen.

Sveisemesteren som har laget kisten i massivt stål sa det best:
«Om noen klarer å bryte seg inn i denne, fortjener de nesten skatten. Her må hodet og rebusen brukes, ikke spett!»

STORPREMIEN (5 000 LUKS-POENG):
Vi venter ikke på eksterne sponsorer; Utaktiv stiller selv med en storpremie på 5 000 Luks-poeng (verdi 5 000 kr) til familien som løser mysteriet først. Poengene kan utelukkende brukes på sunne fellesopplevelser i regionen (klatrepark, fjordbadstue, DNT-hytter, kano og friluftsliv) – aldri på gaming eller plastleker. I tillegg inviterer vi lokale bedrifter til å legge ekstra gaver i potten underveis.

Dette er en erkebergensk glad-sak med sterke bilder, ekte spenning og et brennende pedagogisk alvor i bunn. Jeg stiller gjerne til intervju, og kan ta journalist og fotograf med opp til kistens nærområde for eksklusive bilder før jakten slippes løs for publikum.

Kan dette være en god sak for BA denne uken?

Beste hilsen,
Alexander Robertsen
Pedagog og grunnlegger av Utaktiv.no
Tlf: 411 19 608
Adresse: Øvre Korskirkeallmenningen 8, 5017 Bergen
E-post: post@utaktiv.no / tips@utaktiv.no
Nettsted: https://utaktiv.no
"""
        else:
            subject = "DEBATT / TIPS TIL BT: Skattekisten i Byfjellene – dagslyskampen mot skjermgraven (5 000 kr i familiepremie)"
            body = """Hei debatt- og nyhetsredaksjonen i Bergens Tidende,

Jeg henvender meg til dere med et dagsaktuelt innspill og nyhetstips om et nytt bergensk initiativ: «Den Store Norske Skattejakten» via Utaktiv.no.

Som pedagog med mastergrad og mangeårig erfaring med unges mestring og utenforskap, ser jeg daglig hvordan passiv skjermtid stjeler både dagslys, søvnkvalitet og felleskap. 

For å snu denne utviklingen har vi skapt et levende lokalmysterium: En solid, kodelåst skattekiste i stål er plassert i Byfjellene. Koden kan kun løses ved å oppsøke fysiske natur- og kulturposter i terrenget – oppgaver som ikke kan googles eller løses fra gutterommet.

Sveisemesteren bak kisten uttalte med et smil:
«Om noen klarer å bryte seg inn i denne, fortjener de nesten skatten. Her må hodet og rebusen brukes, ikke spett!»

STORPREMIE PÅ 5 000 KR I OPPLEVELSER:
Utaktiv garanterer selv for en startpremie på 5 000 Luks-poeng (verdi 5 000 kr) til finneren, øremerket sunne familieopplevelser (klatring, badstuer, DNT og friluftsliv). Vi inviterer også bergenske aktører til å legge ekstra premier i kisten underveis.

Jeg stiller gjerne en velskrevet kronikk til disposisjon for BT Debatt om hvordan håndfast mestring og dagslys kan konkurrere ut algoritmenes grep om barna, eller tar en prat med nyhetsdesken og tar dere med opp til kisten for et eksklusivt forhåndsintervju og fotomulighet.

Hører gjerne fra dere om dette passer for BT.

Med vennlig hilsen,
Alexander Robertsen
Forfatter, pedagog og grunnlegger av Utaktiv.no
Tlf: 411 19 608
Adresse: Øvre Korskirkeallmenningen 8, 5017 Bergen
E-post: post@utaktiv.no
Nettsted: https://utaktiv.no
"""
        return subject, body

    # 5. MEKANISKE VERKSTEDER, SVEIS & SMIER (SKATTEKISTEN I BYFJELLENE)
    if lead.category == PartnerCategory.WORKSHOP:
        subject = f"Oppdrag / Samarbeid: Sveise en innbruddssikker skattekiste i stål til Byfjellene? ({lead.business_name})"
        body = f"""Hei {first_name},

Jeg henvender meg til dere i {lead.business_name} med en litt uvanlig, men forhåpentligvis spennende henvendelse fra Bergen sentrum.

Mitt navn er Alexander Robertsen. Jeg har mastergrad i pedagogikk og står bak det bergenske friluftsinitiativet Utaktiv.no. Vår kampsak er enkel, men brennende aktuell: Å få barn, unge og barnefamilier bort fra stillesittende skjermer og ut i Byfjellene gjennom ekte nysgjerrighet, dagslys og fysisk mestring.

Som en del av «Den Store Norske Skattejakten» i Byfjellene skal vi utplassere en massiv, fysisk skattekiste i stål på et hemmelig sted i terrenget. Kisten skal romme sesongens hovedpremie (5 000 kr i sunne friluftsopplevelser) og hemmelige ledetråder.

For å låse den opp må familiene gå tur og løse tre analoge naturrebusoppgaver som gir en 6-sifret kode. Vårt krav til kistens konstruksjon kan oppsummeres slik:

«Om noen klarer å bryte seg inn i denne, fortjener de nesten skatten. Her må hodet og rebusen brukes, ikke spett!»

KORT OM HVA VI ØNSKER FABRIKKERT:
• Materiale: Solid, værbestandig stål (gjerne 4–6 mm cortenstål som tåler bergensregnet og glir vakkert inn i terrenget, eller kraftig lakkert stål).
• Dimensjoner: Ca. 45–50 cm bred, solid og tung (30–50 kg) slik at den ikke kan stikkes av med under armen, med øyer/fester for wire/fjellforankring.
• Låsesystem: En innbygget, tyverisikker stålhylse/beskyttelsesboks for en kraftig mekanisk 6-sifret kodelås (slik at barn enkelt kan taste koden, men der det er umulig å komme til med kubein eller spett).
• Hengsler og lokk: Kraftige innvendige hengsler og dryppkant så innholdet holdes tørt.

HVA VI KAN TILBY DERE:
1. Rent betalt oppdrag: Vi betaler selvsagt for materialer og arbeidstid etter avtalt tilbud. (Om dere ønsker å gjøre det som et lærlingeprosjekt eller delvis sponsorsamarbeid mot profilering, er vi også svært åpne for det).
2. Permanent hedersplass: Vi fester/sveiser et solid metallskilt på kisten: «Konstruert og sveiset for Byfjellene av {lead.business_name}».
3. Presseomtale i BA og BT: Kisten og de som har sveiset den blir en bærebjelke i presseinnsalget og reportasjene i Bergensavisen og Bergens Tidende.

Har dere mulighet til å ta en kort prat på 5 minutter over telefonen, eller passer det at jeg stikker innom verkstedet deres for å slå av en prat og se på en enkel skisse?

Beste hilsen,
Alexander Robertsen
Master i pedagogikk & grunnlegger av Utaktiv.no
Tlf: 411 19 608
Besøksadresse: Øvre Korskirkeallmenningen 8, 5017 Bergen
E-post: post@utaktiv.no
Nettsted: https://utaktiv.no
"""
        return subject, body

    # 6. STANDARD/ØVRIGE PARTNERE
    subject = f"Samarbeid med Utaktiv.no: Vil {lead.business_name} vises for våre turgåere?"
    body = f"""Hei {first_name},

Jeg kontakter deg fra Utaktiv (utaktiv.no) — en norsk tur- og opplevelsesapp som guider folk ut i naturen etter dagslys og værforhold.

Vi kartlegger nå de beste stoppene og aktivitetene langs våre ruter ({lead.associated_trail} i {lead.location}), og vi vil veldig gjerne løfte frem {lead.business_name} for våre brukere.

Vårt konsept:
• Gratis profilering og anbefaling på kartet for turgåere og familier.
• Mulighet for gjester til å bruke opptjente Luks-poeng som betalingsmiddel.
• 100 % uforpliktende uten faste avgifter.

Se mer på: https://utaktiv.no/b2b-onepager.html

Har du anledning til en kort prat på 3 minutter denne uken?

Beste hilsen,
Alexander Robertsen
Utaktiv.no
Tlf: 411 19 608
E-post: post@utaktiv.no
"""
    return subject, body
