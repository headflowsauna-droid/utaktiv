<?php
/**
 * Utaktiv Vipps MobilePay Backend Proxy (cPanel / PHP)
 * Håndterer sikker kommunikasjon mot Vipps Test-miljø (og Produksjon ved utrulling)
 * uten å eksponere client_secret til nettleseren.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Konfigurasjon (Henter hemmeligheter fra miljø eller .env)
$vippsEnv = getenv('VIPPS_ENV') ?: 'test';
$config = [
    'env'                    => $vippsEnv,
    'base_url'               => ($vippsEnv === 'production') ? 'https://api.vipps.no' : 'https://apitest.vipps.no',
    'client_id'              => getenv('VIPPS_CLIENT_ID') ?: (getenv('VITE_VIPPS_CLIENT_ID') ?: ''),
    'client_secret'          => getenv('VIPPS_CLIENT_SECRET') ?: '',
    'subscription_key'       => getenv('VIPPS_SUBSCRIPTION_KEY') ?: '',
    'merchant_serial_number' => getenv('VIPPS_MSN') ?: (getenv('VITE_VIPPS_MSN') ?: ''),
];

// Fallback til å lese fra .env lokalt dersom servermiljø ikke har satt variablene
if (empty($config['client_secret'])) {
    $envPath = __DIR__ . '/../../.env';
    if (!is_file($envPath)) {
        $envPath = __DIR__ . '/../.env';
    }
    if (is_file($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                if ($key === 'VIPPS_CLIENT_SECRET' && empty($config['client_secret'])) $config['client_secret'] = $val;
                if ($key === 'VIPPS_SUBSCRIPTION_KEY' && empty($config['subscription_key'])) $config['subscription_key'] = $val;
                if ($key === 'VIPPS_CLIENT_ID' && empty($config['client_id'])) $config['client_id'] = $val;
                if ($key === 'VIPPS_MSN' && empty($config['merchant_serial_number'])) $config['merchant_serial_number'] = $val;
            }
        }
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

/**
 * Henter gyldig Access Token fra Vipps API (med lokal caching i 55 minutter)
 */
function getVippsAccessToken($config) {
    $cacheFile = sys_get_temp_dir() . '/utaktiv_vipps_token_' . md5($config['client_id']) . '.json';
    if (is_file($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['expires_at']) && time() < $cached['expires_at']) {
            return $cached['access_token'];
        }
    }

    $ch = curl_init($config['base_url'] . '/accesstoken/get');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'client_id: ' . $config['client_id'],
            'client_secret: ' . $config['client_secret'],
            'Ocp-Apim-Subscription-Key: ' . $config['subscription_key'],
            'Merchant-Serial-Number: ' . $config['merchant_serial_number'],
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return false;
    }

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        return false;
    }

    $expiresIn = isset($data['expires_in']) ? (int)$data['expires_in'] : 3600;
    $cacheData = [
        'access_token' => $data['access_token'],
        'expires_at'   => time() + max(300, $expiresIn - 300),
    ];
    @file_put_contents($cacheFile, json_encode($cacheData));

    return $data['access_token'];
}

// 1. ACTION: Test token / helsesjekk
if ($action === 'token') {
    $token = getVippsAccessToken($config);
    if (!$token) {
        http_response_code(502);
        echo json_encode(['success' => false, 'error' => 'Kunne ikke hente Vipps access token']);
        exit;
    }
    echo json_encode(['success' => true, 'env' => $config['env'], 'token_length' => strlen($token)]);
    exit;
}

// 2. ACTION: create_payment (ePayment v1)
if ($action === 'create_payment') {
    $inputRaw = file_get_contents('php://input');
    $input = json_decode($inputRaw, true) ?: [];

    $amountNok = isset($input['amountNok']) ? (float)$input['amountNok'] : 0;
    $orderId = isset($input['orderId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $input['orderId']) : ('utaktiv_' . time());
    $description = isset($input['description']) ? mb_substr($input['description'], 0, 100) : 'Utaktiv opplevelse';
    $customerPhone = isset($input['customerPhone']) ? preg_replace('/[^0-9]/', '', $input['customerPhone']) : '';
    $returnUrl = isset($input['returnUrl']) ? $input['returnUrl'] : 'https://utaktiv.no';

    if ($amountNok <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ugyldig beløp']);
        exit;
    }

    $token = getVippsAccessToken($config);
    if (!$token) {
        http_response_code(502);
        echo json_encode(['success' => false, 'error' => 'Vipps auth feilet']);
        exit;
    }

    // Vipps ePayment v1 krever beløp i øre (heltall)
    $amountOre = (int)round($amountNok * 100);

    $payload = [
        'amount' => [
            'currency' => 'NOK',
            'value'    => $amountOre,
        ],
        'paymentMethod' => [
            'type' => 'WALLET',
        ],
        'customer' => [
            'phoneNumber' => $customerPhone ?: null,
        ],
        'reference'          => $orderId,
        'userFlow'           => 'WEB_REDIRECT',
        'returnUrl'          => $returnUrl,
        'paymentDescription' => $description,
    ];

    if (empty($payload['customer']['phoneNumber'])) {
        unset($payload['customer']);
    }

    $ch = curl_init($config['base_url'] . '/epayment/v1/payments');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
            'Ocp-Apim-Subscription-Key: ' . $config['subscription_key'],
            'Merchant-Serial-Number: ' . $config['merchant_serial_number'],
            'Idempotency-Key: ' . uniqid('vipps_idem_', true),
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $resData = json_decode($response, true);
        echo json_encode([
            'success'     => true,
            'orderId'     => $orderId,
            'redirectUrl' => isset($resData['redirectUrl']) ? $resData['redirectUrl'] : null,
            'reference'   => isset($resData['reference']) ? $resData['reference'] : $orderId,
            'isTest'      => true,
        ]);
        exit;
    }

    http_response_code($httpCode ?: 500);
    echo json_encode([
        'success'  => false,
        'error'    => 'Vipps API feil (' . $httpCode . ')',
        'response' => json_decode($response, true) ?: $response,
    ]);
    exit;
}

// 3. ACTION: login / oauth_token (Vipps Login OIDC Code Exchange & Userinfo)
if ($action === 'login' || $action === 'oauth_token') {
    $inputRaw = file_get_contents('php://input');
    $input = json_decode($inputRaw, true) ?: [];

    $code = isset($input['code']) ? trim($input['code']) : '';
    $redirectUri = isset($input['redirect_uri']) ? trim($input['redirect_uri']) : '';

    if (empty($code)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Mangler authorization code']);
        exit;
    }

    if (empty($redirectUri)) {
        $redirectUri = 'https://utaktiv.no';
    }

    // A. Bytt authorization_code mot access_token (Basic Auth client_id:client_secret)
    $tokenEndpoint = $config['base_url'] . '/access-management-1.0/access/oauth2/token';
    $basicAuth = base64_encode($config['client_id'] . ':' . $config['client_secret']);

    $postBody = http_build_query([
        'grant_type'   => 'authorization_code',
        'code'         => $code,
        'redirect_uri' => $redirectUri,
    ]);

    $ch = curl_init($tokenEndpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
            'Authorization: Basic ' . $basicAuth,
        ],
        CURLOPT_POSTFIELDS     => $postBody,
    ]);
    $tokenResp = curl_exec($ch);
    $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($tokenHttpCode !== 200 || !$tokenResp) {
        http_response_code($tokenHttpCode ?: 500);
        echo json_encode([
            'success'  => false,
            'error'    => 'Kunne ikke hente token fra Vipps Login (' . $tokenHttpCode . ')',
            'response' => json_decode($tokenResp, true) ?: $tokenResp,
        ]);
        exit;
    }

    $tokenData = json_decode($tokenResp, true);
    $accessToken = isset($tokenData['access_token']) ? $tokenData['access_token'] : null;

    if (!$accessToken) {
        http_response_code(502);
        echo json_encode(['success' => false, 'error' => 'Mangler access_token i Vipps respons']);
        exit;
    }

    // B. Hent brukerprofil fra userinfo endpoint
    $userinfoEndpoint = $config['base_url'] . '/vipps-userinfo-api/userinfo';
    $chUser = curl_init($userinfoEndpoint);
    curl_setopt_array($chUser, [
        CURLOPT_HTTPGET        => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $accessToken,
        ],
    ]);
    $userResp = curl_exec($chUser);
    $userHttpCode = curl_getinfo($chUser, CURLINFO_HTTP_CODE);
    curl_close($chUser);

    if ($userHttpCode !== 200 || !$userResp) {
        http_response_code($userHttpCode ?: 500);
        echo json_encode([
            'success'  => false,
            'error'    => 'Kunne ikke hente brukerinfo fra Vipps (' . $userHttpCode . ')',
            'response' => json_decode($userResp, true) ?: $userResp,
        ]);
        exit;
    }

    $userData = json_decode($userResp, true);
    $name = isset($userData['name']) ? $userData['name'] : trim((isset($userData['given_name']) ? $userData['given_name'] : '') . ' ' . (isset($userData['family_name']) ? $userData['family_name'] : ''));

    echo json_encode([
        'success' => true,
        'user'    => [
            'sub'            => isset($userData['sub']) ? $userData['sub'] : ('vipps_' . time()),
            'name'           => $name ?: 'Vipps-bruker',
            'given_name'     => isset($userData['given_name']) ? $userData['given_name'] : '',
            'family_name'    => isset($userData['family_name']) ? $userData['family_name'] : '',
            'email'          => isset($userData['email']) ? $userData['email'] : '',
            'email_verified' => !empty($userData['email_verified']),
            'phone'          => isset($userData['phone_number']) ? $userData['phone_number'] : '',
            'address'        => isset($userData['address']) ? $userData['address'] : null,
        ],
    ]);
    exit;
}

// Default status
echo json_encode([
    'service'   => 'Utaktiv Vipps Proxy API',
    'status'    => 'active',
    'env'       => $config['env'],
    'salesUnit' => $config['merchant_serial_number'],
]);
