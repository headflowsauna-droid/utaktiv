<?php
// Proxy mot api.met.no (Yr). Nettlesere kan ikke sette User-Agent, og MET krever det.
// Kalles som /api/met/weatherapi/locationforecast/2.0/compact?lat=..&lon=.. via .htaccess.

header('Content-Type: application/json; charset=utf-8');

$allowedPath = 'weatherapi/locationforecast/2.0/compact';
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$lat = isset($_GET['lat']) ? $_GET['lat'] : '';
$lon = isset($_GET['lon']) ? $_GET['lon'] : '';

if ($path !== $allowedPath || !is_numeric($lat) || !is_numeric($lon)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldig forespørsel']);
    exit;
}

$lat = round((float)$lat, 4);
$lon = round((float)$lon, 4);
if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldige koordinater']);
    exit;
}

// MET ber om at man cacher svar. 10 minutter per koordinat.
$cacheFile = sys_get_temp_dir() . '/utaktiv_met_' . md5($lat . ',' . $lon) . '.json';
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < 600) {
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

$url = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' . $lat . '&lon=' . $lon;
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['User-Agent: Utaktiv/1.0 (https://utaktiv.no)'],
]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($body === false || $status !== 200) {
    // Server gammel cache heller enn feil, hvis vi har den.
    if (is_file($cacheFile)) {
        header('X-Cache: STALE');
        readfile($cacheFile);
        exit;
    }
    http_response_code(502);
    echo json_encode(['error' => 'Kunne ikke hente vær fra MET']);
    exit;
}

@file_put_contents($cacheFile, $body);
header('X-Cache: MISS');
echo $body;
