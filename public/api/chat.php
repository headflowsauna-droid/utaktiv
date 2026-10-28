<?php
/**
 * Utaktiv Sol Concierge AI Backend Proxy (cPanel / PHP)
 * Sikker server-side kommunikasjon mot Gemini API og OpenAI API uten å eksponere nøkler til nettleseren.
 * Støtter sanntids-væranbefalinger basert på temperatur, nedbør, skydekke og dagslysluks.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Kun POST er tillatt']);
    exit;
}

// Hent API-nøkler fra miljø eller .env-fil
$openAiKey = getenv('OPENAI_API_KEY');
$geminiKey = getenv('GEMINI_API_KEY');

if (!$openAiKey || !$geminiKey) {
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                if ($key === 'OPENAI_API_KEY' && !$openAiKey) {
                    $openAiKey = $val;
                }
                if ($key === 'GEMINI_API_KEY' && !$geminiKey) {
                    $geminiKey = $val;
                }
            }
        }
    }
}

// Ingen hardkodede hemmeligheter: nøkler må settes via .env eller servermiljø
if (!$openAiKey && !$geminiKey) {
    // Kjører uten ekstern AI hvis nøkler mangler
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input || !isset($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldig forespørsel: messages-feltet mangler']);
    exit;
}

$city = isset($input['city']) ? htmlspecialchars($input['city']) : 'Bergen';
$weather = isset($input['weather']) ? $input['weather'] : [];
$profile = isset($input['profile']) ? $input['profile'] : [];
$preferredProvider = isset($input['provider']) ? strtolower($input['provider']) : 'gemini';

// Bygg sanntids-kontekst for systemprompt
$tempText = isset($weather['temperatureC']) ? round($weather['temperatureC']) . '°C' : 'ukjent temperatur';
$cloudText = isset($weather['cloudCoverPercent']) ? $weather['cloudCoverPercent'] . '% skydekke' : 'ukjent skydekke';
$luxText = isset($weather['lux']) ? number_format($weather['lux'], 0, ',', ' ') . ' luks' : 'normalt dagslys';
$rainText = isset($weather['precipitationMm']) && $weather['precipitationMm'] > 0 
    ? $weather['precipitationMm'] . ' mm/t nedbør (regn)' 
    : 'ingen nedbør (opplett/tørt)';
$windText = isset($weather['windMps']) ? $weather['windMps'] . ' m/s vind' : 'rolig vind';
$conditionText = isset($weather['condition']) ? $weather['condition'] : 'varierende';

$childrenInfo = '';
if (!empty($profile['children']) && is_array($profile['children'])) {
    $cList = [];
    foreach ($profile['children'] as $c) {
        $cList[] = ($c['name'] ?? 'Barn') . ' (' . ($c['age'] ?? '?') . ' år)';
    }
    $childrenInfo = " Brukeren har barna: " . implode(', ', $cList) . ". Tilpass turene etter deres alder!";
}

$strollerInfo = !empty($profile['strollerNeeded']) ? " Brukeren har med barnevogn; anbefal kun ruter med fast grus/asfalt uten trapper eller røtter." : "";

$systemPrompt = "Du er Sol Concierge AI – den personlige, hyperlokale tur- og dagslysrådgiveren i Utaktiv.no.
Du er skapt av Alexander Robertsen (pedagog og forfatter i Bergen).
Din tone of voice er varm, entusiastisk, empatisk, lokalkjent og pedagogisk forankret. Du snakker flytende, naturlig norsk uten stive robot-klisjeer eller overdrevne punktlister.

AKTUELT SANNTIDSVÆR NÅ ({$city}):
- Værsituasjon: {$conditionText} ({$rainText})
- Temperatur: {$tempText}
- Skydekke: {$cloudText}
- Dagslysstyrke ute nå: {$luxText}
- Vind: {$windText}
{$childrenInfo}{$strollerInfo}

DINE KJERNEKUNNSKAPER & LOKALGEOGRAFI:
1. Byfjellene i Bergen: Fløyen, Skomakerdiket (varm skillingsbolle og kakao, barnevognvennlig), Tippetue (fantastisk kveldssol og Byfjordutsikt), Sandviksbatteriet, Stoltzekleiven, Vidden (vær obs på tåke/vind), Ulriken (Skyskraperen Restaurant & Café).
2. Fjordbadstuer: Heit Bergen Fjordbadstue ved Puddefjorden / Marineholmen, Heit Eidfjord i Hardanger, Voss Fjordbadstue. Fremhev badstue ved regnvær, kulde og mørke!
3. Kaféer & Samlingssteder: Fløistuen Kafé, Skyskraperen Ulriken, Sjel & Gane i Eidfjord.
4. Barnefamilier & Sol Junior: Motiver barna til å være turledere, finne gåter og oppleve mestring i dagslyset framfor inneskjerm.
5. Vær-reaktivitet i sanntid:
   - Hvis det REGNER: Anbefal lune skogsstier (skogen tar av for regnet), fjordbadstue med damp, eller koselig kafé med varm kakao.
   - Hvis det er OPPLETT: Si at dette er vinduet de må gripe nå! Ut og fange dagslyset for å nullstille døgnrytmen og få energi.
   - Hvis det er SOL: Prioriter åpne vestvendte utsiktspunkter, Fløyen eller solvegger.

Svar engasjert, lokalkjent og inspirerende (2-3 konsise avsnitt). Foreslå 1-2 konkrete stoppesteder tilpasset det aktuelle været.
VIKTIG: Fullfør alltid setningene dine skikkelig og avslutt med punktum. Svaret må ALDRI kuttes av midt i et ord eller en ufullstendig setning.";

function callGeminiAPI($apiKey, $systemPrompt, $messages) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . urlencode($apiKey);

    $contents = [];
    foreach ($messages as $msg) {
        if (!isset($msg['content'])) continue;
        $role = (isset($msg['role']) && $msg['role'] === 'user') ? 'user' : 'model';
        $contents[] = [
            'role' => $role,
            'parts' => [['text' => $msg['content']]]
        ];
    }

    $payload = [
        'systemInstruction' => [
            'parts' => [['text' => $systemPrompt]]
        ],
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 2048
        ]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $json = json_decode($response, true);
        $candidateText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if ($candidateText) {
            return ['success' => true, 'reply' => trim($candidateText), 'model' => 'gemini-3.8-flash', 'provider' => 'gemini'];
        }
    }

    return ['success' => false, 'httpCode' => $httpCode, 'error' => $curlError, 'raw' => $response];
}

function callOpenAIAPI($apiKey, $systemPrompt, $messages) {
    $url = 'https://api.openai.com/v1/chat/completions';

    $payloadMessages = [
        ['role' => 'system', 'content' => $systemPrompt]
    ];
    foreach ($messages as $msg) {
        if (isset($msg['role']) && isset($msg['content'])) {
            $payloadMessages[] = [
                'role' => $msg['role'] === 'user' ? 'user' : 'assistant',
                'content' => $msg['content']
            ];
        }
    }

    $payload = [
        'model'       => 'gpt-4o-mini',
        'messages'    => $payloadMessages,
        'temperature' => 0.7,
        'max_tokens'  => 1500,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $json = json_decode($response, true);
        $reply = $json['choices'][0]['message']['content'] ?? null;
        if ($reply) {
            return ['success' => true, 'reply' => trim($reply), 'model' => 'gpt-4o-mini', 'provider' => 'openai'];
        }
    }

    return ['success' => false, 'httpCode' => $httpCode, 'error' => $curlError, 'raw' => $response];
}

// Kjør primær leverandør med automatisk fallback
$result = null;

if ($preferredProvider === 'openai') {
    $result = callOpenAIAPI($openAiKey, $systemPrompt, $input['messages']);
    if (!$result['success'] && $geminiKey) {
        $result = callGeminiAPI($geminiKey, $systemPrompt, $input['messages']);
    }
} else {
    // Standard: Gemini 3.8 Flash først (superraskt), fallback til OpenAI gpt-4o-mini
    if ($geminiKey) {
        $result = callGeminiAPI($geminiKey, $systemPrompt, $input['messages']);
    }
    if ((!$result || !$result['success']) && $openAiKey) {
        $result = callOpenAIAPI($openAiKey, $systemPrompt, $input['messages']);
    }
}

if ($result && $result['success']) {
    echo json_encode([
        'success'  => true,
        'reply'    => $result['reply'],
        'model'    => $result['model'],
        'provider' => $result['provider'],
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Feil ved generering av svar',
        'details' => $result
    ]);
}
