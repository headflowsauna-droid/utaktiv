const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/engine/activities.ts');
let content = fs.readFileSync(filePath, 'utf8');

const ENRICHMENTS = {
  'act-vidden-bergen': {
    titleEn: 'The Vidden Trail: Ulriken to Fløyen Ridge Walk',
    descriptionEn: 'The ultimate Bergen classic! High mountain ridge hike across Ulriken (643m) to Fløyen with panoramic 360° views of fjords, city and the Atlantic Ocean.',
    locationNameEn: 'Ulriken / Fløyen Summit',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  'act-stoltzen-bergen': {
    titleEn: 'Stoltzekleiven: The 800-Step Mountain Staircase',
    descriptionEn: 'Climb Bergen\'s iconic 801 stone steps up the steep mountainside to Sandviksfjellet. A legendary workout rewarding you with panoramic sun-drenched views.',
    locationNameEn: 'Sandviken / Sandviksfjellet',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  },
  'act-totland-ski-bergen': {
    titleEn: 'Totland & Frotveit Groomed Cross-Country Ski Trails',
    descriptionEn: 'Bergen\'s premier winter wonderland: 15 km of freshly groomed ski trails in sunlit pine forests and open ridges with floodlights in the evening.',
    locationNameEn: 'Totland & Frotveit Ski Arena',
    imageUrl: 'https://images.unsplash.com/photo-1482867996988-29ec3a0f1aac?auto=format&fit=crop&w=1200&q=80'
  },
  'act-nordnes-sjobad': {
    titleEn: 'Nordnes Sea Bath — Heated Saltwater Pool & Fjord Dip',
    descriptionEn: 'Historic ocean bath from 1910 situated at the tip of the Nordnes peninsula. Swim in the heated 29°C saltwater pool or take a refreshing plunge into the fjord.',
    locationNameEn: 'Nordnes Ocean Pier',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
  },
  'act-bergenfest': {
    titleEn: 'Bergenfest — Open-Air Music Festival at Bergenhus Fortress',
    descriptionEn: 'One of Western Norway\'s grandest open-air summer music festivals, hosted inside the medieval walls of King Håkon\'s Hall and Bergenhus Fortress.',
    locationNameEn: 'Bergenhus Fortress Grounds',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  },
  'act-eikedalen-ski': {
    titleEn: 'Eikedalen Alpine Resort — Powder & Family Slopes at Kvamskogen',
    descriptionEn: 'The mountain playground just 50 minutes from Bergen with 13 alpine slopes, dedicated children\'s park, ski rental, and cozy heated cabins.',
    locationNameEn: 'Eikedalen / Kvamskogen Mountain Pass',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80'
  },
  'act-jason-mraz': {
    titleEn: 'Jason Mraz — Acoustic Open-Air Concert at Koengen',
    descriptionEn: 'Feelgood acoustic vibes under the Scandinavian summer sky at Bergen\'s premiere open-air concert grounds right beside the royal fortress.',
    locationNameEn: 'Koengen Open-Air Arena',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80'
  },
  'act-hoytoglavt': {
    titleEn: 'Høyt & Lavt Climbing Park Nesttun',
    descriptionEn: 'Climb high into the tree canopies with 120 fun obstacles, 20 ziplines and courses tailored from toddlers to daredevils.',
    locationNameEn: 'Nesttun Adventure Woods',
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80'
  },
  'act-7fjell': {
    titleEn: 'The 7 Mountains Hike in Bergen (DNT Classic)',
    descriptionEn: 'The legendary Norwegian mountain challenge: 35 kilometers traversing all 7 mountain peaks encircling Bergen with 2400 meters of elevation.',
    locationNameEn: 'The 7 Mountain Peaks',
    imageUrl: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80'
  },
  'act-ekstremsportveko': {
    titleEn: 'Ekstremsportveko Voss — World\'s Premier Extreme Sports Festival',
    descriptionEn: 'A breathtaking week in the outdoor adventure capital Voss: skydiving, kayaking, paragliding, mountain biking, combined with vibrant live music.',
    locationNameEn: 'Voss Adventure Arena',
    imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'
  },
  'act-ado-arena': {
    titleEn: 'AdO Arena — National Aquatic Center & Heated Daylight Pools',
    descriptionEn: 'Norway\'s premier aquatic center featuring Olympic 50m pool, 10m diving tower, heated family pools and floor-to-ceiling glass walls.',
    locationNameEn: 'AdO Aquatic Center, Store Lungegårdsvann',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
  },
  'act-preikestolen-stavanger': {
    titleEn: 'Pulpit Rock Trail (Preikestolen & Lysefjord)',
    descriptionEn: 'One of the world\'s most awe-inspiring natural wonders: a sheer 604-meter cliff plunging into the emerald waters of Lysefjorden.',
    locationNameEn: 'Preikestolen Plateau, Lysefjord',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  'act-dalsnuten-stavanger': {
    titleEn: 'Dalsnuten Peak & Gramstad Mountain Loop',
    descriptionEn: 'A favorite family hike near Stavanger. Well-trodden paths to the summit (324m) offering expansive views across Gandsfjorden and the North Sea.',
    locationNameEn: 'Gramstad / Dalsnuten Summit',
    imageUrl: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1200&q=80'
  },
  'act-sirdal-ski-stavanger': {
    titleEn: 'Sirdal & Brekko Winter Park Ski Trails',
    descriptionEn: 'Southwestern Norway\'s ski heaven with over 200 km of interconnected cross-country ski tracks, alpine lifts and cozy heated warming cabins.',
    locationNameEn: 'Sirdal Alpine & Cross-Country Trails',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80'
  },
  'act-solastrand-stavanger': {
    titleEn: 'Sola Beach & Jæren Coastal Dunes',
    descriptionEn: 'Ranked among Europe\'s top coastal beaches: 2.3 km of silky golden sand dunes, roaring ocean waves, windsurfing and invigorating sea air.',
    locationNameEn: 'Sola Beach Promenade',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  'act-gladmat-stavanger': {
    titleEn: 'Gladmat Food Festival — Scandinavia\'s Largest Culinary Harbor Feast',
    descriptionEn: 'Stavanger harbor comes alive with over 100 food stalls, local seafood delicacies, celebrity chefs and outdoor waterfront dining.',
    locationNameEn: 'Vågen Harbor, Stavanger',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  },
  'act-trolljeger': {
    titleEn: 'Trolljeger Obstacle Course & Rugged Trail Run',
    descriptionEn: 'Norway\'s premier mud and obstacle race! Test your grit through forest trails, muddy rivers, balance beams and team hurdles.',
    locationNameEn: 'Foss-Eikeland / Sandnes Forest',
    imageUrl: 'https://images.unsplash.com/photo-1483721074574-8d960714c622?auto=format&fit=crop&w=1200&q=80'
  },
  'act-bymarka-trondheim': {
    titleEn: 'Bymarka: Gråkallen to Storheia Mountain Summit',
    descriptionEn: 'The highest summit in Trondheim (565m). Gentle forest ascents turning into wide open mountain ridges with vistas of Trondheimsfjorden.',
    locationNameEn: 'Skistua / Storheia Summit, Bymarka',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
  },
  'act-granassen-ski-trondheim': {
    titleEn: 'Granåsen World Championship Ski Trails & Arena',
    descriptionEn: 'Ski on the official World Championship tracks in Trondheim with world-class grooming, biathlon stadium, and lit tracks until late evening.',
    locationNameEn: 'Granåsen National Winter Arena',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80'
  },
  'act-ladestien-trondheim': {
    titleEn: 'Ladestien Coastal & Fjord Walk',
    descriptionEn: 'An 8 km scenic shoreline trail winding through swimming coves, rocky cliffs and historic estates with stunning sunset views over Trondheimsfjorden.',
    locationNameEn: 'Lade Peninsula & Fjord Shore',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'
  },
  'act-pstereo-trondheim': {
    titleEn: 'Pstereo Festival — Open-Air Music by River Nidelva & Cathedral',
    descriptionEn: 'Trondheim\'s most cherished music festival set on the lush lawns of Marinen, right underneath the illuminated spire of Nidaros Cathedral.',
    locationNameEn: 'Marinen River Park, Trondheim',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  },
  'act-baneheia-kristiansand': {
    titleEn: 'Baneheia Nature Park & Freshwater Lakes',
    descriptionEn: 'A tranquil forest haven just 5 minutes from Kristiansand city center with swimming lakes, warm pine scents and smooth rock trails.',
    locationNameEn: 'Baneheia 2. Stampe Lake',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80'
  },
  'act-sandripheia-ski-kristiansand': {
    titleEn: 'Sandripheia Winter Park Ski Arena',
    descriptionEn: 'Southern Norway\'s best winter venue with snowmaking facilities, groomed classic & skate tracks, and family sledding slopes.',
    locationNameEn: 'Sandripheia Vinterpark, Vennesla',
    imageUrl: 'https://images.unsplash.com/photo-1482867996988-29ec3a0f1aac?auto=format&fit=crop&w=1200&q=80'
  },
  'act-odderoya-kristiansand': {
    titleEn: 'Odderøya Island Lighthouse & Coastal Trail',
    descriptionEn: 'Stroll across the footbridge to historic Odderøya: WWII fortifications, charming red lighthouses, artist workshops and panoramic sea views.',
    locationNameEn: 'Odderøya Lighthouse & Coast',
    imageUrl: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80'
  },
  'act-palmesus-kristiansand': {
    titleEn: 'Palmesus — Scandinavia\'s Grandest Beach Party at Bystranda',
    descriptionEn: 'Over 40,000 festivalgoers gather on the golden sands of Kristiansand for international superstar DJs, palm trees and summer memories.',
    locationNameEn: 'Bystranda Beach, Kristiansand',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'
  },
  'act-keiservarden-bodo': {
    titleEn: 'Keiservarden Summit (366m) — Midnight Sun Vista',
    descriptionEn: 'The crown jewel of Bodø! Easy gravel trail leading to a 360-degree panorama of the Lofoten Wall and the midnight sun glowing on the Arctic Ocean.',
    locationNameEn: 'Keiservarden Summit Plateau',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80'
  },
  'act-perkalsatind-bodo': {
    titleEn: 'Per Kalsatind (1036m) in the Børvasstindan Peaks',
    descriptionEn: 'Dramatic alpine ridge adventure rising vertically above the Arctic fjords. For experienced mountain lovers seeking rugged solitude.',
    locationNameEn: 'Åselidalen / Per Kalsatind Summit',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  },
  'act-bodomarka-ski-bodo': {
    titleEn: 'Bestemorenga & Arctic Forest Ski Trails',
    descriptionEn: 'Cross-country skiing in pure Arctic daylight and crisp mountain air, with illuminated tracks winding toward the base of Keiservarden.',
    locationNameEn: 'Bestemorenga Ski Arena, Bodømarka',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80'
  },
  'act-mjelle-bodo': {
    titleEn: 'Mjelle Red Sand Beach & Coastal Path',
    descriptionEn: 'Famous for its pink and crimson sands caused by garnet minerals. Crystal-clear turquoise Arctic waters against towering dramatic headlands.',
    locationNameEn: 'Mjelle Coastal Cove, Bodø',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  'act-parken-bodo': {
    titleEn: 'Parken Festival in Rensåsparken Bodø',
    descriptionEn: 'Northern Norway\'s warmest open-air music festival, set in a natural amphitheater park under the midnight glow.',
    locationNameEn: 'Rensåsparken Amphitheater',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80'
  },
  'act-vettakollen-oslo': {
    titleEn: 'Vettakollen & Frognerseteren Panoramic Trail',
    descriptionEn: 'The most rewarding viewpoint in Oslo: gaze out over the entire Oslofjord, the downtown skyline, and hundreds of pine-fringed islands.',
    locationNameEn: 'Vettakollen Summit, Oslomarka',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80'
  },
  'act-sorenga-oslo': {
    titleEn: 'Sørenga Seawater Pool & Harbor Promenade',
    descriptionEn: 'Swim in the Oslofjord with unobstructed views of the Oslo Opera House, Munch Museum and passing sailboats.',
    locationNameEn: 'Sørenga Seawater Bath, Oslo Fjord',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  'act-oyafestivalen-oslo': {
    titleEn: 'Øya Festival in Tøyenparken',
    descriptionEn: 'Norway\'s flagship international music festival, celebrated for world-class artists, organic gourmet food and green park vibes.',
    locationNameEn: 'Tøyenparken Festival Grounds',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  },
  'act-tryvann-oslo': {
    titleEn: 'Oslo Vinterpark Tryvann & Nordmarka Ski Forest',
    descriptionEn: 'Just 30 minutes from downtown via subway: 18 alpine ski slopes, terrain parks, and access to 2,600 km of cross-country ski trails.',
    locationNameEn: 'Tryvann / Holmenkollen Hills',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80'
  },
  'act-byfjellene-grus-ebike-bergen': {
    titleEn: 'E-Bike Mountain Gravel Tour: Fjellveien to Sandviksfjellet',
    descriptionEn: 'Glide effortlessly along Bergen\'s historic mountain road (Fjellveien) with continuous views of the harbor and wooden neighborhoods.',
    locationNameEn: 'Fjellveien Panoramic Byvei',
    imageUrl: 'https://images.unsplash.com/photo-1483721074574-8d960714c622?auto=format&fit=crop&w=1200&q=80'
  },
  'act-nordlys-reinsdyr-bodo': {
    titleEn: 'Northern Lights Safari, Sami Lavvo & Reindeer Camp',
    descriptionEn: 'Experience the magic of the Arctic: aurora borealis dancing across the sky, warming around the fire inside a traditional Sami tent (lavvo).',
    locationNameEn: 'Salten Arctic Wilderness Camp',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80'
  },
  'act-lysefjorden-viaferrata-kajakk-stavanger': {
    titleEn: 'Via Ferrata Climbing, Fjord Kayak & Cabin Stay in Lysefjord',
    descriptionEn: 'Scale the sheer vertical granite walls above Lysefjorden, followed by silent paddling in sea kayaks between soaring mountain waterfalls.',
    locationNameEn: 'Lysefjorden Vertical Fjord Walls',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
  },
  'act-jakt-isfiske-koie-trondheim': {
    titleEn: 'Wilderness Cabin, Ice Fishing & Forest Hideaway in Trøndelag',
    descriptionEn: 'True Norwegian friluftsliv: stay in an authentic Statskog timber cabin by a frozen wilderness lake with woodstove and crackling fire.',
    locationNameEn: 'Trøndelag Deep Pine Taiga',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
  },
  'act-skjergard-padling-kystled-kristiansand': {
    titleEn: 'Sea Kayaking, Coastal E-Bike & Heritage Cabin at Bragdøya',
    descriptionEn: 'Paddle between sheltered islands, sandy beaches and historic lighthouses, staying in a charming traditional coastal cabin (kystledhytte).',
    locationNameEn: 'Bragdøya Island & Archipelago',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  'act-nordmarka-ebike-koie-oslo': {
    titleEn: 'Gravel E-Bike Adventure to Kikutstua Lodge & Forest Cabin',
    descriptionEn: 'Pedal through the deep tranquil spruce forests of Nordmarka on scenic gravel roads to the iconic Kikutstua lodge for warm waffles and coffee.',
    locationNameEn: 'Nordmarka Forest & Kikutstua',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
  }
};

let count = 0;
for (const [id, data] of Object.entries(ENRICHMENTS)) {
  const idRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?title:\\s*'[^\']+',)`, 'g');
  const match = idRegex.exec(content);
  if (match) {
    // Add titleEn directly after title if not already present
    if (!content.includes(`id: '${id}'`) || !content.includes(`titleEn: '${data.titleEn}'`)) {
      content = content.replace(
        new RegExp(`(id:\\s*'${id}',[\\s\\S]*?title:\\s*'[^']+',)`),
        `$1\n    titleEn: ${JSON.stringify(data.titleEn)},`
      );
    }
  }

  // Replace description with descriptionEn following
  if (!content.includes(`descriptionEn: ${JSON.stringify(data.descriptionEn)}`)) {
    content = content.replace(
      new RegExp(`(id:\\s*'${id}',[\\s\\S]*?description:\\s*'[^']+',)`),
      `$1\n    descriptionEn: ${JSON.stringify(data.descriptionEn)},\n    locationNameEn: ${JSON.stringify(data.locationNameEn)},`
    );
  }

  // Update imageUrl for this activity
  const imgRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?imageUrl:\\s*')[^']+(')`);
  if (imgRegex.test(content)) {
    content = content.replace(imgRegex, `$1${data.imageUrl}$2`);
    count++;
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Enriched ${count} activities with authentic Norwegian photos and English metadata.`);
