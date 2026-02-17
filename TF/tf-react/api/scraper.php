<?php
/**
 * Athletic Records Scraper API
 * Dedicated API for the React Track & Field visualization app
 * 
 * Fetches data from alltime-athletics.com and caches it as JSON
 * 
 * Usage:
 *   - api/scraper.php?event=mmara      (fetch men's marathon)
 *   - api/scraper.php?event=mmara&refresh=1  (force refresh cache)
 *   - api/scraper.php?list             (list available events)
 *   - api/scraper.php?update_all=1     (refresh all events - for cron)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration
$CACHE_DIR = __DIR__ . '/cache/';
$CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Event configurations: [display_name, url_code, cutoff_value]
$EVENTS = [
    // ============ MEN'S EVENTS ============
    // Sprints
    'm_100'   => ["Men's 100m", 'm_100', 1200],
    'm_200'   => ["Men's 200m", 'm_200', 2200],
    'm_400'   => ["Men's 400m", 'm_400', 5000],
    'm_110h'  => ["Men's 110m Hurdles", 'm_110h', 1500],
    'm_400h'  => ["Men's 400m Hurdles", 'm_400h', 5200],
    // Middle Distance
    'm_800'   => ["Men's 800m", 'm_800', 12000],
    'm_1500'  => ["Men's 1500m", 'm_1500', 24000],
    'm_mile'  => ["Men's Mile", 'm_mile', 26000],
    // Long Distance
    'm_3000'  => ["Men's 3,000m", 'm_3000', 47000],
    'm3000h'  => ["Men's 3,000m Steeplechase", 'm3000h', 52000],
    'm_5000'  => ["Men's 5,000m", 'm_5000', 82000],
    'm10000'  => ["Men's 10,000m", 'm10000', 140000],
    'mhmara'  => ["Men's Half Marathon", 'mhmara', 280000],
    'mmara'   => ["Men's Marathon", 'mmara', 600000],
    // Race Walks
    'm20kw'   => ["Men's 20km Race Walk", 'm20kw', 520000],
    'm35kw'   => ["Men's 35km Race Walk", 'm35kw', 900000],
    'm50kw'   => ["Men's 50km Race Walk", 'm50kw', 1350000],
    // Field Events - Jumps
    'mhigh'   => ["Men's High Jump", 'mhigh', 230],
    'mpole'   => ["Men's Pole Vault", 'mpole', 590],
    'mlong'   => ["Men's Long Jump", 'mlong', 860],
    'mtrip'   => ["Men's Triple Jump", 'mtrip', 1760],
    // Field Events - Throws
    'mshot'   => ["Men's Shot Put", 'mshot', 2150],
    'mdisc'   => ["Men's Discus", 'mdisc', 7000],
    'mhamm'   => ["Men's Hammer Throw", 'mhamm', 8000],
    'mjave'   => ["Men's Javelin", 'mjave', 9100],
    // Combined Events
    'mdeca'   => ["Men's Decathlon", 'mdeca', 8500],
    
    // ============ WOMEN'S EVENTS ============
    // Sprints
    'w_100'   => ["Women's 100m", 'w_100', 1300],
    'w_200'   => ["Women's 200m", 'w_200', 2400],
    'w_400'   => ["Women's 400m", 'w_400', 5500],
    'w_100h'  => ["Women's 100m Hurdles", 'w_100h', 1400],
    'w_400h'  => ["Women's 400m Hurdles", 'w_400h', 5700],
    // Middle Distance
    'w_800'   => ["Women's 800m", 'w_800', 13500],
    'w_1500'  => ["Women's 1500m", 'w_1500', 27000],
    'w_mile'  => ["Women's Mile", 'w_mile', 29000],
    // Long Distance
    'w_3000'  => ["Women's 3,000m", 'w_3000', 55000],
    'w3000h'  => ["Women's 3,000m Steeplechase", 'w3000h', 60000],
    'w_5000'  => ["Women's 5,000m", 'w_5000', 95000],
    'w10000'  => ["Women's 10,000m", 'w10000', 190000],
    'whmara'  => ["Women's Half Marathon", 'whmara', 320000],
    'wmara'   => ["Women's Marathon", 'wmara', 840000],
    // Race Walks
    'w20kw'   => ["Women's 20km Race Walk", 'w20kw', 600000],
    'w35kw'   => ["Women's 35km Race Walk", 'w35kw', 1050000],
    // Field Events - Jumps
    'whigh'   => ["Women's High Jump", 'whigh', 200],
    'wpole'   => ["Women's Pole Vault", 'wpole', 480],
    'wlong'   => ["Women's Long Jump", 'wlong', 720],
    'wtrip'   => ["Women's Triple Jump", 'wtrip', 1480],
    // Field Events - Throws
    'wshot'   => ["Women's Shot Put", 'wshot', 2000],
    'wdisc'   => ["Women's Discus", 'wdisc', 7000],
    'whamm'   => ["Women's Hammer Throw", 'whamm', 7500],
    'wjave'   => ["Women's Javelin", 'wjave', 6500],
];

// Ensure cache directory exists
if (!file_exists($CACHE_DIR)) {
    mkdir($CACHE_DIR, 0755, true);
}

/**
 * Fetch HTML from alltime-athletics.com
 */
function fetchEventData($eventCode) {
    $url = "https://www.alltime-athletics.com/{$eventCode}ok.htm";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (compatible; AthleticsApp/1.0)\r\n",
            'timeout' => 30
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $html = @file_get_contents($url, false, $context);
    
    if ($html === false) {
        return ['error' => "Failed to fetch data from $url"];
    }
    
    return parseHtml($html);
}

/**
 * Parse the HTML content and extract records
 */
function parseHtml($html) {
    $records = [];
    
    // Find <PRE> tag start position
    $prePos = stripos($html, '<PRE>');
    if ($prePos === false) {
        return [
            'success' => false,
            'error' => 'No PRE tag found in HTML',
            'count' => 0,
            'records' => []
        ];
    }
    
    // Extract content after <PRE>
    $content = substr($html, $prePos + 5);
    
    // Find where it ends (</BODY> or end of string)
    $endPos = stripos($content, '</BODY>');
    if ($endPos !== false) {
        $content = substr($content, 0, $endPos);
    }
    
    // Decode HTML entities
    $content = html_entity_decode($content, ENT_QUOTES, 'UTF-8');
    
    // Split into lines
    $lines = explode("\n", $content);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        // Skip lines that start with special characters or are headers/notes
        if (preg_match('/^[+#*=-]/', $line)) continue;
        if (stripos($line, 'indoor') !== false) continue;
        if (stripos($line, 'oversized') !== false) continue;
        if (stripos($line, 'intermediate') !== false) continue;
        
        // Parse line - split by multiple spaces (2 or more)
        $parts = preg_split('/\s{2,}/', $line);
        $parts = array_values(array_filter($parts, function($p) { 
            return trim($p) !== ''; 
        }));
        
        // We need at least 8 fields: rank, time, [wind], athlete, country, dob, position, location, date
        if (count($parts) >= 8) {
            // Validate that first field looks like a rank number
            if (!preg_match('/^\d+$/', trim($parts[0]))) continue;
            
            // Check if field 2 is a wind reading (starts with +, -, ± or is a small decimal like 0.0)
            $hasWind = false;
            $windValue = '';
            $potentialWind = trim($parts[2]);
            // Match wind patterns: +0.9, -1.2, ±0.0, 0.0, +1.5, etc.
            // Use unicode-aware matching for ± symbol
            if (count($parts) >= 9 && preg_match('/^[+\-\x{00B1}]?\d*\.?\d+$/u', $potentialWind)) {
                // Also check it's a reasonable wind value (typically -5 to +5)
                $numericWind = floatval(preg_replace('/[^0-9.\-]/', '', $potentialWind));
                if (abs($numericWind) <= 10) {
                    $hasWind = true;
                    $windValue = $potentialWind;
                }
            }
            
            // Adjust indices based on whether wind is present
            $offset = $hasWind ? 1 : 0;
            
            $records[] = [
                'rank' => isset($parts[0]) ? trim($parts[0]) : '',
                'time' => isset($parts[1]) ? trim($parts[1]) : '',
                'wind' => $windValue,
                'athlete' => isset($parts[2 + $offset]) ? trim($parts[2 + $offset]) : '',
                'country' => isset($parts[3 + $offset]) ? trim($parts[3 + $offset]) : '',
                'dob' => isset($parts[4 + $offset]) ? trim($parts[4 + $offset]) : '',
                'position' => isset($parts[5 + $offset]) ? trim($parts[5 + $offset]) : '',
                'location' => isset($parts[6 + $offset]) ? trim($parts[6 + $offset]) : '',
                'date' => isset($parts[7 + $offset]) ? trim($parts[7 + $offset]) : ''
            ];
        }
    }
    
    return [
        'success' => true,
        'count' => count($records),
        'fetched_at' => date('Y-m-d H:i:s'),
        'records' => $records
    ];
}

/**
 * Get cached data or fetch fresh
 */
function getCachedOrFetch($eventCode, $forceRefresh = false) {
    global $CACHE_DIR, $CACHE_DURATION;
    
    $cacheFile = $CACHE_DIR . $eventCode . '.json';
    
    // Check if cache exists and is fresh
    if (!$forceRefresh && file_exists($cacheFile)) {
        $cacheAge = time() - filemtime($cacheFile);
        if ($cacheAge < $CACHE_DURATION) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            $cached['from_cache'] = true;
            $cached['cache_age_hours'] = round($cacheAge / 3600, 1);
            return $cached;
        }
    }
    
    // Fetch fresh data
    $data = fetchEventData($eventCode);
    
    if (!isset($data['error'])) {
        $data['from_cache'] = false;
        file_put_contents($cacheFile, json_encode($data, JSON_PRETTY_PRINT));
    }
    
    return $data;
}

/**
 * Update all events (for cron job)
 */
function updateAllEvents() {
    global $EVENTS;
    $results = [];
    
    foreach ($EVENTS as $code => $config) {
        $results[$code] = getCachedOrFetch($code, true);
        usleep(500000); // 0.5 second delay
    }
    
    return [
        'success' => true,
        'updated_at' => date('Y-m-d H:i:s'),
        'events' => array_keys($results),
        'summary' => array_map(function($r) {
            return isset($r['count']) ? $r['count'] . ' records' : 'error';
        }, $results)
    ];
}

/**
 * List available events
 */
function listEvents() {
    global $EVENTS, $CACHE_DIR;
    
    $eventList = [];
    foreach ($EVENTS as $code => $config) {
        $cacheFile = $CACHE_DIR . $code . '.json';
        $eventList[] = [
            'code' => $code,
            'name' => $config[0],
            'cached' => file_exists($cacheFile),
            'cache_date' => file_exists($cacheFile) ? date('Y-m-d H:i:s', filemtime($cacheFile)) : null
        ];
    }
    
    return [
        'success' => true,
        'events' => $eventList
    ];
}

// ============ MAIN ROUTING ============

// Update all events (cron endpoint)
if (isset($_GET['update_all'])) {
    echo json_encode(updateAllEvents(), JSON_PRETTY_PRINT);
    exit;
}

// List all events
if (isset($_GET['list'])) {
    echo json_encode(listEvents(), JSON_PRETTY_PRINT);
    exit;
}

// Get specific event data
if (isset($_GET['event'])) {
    $event = preg_replace('/[^a-z0-9_]/i', '', $_GET['event']);
    $forceRefresh = isset($_GET['refresh']) && $_GET['refresh'] == '1';
    
    global $EVENTS;
    if (!isset($EVENTS[$event])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown event. Use ?list to see available events.']);
        exit;
    }
    
    echo json_encode(getCachedOrFetch($event, $forceRefresh), JSON_PRETTY_PRINT);
    exit;
}

// Default: show API info
echo json_encode([
    'name' => 'Track & Field Records API',
    'version' => '2.0',
    'endpoints' => [
        '?list' => 'List all available events',
        '?event=EVENT_CODE' => 'Get data for specific event',
        '?event=EVENT_CODE&refresh=1' => 'Force refresh cache for event',
        '?update_all=1' => 'Update all events (for cron job)'
    ],
    'events' => array_keys($EVENTS)
], JSON_PRETTY_PRINT);
