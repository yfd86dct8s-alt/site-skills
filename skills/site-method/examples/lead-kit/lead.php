<?php
// GEMCAP - lead intake for the cPanel host (CSC-Webhost-001). PHP port of site/functions/api/lead.js (the Cloudflare Pages
// Function): the site's three forms (quote, contact, driver pre-qualification) POST to /api/lead (rewritten to this file by
// public_html/api/.htaccess); each lead goes out as ONE email through Resend's HTTPS API (this server cannot deliver mail to
// Google, so mail()/SMTP are never used), same layout, labels, subject and attribution lines as lead.js.
//
// Differences from lead.js, all deliberate:
//   - Every real lead is first written to a private spool OUTSIDE public_html (leads-YYYY-MM.jsonl + the resume file), then
//     sent. If Resend fails, the lead is still safe: the visitor gets {ok:true,queued:true} and `php lead.php --replay`
//     (cron) sends it later. The form gets an error only when the spool AND Resend both fail.
//   - Idempotency-Key on the Resend call, so a replay never alerts the same lead twice.
//   - Per-IP limit: RATE_PER_HOUR (default 30) real leads per IP per hour, else 429 {ok:false,error:'rate'} (logged, never silent).
//   - Multi-line subject/name values are collapsed to one line.
//   - A test request (X-Lead-Test) with no valid TEST_TO is refused (503) instead of falling back to the real inbox.
//   - Cloudflare Turnstile (when TURNSTILE_SECRET is set): every final submit must carry a token siteverify accepts, else
//     400 {ok:false,error:'verify'}. Fails open when siteverify cannot be reached (see gem_turnstile).
//   - CallTrackingMetrics (when CTM_FORM_ID + CTM_ACCESS_KEY + CTM_SECRET_KEY are set): after the email, each accepted lead
//     with a US phone is also POSTed to the CTM FormReactor, after the visitor's answer is flushed (see gem_ctm).
//
// Config: NOT in this folder. ~/gemcap-config/config.php (two levels above public_html/api/), see config.example.php.
// Keys: RESEND_API_KEY, LEAD_TO, LEAD_FROM, TEST_TOKEN, TEST_TO (+ optional RESEND_API_URL, SPOOL_DIR, TURNSTILE_SECRET, CTM_*).
// Partial leads (quote step 1, no contact details yet) are acknowledged and not emailed or spooled.
// PHP 7.4+ / 8.x. No mbstring needed. Nothing here ever prints an error, a path or a key to a visitor.

const GEM_FORMS = array('quote' => 'Quote request', 'contact' => 'Website message', 'driver-prequal' => 'Driver pre-qualification');
const GEM_LABELS = array(
  'need' => 'What do you need?', 'pickup' => 'Pickup (city, state or ZIP)', 'delivery' => 'Delivery (city, state or ZIP)', 'ready' => 'Ready date',
  'what' => 'What is it?', 'equipment' => 'Equipment', 'hazmat' => 'Hazmat', 'name' => 'Name', 'company' => 'Company', 'email' => 'Email',
  'phone' => 'Phone', 'notes' => 'Notes', 'topic' => 'Topic', 'message' => 'Message', 'first_name' => 'First name', 'last_name' => 'Last name',
  'home_phone' => 'Home phone', 'state' => 'State', 'zip' => 'ZIP', 'drive_as' => 'Driver type', 'experience' => 'Experience',
  'accidents' => 'Accidents (3 years)', 'violations' => 'Moving violations (3 years)', 'twic' => 'TWIC card', 'resume' => 'Resume',
  'sms_consent' => 'SMS consent', 'lp' => 'Landing page',
);
const GEM_ALLOWED_HOSTS = array(
  '/^gemcap-preview\.pages\.dev$/', '/\.gemcap-preview\.pages\.dev$/', '/^(www\.)?gemcaptrucking\.com$/', '/^localhost$/', '/^127\.0\.0\.1$/',
);
const GEM_MAX_FILE = 5 * 1024 * 1024;
const GEM_FILE_OK = '/\.(pdf|docx?|rtf|txt|odt|jpe?g|png)$/i';
const GEM_DEFAULT_TO = 'info@gemcaptrucking.com';
const GEM_DEFAULT_FROM = 'GEMCAP Website <alerts@marketingcartel.com>';
// The visitor's confirmation email (Erick 2026-10-22). Sender: gemcaptrucking.com once Resend has verified it (config
// AUTOREPLY_FROM), marketingcartel.com until then. Replies go to GEMCAP (AUTOREPLY_REPLY_TO, default: the first LEAD_TO).
const GEM_DEFAULT_AUTOREPLY_FROM = 'GEMCAP Trucking <noreply@marketingcartel.com>';
const GEM_PHONE = '305-551-5626';
const GEM_SITE = 'https://gemcaptrucking.com';
// Cloudflare's edge ranges (cloudflare.com/ips, 2026-10-22). Since 2026-10-22 the site sits behind Cloudflare's proxy: a
// request from one of these carries the visitor in CF-Connecting-IP; from any other address that header is ignored.
const GEM_CF_RANGES = array(
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20',
  '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
);

// ---- small helpers (ports of esc / clean / nice) ---------------------------------------------------------------------------
function gem_esc($s) { return strtr((string)$s, array('&' => '&amp;', '<' => '&lt;', '>' => '&gt;', '"' => '&quot;', "'" => '&#39;')); }
function gem_str($v) { return (is_string($v) || is_int($v) || is_float($v)) ? (string)$v : ''; }   // lead.js String(x ?? '') for scalars
function gem_clean($s) {
  $s = trim(preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', '', gem_str($s)));
  if (function_exists('mb_substr')) return mb_substr($s, 0, 4000, 'UTF-8');
  return preg_match('/^.{0,4000}/su', $s, $m) ? $m[0] : substr($s, 0, 4000);
}
function gem_slice($s, $n) { return function_exists('mb_substr') ? mb_substr($s, 0, $n, 'UTF-8') : substr($s, 0, $n); }
function gem_nice($v) { $v = str_replace('-', ' ', (string)$v); return preg_match('/^\w/', $v) ? ucfirst($v) : $v; }
function gem_one_line($s) { return trim(preg_replace('/[\r\n\t]+/', ' ', (string)$s)); }
function gem_truthy($v) { return !($v === null || $v === false || $v === 0 || $v === 0.0 || $v === ''); }   // JS truthiness for decoded JSON
function gem_valid_email($e) { return is_string($e) && preg_match('/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/u', $e) === 1 && strlen($e) <= 254; }

// ---- errors: logged, never shown ---------------------------------------------------------------------------------------------
function gem_boot() {
  @ini_set('display_errors', '0'); @ini_set('display_startup_errors', '0'); @ini_set('html_errors', '0'); @ini_set('log_errors', '1');
  error_reporting(E_ALL);
  set_error_handler(function ($no, $msg, $file, $line) {
    if (!(error_reporting() & $no)) return true;
    gem_log('php-errors', 'php ' . $no . ': ' . $msg . ' at ' . basename($file) . ':' . $line);
    return true;
  });
  set_exception_handler(function ($e) {
    gem_log('php-errors', 'uncaught ' . get_class($e) . ': ' . $e->getMessage() . ' at ' . basename($e->getFile()) . ':' . $e->getLine());
    if (!headers_sent()) gem_respond(503, array('ok' => false, 'error' => 'unavailable'));
    exit;
  });
}

// ---- config (outside the web root) -----------------------------------------------------------------------------------------
function gem_config_path() {
  $env = getenv('GEMCAP_CONFIG');
  if (!$env && isset($_SERVER['GEMCAP_CONFIG'])) $env = $_SERVER['GEMCAP_CONFIG'];
  if (!$env && isset($_SERVER['REDIRECT_GEMCAP_CONFIG'])) $env = $_SERVER['REDIRECT_GEMCAP_CONFIG'];
  return $env ? $env : dirname(__DIR__, 2) . '/gemcap-config/config.php';   // ~/public_html/api/lead.php -> ~/gemcap-config/config.php
}
function gem_config() {
  static $cfg = false;
  if ($cfg !== false) return $cfg;
  $cfg = null;
  $file = gem_config_path();
  if (!is_file($file) || !is_readable($file)) return null;
  $c = include $file;
  if (!is_array($c)) return null;
  $c = array_merge(array(
    'RESEND_API_KEY' => '', 'LEAD_TO' => GEM_DEFAULT_TO, 'LEAD_FROM' => GEM_DEFAULT_FROM, 'TEST_TOKEN' => '', 'TEST_TO' => '',
    'RESEND_API_URL' => 'https://api.resend.com/emails', 'SPOOL_DIR' => dirname($file) . '/spool', 'RATE_PER_HOUR' => 30, 'TRUST_PROXY_HEADERS' => false,
    'AUTOREPLY' => true, 'AUTOREPLY_FROM' => GEM_DEFAULT_AUTOREPLY_FROM, 'AUTOREPLY_REPLY_TO' => '', 'AUTOREPLY_PER_DAY' => 30,
    'TURNSTILE_SECRET' => '', 'TURNSTILE_VERIFY_URL' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'CTM_FORM_ID' => '', 'CTM_ACCESS_KEY' => '', 'CTM_SECRET_KEY' => '', 'CTM_SEND_TESTS' => false, 'CTM_API_URL' => '',
  ), $c);
  $c['TRUST_PROXY_HEADERS'] = !empty($c['TRUST_PROXY_HEADERS']);
  $c['AUTOREPLY'] = !empty($c['AUTOREPLY']);
  // set-config.mjs writes every value as a string: 'false' / '0' / '' must mean off
  $c['CTM_SEND_TESTS'] = $c['CTM_SEND_TESTS'] === true || in_array(strtolower(trim(gem_str($c['CTM_SEND_TESTS']))), array('1', 'true', 'yes', 'on'), true);
  foreach (array('RESEND_API_KEY', 'LEAD_TO', 'LEAD_FROM', 'TEST_TOKEN', 'TEST_TO', 'RESEND_API_URL', 'SPOOL_DIR', 'RATE_PER_HOUR', 'AUTOREPLY_FROM', 'AUTOREPLY_REPLY_TO', 'TURNSTILE_SECRET', 'TURNSTILE_VERIFY_URL', 'CTM_FORM_ID', 'CTM_ACCESS_KEY', 'CTM_SECRET_KEY', 'CTM_API_URL') as $k) {
    if (is_array($c[$k])) $c[$k] = implode(',', $c[$k]);   // LEAD_TO / TEST_TO may be written as an array
    $c[$k] = trim((string)$c[$k]);
  }
  $cfg = $c;
  return $cfg;
}
// the sending key must be set and not still the placeholder from config.example.php
function gem_key_ok($cfg) { return $cfg && $cfg['RESEND_API_KEY'] !== '' && stripos($cfg['RESEND_API_KEY'], 'change') === false; }
function gem_recipients($csv) {
  $out = array();
  foreach (explode(',', (string)$csv) as $a) { $a = trim($a); if ($a !== '' && gem_valid_email($a)) $out[] = $a; }
  return $out;
}

// ---- spool + logs (private, outside public_html) ---------------------------------------------------------------------------
function gem_spool_dir($cfg) {
  $dir = rtrim($cfg['SPOOL_DIR'], '/\\');
  if ($dir === '') return null;
  if (!is_dir($dir) && !@mkdir($dir, 0700, true)) return null;
  return is_writable($dir) ? $dir : null;
}
function gem_log($name, $line) {
  $cfg = gem_config();
  $dir = $cfg ? gem_spool_dir($cfg) : null;
  $msg = gmdate('c') . ' ' . preg_replace('/[\r\n]+/', ' ', $line) . "\n";   // ids and status codes only, never lead data
  if ($dir) { @file_put_contents($dir . '/' . $name . '.log', $msg, FILE_APPEND | LOCK_EX); return; }
  @error_log('[gemcap-lead] ' . trim($msg));
}
function gem_append($file, $record) {
  $line = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
  if ($line === false) return false;
  $line .= "\n";
  $new = !is_file($file);
  $fh = @fopen($file, 'ab');
  if (!$fh) return false;
  $ok = false;
  if (@flock($fh, LOCK_EX)) {
    $n = fwrite($fh, $line);
    $ok = ($n === strlen($line)) && fflush($fh);
    if ($ok && function_exists('fsync')) $ok = @fsync($fh);
    flock($fh, LOCK_UN);
  }
  fclose($fh);
  if ($new) @chmod($file, 0600);
  return $ok;
}
function gem_uuid() {
  $b = random_bytes(16);
  $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
  $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

// ---- responses (never cached: Cache-Control for browsers, X-Accel-Expires for the NGINX proxy cache in front of Apache) ---------
// $after (optional): work done once the answer has left (the CTM relay). The visitor's answer is the same either way.
function gem_respond($status, $data, $after = null) {
  http_response_code($status);
  header('Content-Type: application/json');
  header('Cache-Control: no-store');
  header('Pragma: no-cache');
  header('X-Accel-Expires: 0');
  $out = json_encode($data);
  if (!is_callable($after)) { echo $out; exit; }
  ignore_user_abort(true);
  header('Content-Length: ' . strlen($out));
  echo $out;
  if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();        // PHP-FPM: the visitor is answered now
  elseif (function_exists('litespeed_finish_request')) litespeed_finish_request();
  else { while (ob_get_level() > 0) @ob_end_flush(); flush(); }                    // else inline, bounded by short timeouts
  $after();
  exit;
}
function gem_ini_bytes($v) {
  $v = trim((string)$v);
  if ($v === '') return 0;
  $n = (float)$v;
  switch (strtolower(substr($v, -1))) { case 'g': $n *= 1073741824; break; case 'm': $n *= 1048576; break; case 'k': $n *= 1024; break; }
  return (int)$n;
}

// ---- per-IP rate limit: RATE_PER_HOUR (default 30, 0 = off) leads per IP per hour, a small file per visitor under spool/rate/ ----
// The visitor: REMOTE_ADDR. On CSC-Webhost-001 the NGINX proxy hands Apache the real client there (checked on the server
// 2026-10-21: REMOTE_ADDR = X-Real-IP = the visitor). The proxy headers are only read with TRUST_PROXY_HEADERS (a proxy in
// front that does not set REMOTE_ADDR, or the local tests): a visitor can type any value into them, so trusting them by
// default would let a spammer reset the limit on every request. Only a hash of the address is stored. IPv6 counts by its
// /64. Fails open (a broken limiter never loses a lead).
// Behind Cloudflare (2026-10-22) REMOTE_ADDR is a Cloudflare edge shared by many visitors: when REMOTE_ADDR is inside
// GEM_CF_RANGES, CF-Connecting-IP (set by Cloudflare, cannot be forged through it) is the visitor.
function gem_in_cidr($ip, $cidr) {
  list($net, $bits) = explode('/', $cidr);
  $a = @inet_pton($ip); $b = @inet_pton($net);
  if ($a === false || $b === false || strlen($a) !== strlen($b)) return false;
  $bits = (int)$bits; $bytes = intdiv($bits, 8); $rest = $bits % 8;
  if ($bytes && substr($a, 0, $bytes) !== substr($b, 0, $bytes)) return false;
  if (!$rest) return true;
  $mask = (0xFF << (8 - $rest)) & 0xFF;
  return (ord($a[$bytes]) & $mask) === (ord($b[$bytes]) & $mask);
}
function gem_from_cloudflare($ip) {
  foreach (GEM_CF_RANGES as $r) if (gem_in_cidr($ip, $r)) return true;
  return false;
}
// The visitor's address as the rules above pick it ('' if none is valid). Also sent to Turnstile's siteverify (remoteip).
function gem_client_ip() {
  $cfg = gem_config();
  $remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');
  $hdrs = ($cfg && $cfg['TRUST_PROXY_HEADERS']) ? array('HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR')
    : (gem_from_cloudflare($remote) ? array('HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR') : array('REMOTE_ADDR'));
  foreach ($hdrs as $h) {
    if (empty($_SERVER[$h])) continue;
    $c = trim(explode(',', (string)$_SERVER[$h])[0]);
    if (filter_var($c, FILTER_VALIDATE_IP)) return $c;
  }
  return '';
}
function gem_client_key() {
  $ip = gem_client_ip();
  $bin = $ip !== '' ? @inet_pton($ip) : false;
  if ($bin !== false && strlen($bin) === 16) $ip = bin2hex(substr($bin, 0, 8)) . '/64';
  return sha1('gemcap|' . ($ip !== '' ? $ip : 'unknown'));
}
// Records this lead and returns 0 when allowed, else the seconds until the oldest one in the window expires.
function gem_rate_hit($cfg, $dir) {
  $limit = (int)$cfg['RATE_PER_HOUR'];
  if ($limit <= 0 || !$dir) return 0;
  $rd = $dir . '/rate';
  if (!is_dir($rd) && !@mkdir($rd, 0700, true)) return 0;
  $file = $rd . '/' . gem_client_key() . '.txt';
  $fh = @fopen($file, 'c+');
  if (!$fh) return 0;
  $wait = 0;
  if (flock($fh, LOCK_EX)) {
    $now = time();
    $ts = array();
    foreach (explode("\n", (string)stream_get_contents($fh)) as $t) { $t = (int)$t; if ($t > $now - 3600) $ts[] = $t; }
    if (count($ts) >= $limit) $wait = max(1, min($ts) + 3600 - $now);
    else $ts[] = $now;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, implode("\n", $ts) . "\n"); fflush($fh);
    flock($fh, LOCK_UN);
  }
  fclose($fh);
  @chmod($file, 0600);
  if (mt_rand(1, 50) === 1) { foreach (glob($rd . '/*.txt') ?: array() as $f) if (@filemtime($f) < time() - 7200) @unlink($f); }
  return $wait;
}

// ---- Resend ----------------------------------------------------------------------------------------------------------------
// https only; plain http only to a loopback stub (the local tests)
function gem_url_ok($url) { return preg_match('#^https://#i', $url) || preg_match('#^http://(127\.0\.0\.1|localhost)(:\d+)?/#i', $url); }
// One POST (cURL, else streams). Returns array(http status, body | false, short error text).
function gem_post($url, $content, $headers, $connect, $timeout) {
  $status = 0;
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(CURLOPT_POST => true, CURLOPT_POSTFIELDS => $content, CURLOPT_HTTPHEADER => $headers,
      CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => $connect, CURLOPT_TIMEOUT => $timeout, CURLOPT_FOLLOWLOCATION => false));
    $resp = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($resp === false) return array(0, false, 'curl: ' . substr($err, 0, 120));
  } else {
    $ctx = stream_context_create(array('http' => array('method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $content,
      'timeout' => $timeout, 'ignore_errors' => true, 'follow_location' => 0)));
    $resp = @file_get_contents($url, false, $ctx);
    if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0] . ' ', $m)) $status = (int)$m[1];
    if ($resp === false) return array($status, false, 'stream request failed');
  }
  return array($status, $resp, '');
}
// POST the message. Returns array(ok, http status, resend id | short error text). The key is never logged.
function gem_resend($cfg, $body, $idemKey) {
  $url = $cfg['RESEND_API_URL'];
  if (!gem_url_ok($url)) return array(false, 0, 'bad url (https only)');
  $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
  if ($json === false) return array(false, 0, 'json encode failed');
  $headers = array('Authorization: Bearer ' . $cfg['RESEND_API_KEY'], 'Content-Type: application/json', 'Idempotency-Key: ' . $idemKey, 'User-Agent: gemcap-cpanel-lead/1');
  list($status, $resp, $err) = gem_post($url, $json, $headers, 6, 15);
  if ($resp === false) return array(false, $status, $err);
  $j = json_decode((string)$resp, true);
  if ($status >= 200 && $status < 300 && is_array($j) && isset($j['id'])) return array(true, $status, (string)$j['id']);
  $msg = is_array($j) && isset($j['message']) ? (string)$j['message'] : 'http ' . $status;
  return array(false, $status, substr(gem_one_line($msg), 0, 160));
}

// ---- Cloudflare Turnstile (the forms' bot check, on when TURNSTILE_SECRET is set) -------------------------------------------
// The final submit of each form carries `turnstile` (the widget's token; in the multipart `lead` JSON for the driver form).
// Partial steps and X-Lead-Test requests are never checked. siteverify gets the secret, the token and the visitor IP
// (gem_client_ip: the visitor the rate limit counts). Returns array(verdict, reason): verdict 'ok', 'refused' (no token,
// Cloudflare said no, or another hostname) or 'unreachable' (cannot be reached, 5 s timeout, not JSON, or an error on OUR
// side: our secret refused, Cloudflare's internal error). 'unreachable' lets the lead through: a lead is never lost to our
// own dependency. Cloudflare's test secrets (1x/2x/3x000...AA) answer hostname "example.com": no hostname check for them.
// Reasons are Cloudflare's error codes or a status, never the token.
const GEM_TS_OURS = array('internal-error', 'invalid-input-secret', 'missing-input-secret');
function gem_turnstile($cfg, $token) {
  $token = is_string($token) ? trim($token) : '';
  if ($token === '') return array('refused', 'no token');
  if (strlen($token) > 2048) return array('refused', 'token too long');
  $url = $cfg['TURNSTILE_VERIFY_URL'];
  if (!gem_url_ok($url)) return array('unreachable', 'bad url (https only)');
  $q = array('secret' => $cfg['TURNSTILE_SECRET'], 'response' => $token);
  $ip = gem_client_ip();
  if ($ip !== '') $q['remoteip'] = $ip;
  list($status, $resp, $err) = gem_post($url, http_build_query($q), array('Content-Type: application/x-www-form-urlencoded', 'User-Agent: gemcap-cpanel-lead/1'), 3, 5);
  if ($resp === false) return array('unreachable', $err);
  $j = json_decode((string)$resp, true);
  if (!is_array($j) || !array_key_exists('success', $j)) return array('unreachable', 'not json (http ' . $status . ')');
  $codes = isset($j['error-codes']) && is_array($j['error-codes']) ? array_values(array_filter($j['error-codes'], 'is_string')) : array();
  $codeText = substr(preg_replace('/[^a-z0-9,-]/', '', strtolower(implode(',', $codes))), 0, 120);
  if ($j['success'] !== true) {
    if (array_intersect($codes, GEM_TS_OURS)) return array('unreachable', $codeText);
    return array('refused', $codeText !== '' ? $codeText : 'success false');
  }
  if (!preg_match('/^[123]x0{20,}[A-Za-z]{2}$/', $cfg['TURNSTILE_SECRET'])) {
    $host = strtolower(gem_str($j['hostname'] ?? ''));
    $ok = false;
    foreach (GEM_ALLOWED_HOSTS as $re) if (preg_match($re, $host)) { $ok = true; break; }
    if (!$ok) return array('refused', 'hostname');
  }
  return array('ok', 'ok');
}

// ---- the email (same layout, labels, subject and attribution lines as lead.js) ---------------------------------------------
function gem_touch($t) {
  if (!is_array($t)) return '';
  $g = function ($k) use ($t) { return isset($t[$k]) ? gem_str($t[$k]) : ''; };
  $parts = array(
    $g('channel'),
    $g('utm_source') !== '' ? 'source ' . $g('utm_source') : '',
    $g('utm_medium') !== '' ? 'medium ' . $g('utm_medium') : '',
    $g('utm_campaign') !== '' ? 'campaign ' . $g('utm_campaign') : '',
    ($g('gclid') !== '' || $g('gbraid') !== '' || $g('wbraid') !== '') ? 'Google Ads click' : '',
    $g('fbclid') !== '' ? 'Meta ad click' : '',
    $g('landing') !== '' ? 'landed on ' . $g('landing') : '',
    $g('referrer') !== '' ? 'from ' . $g('referrer') : '',
  );
  $out = array();
  foreach ($parts as $p) if ($p !== '') $out[] = gem_clean($p);
  return implode(' · ', $out);
}
function gem_table($list) {
  $h = '';
  foreach ($list as $r) {
    $h .= '<tr><td style="padding:8px 12px 8px 0;color:#4A5A78;vertical-align:top;white-space:nowrap">' . gem_esc($r[0]) .
      '</td><td style="padding:8px 0;color:#0B1F44;white-space:pre-wrap">' . gem_esc($r[1]) . '</td></tr>';
  }
  return $h;
}
// $lead: decoded request; returns array(form, f, email, rows, meta). Throws nothing; caller has validated.
function gem_compose($cfg, $form, $f, $email, $lead, $fileName, $test) {
  $who = $form === 'driver-prequal'
    ? implode(' ', array_values(array_filter(array(isset($f['first_name']) ? $f['first_name'] : '', isset($f['last_name']) ? $f['last_name'] : ''), 'strlen')))
    : (isset($f['name']) ? $f['name'] : '');
  $who = gem_one_line($who);
  $phone = isset($f['phone']) ? $f['phone'] : '';
  $subject = GEM_FORMS[$form] . ': ' . ($who !== '' ? $who : ($email !== '' ? $email : $phone))
    . (!empty($f['company']) ? ' (' . $f['company'] . ')' : '')
    . ($form === 'contact' && !empty($f['topic']) ? ' · ' . gem_nice($f['topic']) : '');
  $subject = gem_one_line($subject);
  $rows = array();
  foreach ($f as $k => $v) {
    $k = (string)$k;
    $rows[] = array(isset(GEM_LABELS[$k]) ? GEM_LABELS[$k] : gem_nice($k), preg_match('/^(drive_as|twic|hazmat|need|topic|equipment)$/', $k) ? gem_nice($v) : $v);
  }
  if ($fileName !== null) $rows[] = array('Resume file', $fileName . ' (attached)');

  $a = isset($lead['attribution']) && is_array($lead['attribution']) ? $lead['attribution'] : array();
  $meta = array();
  foreach (array(array('Sent from page', gem_clean(isset($lead['page']) ? $lead['page'] : '')),
    array('First visit', gem_touch(isset($a['first']) ? $a['first'] : null)), array('This visit', gem_touch(isset($a['last']) ? $a['last'] : null))) as $r) {
    if ($r[1] !== '') $meta[] = $r;
  }
  $title = GEM_FORMS[$form];
  $html = '<div style="font:15px/1.5 Arial,sans-serif;color:#0B1F44;max-width:640px">' . "\n"
    . '<h2 style="margin:0 0 4px;font-size:20px">' . gem_esc($title) . '</h2>' . "\n"
    . '<p style="margin:0 0 16px;color:#4A5A78">New lead from the GEMCAP website.' . ($email !== '' ? ' Reply to this email to answer the sender directly.' : '') . '</p>' . "\n"
    . '<table style="border-collapse:collapse;width:100%">' . gem_table($rows) . '</table>' . "\n"
    . '<p style="margin:24px 0 6px;font-size:13px;color:#4A5A78"><b>Where this lead came from</b></p>' . "\n"
    . '<table style="border-collapse:collapse;width:100%;font-size:13px">' . gem_table($meta) . '</table></div>';
  $lines = function ($list) { $o = array(); foreach ($list as $r) $o[] = $r[0] . ': ' . $r[1]; return implode("\n", $o); };
  $text = $title . " - new lead from the GEMCAP website\n\n" . $lines($rows) . "\n\nWhere this lead came from\n" . $lines($meta);

  $to = $test ? gem_recipients($cfg['TEST_TO']) : gem_recipients($cfg['LEAD_TO']);
  if (!$to && !$test) $to = array(GEM_DEFAULT_TO);
  $body = array('from' => $cfg['LEAD_FROM'] !== '' ? $cfg['LEAD_FROM'] : GEM_DEFAULT_FROM, 'to' => $to,
    'subject' => ($test ? '[TEST] ' : '') . $subject, 'html' => $html, 'text' => $text);
  if ($email !== '') $body['reply_to'] = $who !== '' ? preg_replace('/[<>",]/', '', $who) . ' <' . $email . '>' : $email;
  return $body;
}

// ---- the visitor's confirmation (autoreply) ----------------------------------------------------------------------------------
// Fixed text per form, the thank-you pages' own words. Nothing the visitor typed goes in it except a first name made of
// letters only, so the form cannot be used to mail someone else a message of the sender's choosing. At most one per
// address per 24 h (spool/autoreply/<hash>), on top of the per-IP limit. Best effort: never changes the form's answer.
function gem_autoreply_compose($form, $f) {
  $raw = $form === 'driver-prequal' ? (isset($f['first_name']) ? $f['first_name'] : '') : (isset($f['name']) ? preg_split('/\s+/', trim($f['name']))[0] : '');
  $first = preg_match("/^\\p{L}[\\p{L}'-]{0,29}$/u", (string)$raw) ? $raw : '';   // no dots: "site.com" would be linked
  $hi = $first !== '' ? 'Hi ' . $first . ',' : 'Hello,';
  if ($form === 'driver-prequal') {
    $subject = 'We received your application | GEMCAP®';
    $lead = 'Thanks for applying to drive with GEMCAP®. A member of our Driver Recruiting team will review your information and contact you regarding the next steps.';
    $steps = array(array('We review it', 'Recruiting reads your pre-qualification answers.'),
      array('We call you', 'A recruiter talks you through the program that fits you.'),
      array('You get on the road', 'Complete your DOT application and onboarding.'));
    $close = 'Questions before we call? Call us at ' . GEM_PHONE . '.';
  } else {
    $subject = ($form === 'quote' ? 'We received your quote request' : 'We received your message') . ' | GEMCAP®';
    $lead = ($form === 'quote' ? 'Thanks for your quote request.' : 'Thanks for your message.') . ' A member of our team reviews every request and replies by phone or email.';
    $steps = array(array('We review it', 'Every quote request and message is read by our team.'),
      array('We get in touch', 'A dispatcher calls or emails you back.'),
      array('We take it from there', $form === 'quote' ? 'A price and a plan for your lane.' : 'The answer you asked for.'));
    $close = 'Need it faster? Call 24/7 dispatch at ' . GEM_PHONE . '.';
  }
  $foot = 'GEMCAP® Trucking + Logistics · gemcaptrucking.com';
  $note = 'This is an automatic confirmation. To add anything to your request, just reply to this email.';
  $li = '';
  foreach ($steps as $i => $s) $li .= '<tr><td style="padding:6px 12px 6px 0;vertical-align:top;font-weight:bold;color:#0B1F44">' . ($i + 1) . '.</td><td style="padding:6px 0"><b>' . gem_esc($s[0]) . '</b><br>' . gem_esc($s[1]) . '</td></tr>';
  $html = '<div style="font:15px/1.55 Arial,sans-serif;color:#0B1F44;max-width:560px">' . "\n"
    . '<p style="margin:0 0 14px">' . gem_esc($hi) . '</p>' . "\n"
    . '<p style="margin:0 0 18px">' . gem_esc($lead) . '</p>' . "\n"
    . '<p style="margin:0 0 6px;font-weight:bold">What happens next</p>' . "\n"
    . '<table style="border-collapse:collapse;margin:0 0 18px">' . $li . '</table>' . "\n"
    . '<p style="margin:0 0 18px">' . gem_esc($close) . '</p>' . "\n"
    . '<p style="margin:0;color:#4A5A78;font-size:13px">' . gem_esc($foot) . '<br>' . gem_esc($note) . '</p></div>';
  $text = $hi . "\n\n" . $lead . "\n\nWhat happens next\n";
  foreach ($steps as $i => $s) $text .= ($i + 1) . '. ' . $s[0] . ': ' . $s[1] . "\n";
  $text .= "\n" . $close . "\n\n" . $foot . "\n" . GEM_SITE . "\n" . $note . "\n";
  return array('subject' => $subject, 'html' => $html, 'text' => $text);
}
// The Resend account is shared with other sites (free plan: 100 emails a day) and lead alerts come first: at most
// AUTOREPLY_PER_DAY confirmations per UTC day from this site (0 = none). Fails closed: no counter, no confirmation.
function gem_autoreply_quota($dir, $limit) {
  if ($limit <= 0 || !$dir) return false;
  $ad = $dir . '/autoreply';
  if (!is_dir($ad) && !@mkdir($ad, 0700, true)) return false;
  $fh = @fopen($ad . '/day-' . gmdate('Y-m-d') . '.count', 'c+');
  if (!$fh) return false;
  $ok = false;
  if (flock($fh, LOCK_EX)) {
    $n = (int)stream_get_contents($fh);
    if ($n < $limit) { $ok = true; ftruncate($fh, 0); rewind($fh); fwrite($fh, (string)($n + 1)); fflush($fh); }
    flock($fh, LOCK_UN);
  }
  fclose($fh);
  foreach (glob($ad . '/day-*.count') ?: array() as $g) if (@filemtime($g) < time() - 3 * 86400) @unlink($g);
  return $ok;
}
// true when this address got no confirmation in the last 24 h (and records this one); fails open
function gem_autoreply_due($dir, $email) {
  if (!$dir) return true;
  $ad = $dir . '/autoreply';
  if (!is_dir($ad) && !@mkdir($ad, 0700, true)) return true;
  $file = $ad . '/' . sha1('gemcap|' . strtolower($email)) . '.txt';
  $last = is_file($file) ? (int)@file_get_contents($file) : 0;
  if ($last > time() - 86400) return false;
  @file_put_contents($file, (string)time()); @chmod($file, 0600);
  if (mt_rand(1, 50) === 1) { foreach (glob($ad . '/*.txt') ?: array() as $g) if (@filemtime($g) < time() - 172800) @unlink($g); }
  return true;
}
function gem_autoreply($cfg, $form, $f, $email, $test, $id) {
  if (!$cfg['AUTOREPLY'] || $email === '' || !gem_valid_email($email)) return;
  $to = $test ? gem_recipients($cfg['TEST_TO']) : array($email);   // a test never mails the address typed in the form
  if (!$to) return;
  if (!$test && !gem_autoreply_due(gem_spool_dir($cfg), $email)) { gem_log('relay', 'autoreply skipped (sent to this address < 24 h ago) lead ' . $id); return; }
  if (!$test && !gem_autoreply_quota(gem_spool_dir($cfg), (int)$cfg['AUTOREPLY_PER_DAY'])) { gem_log('relay', 'autoreply skipped (AUTOREPLY_PER_DAY reached: lead alerts keep the shared quota) lead ' . $id); return; }
  $m = gem_autoreply_compose($form, $f);
  $replyTo = gem_recipients($cfg['AUTOREPLY_REPLY_TO'] !== '' ? $cfg['AUTOREPLY_REPLY_TO'] : $cfg['LEAD_TO']);
  $body = array('from' => $cfg['AUTOREPLY_FROM'] !== '' ? $cfg['AUTOREPLY_FROM'] : GEM_DEFAULT_AUTOREPLY_FROM, 'to' => $to,
    'subject' => ($test ? '[TEST] ' : '') . $m['subject'], 'html' => $m['html'], 'text' => $m['text'],
    'reply_to' => $replyTo ? $replyTo[0] : GEM_DEFAULT_TO);
  $r = gem_resend($cfg, $body, 'ack-' . $id);
  gem_log('relay', ($r[0] ? 'autoreply sent' : 'autoreply FAILED (' . $r[1] . ' ' . $r[2] . ')') . ' lead ' . $id . ($test ? ' (test)' : '') . ($r[0] ? ' resend ' . $r[2] : ''));
}

// ---- CallTrackingMetrics FormReactor (ready to connect: off until CTM_FORM_ID, CTM_ACCESS_KEY and CTM_SECRET_KEY are set) ----
// The client's CTM shows calls; this puts each accepted form lead next to them, tied to the visitor's CTM session (ctm_sid,
// sent by forms.js from CTM's own tracker) so CTM credits the lead's source. Runs only AFTER the lead email (the email and the
// visitor's answer are first and authoritative), after the answer is flushed when the server allows it. Request:
//   POST https://api.calltrackingmetrics.com/api/v1/formreactor/<CTM_FORM_ID>, HTTP Basic CTM_ACCESS_KEY:CTM_SECRET_KEY,
//   JSON {phone_number (10 digits), country_code "1", caller_name, email, visitor_sid, custom_<snake label>...}.
// Custom fields (created on the FormReactor with these labels): Form Type, Landing Page, Sent From Page, Request Summary.
// Never sent: the resume, notes/message beyond the 500-character summary, sms_consent, the Turnstile token.
// A lead with no usable US phone is skipped (FormReactor requires phone_number); test leads only with CTM_SEND_TESTS.
// Any failure: one relay.log line with the status only + the lead id in spool/ctm-retry.jsonl. Never keys or lead data in logs.
const GEM_CTM_URL = 'https://api.calltrackingmetrics.com/api/v1/formreactor/';
function gem_ctm_on($cfg) { return $cfg && $cfg['CTM_FORM_ID'] !== '' && $cfg['CTM_ACCESS_KEY'] !== '' && $cfg['CTM_SECRET_KEY'] !== ''; }
// CTM_API_URL (a base ending in /) is honoured only for a loopback stub (the local tests); anything else -> CTM's real URL
function gem_ctm_url($cfg) {
  $base = GEM_CTM_URL;
  if ($cfg['CTM_API_URL'] !== '' && preg_match('#^http://127\.0\.0\.1(:\d+)?/#', $cfg['CTM_API_URL'])) $base = rtrim($cfg['CTM_API_URL'], '/') . '/';
  return preg_match('/^[A-Za-z0-9_-]{1,128}$/', $cfg['CTM_FORM_ID']) ? $base . $cfg['CTM_FORM_ID'] : '';
}
// first $n characters, UTF-8 safe with or without mbstring
function gem_ctm_cut($s, $n) {
  if (function_exists('mb_substr')) return mb_substr($s, 0, $n, 'UTF-8');
  return preg_match('/^.{0,' . (int)$n . '}/su', $s, $m) ? $m[0] : substr($s, 0, $n);
}
// a US number as 10 digits (a leading 1 dropped), else ''
function gem_ctm_phone($v) {
  $d = preg_replace('/\D+/', '', gem_str($v));
  if (strlen($d) === 11 && $d[0] === '1') $d = substr($d, 1);
  return preg_match('/^[2-9]\d{9}$/', $d) ? $d : '';
}
// null when there is no usable phone; else the FormReactor fields (empty ones left out)
function gem_ctm_payload($form, $f, $email, $lead, $test) {
  $g = function ($k) use ($f) { return isset($f[$k]) ? gem_one_line($f[$k]) : ''; };
  $phone = gem_ctm_phone($g('phone'));
  if ($phone === '' && $form === 'driver-prequal') $phone = gem_ctm_phone($g('home_phone'));
  if ($phone === '') return null;
  $name = $form === 'driver-prequal' ? trim($g('first_name') . ' ' . $g('last_name')) : $g('name');
  $join = function ($parts) { return implode(' · ', array_values(array_filter($parts, 'strlen'))); };
  if ($form === 'quote') {
    $pu = $g('pickup'); $de = $g('delivery');
    $lane = $pu !== '' && $de !== '' ? $pu . ' to ' . $de : ($pu !== '' ? 'from ' . $pu : ($de !== '' ? 'to ' . $de : ''));
    $sum = $join(array($g('need') !== '' ? gem_nice($g('need')) : '', $lane, $g('ready') !== '' ? 'ready ' . $g('ready') : '', $g('equipment') !== '' ? gem_nice($g('equipment')) : ''));
  } elseif ($form === 'driver-prequal') {
    $sum = $join(array($g('state'), $g('experience'), $g('drive_as') !== '' ? gem_nice($g('drive_as')) : ''));
  } else {
    $sum = $join(array($g('topic') !== '' ? gem_nice($g('topic')) : '', $g('message')));
  }
  $sid = gem_str($lead['ctm_sid'] ?? '');
  $p = array(
    'phone_number' => $phone, 'country_code' => '1',
    'caller_name' => $name !== '' ? ($test ? '[TEST] ' : '') . gem_ctm_cut($name, 100) : '',
    'email' => $email !== '' && gem_valid_email($email) ? $email : '',
    'visitor_sid' => preg_match('/^[A-Za-z0-9]{8,64}$/', $sid) ? $sid : '',
    'custom_form_type' => $form,
    'custom_landing_page' => gem_ctm_cut($g('lp'), 100),
    'custom_sent_from_page' => gem_ctm_cut(gem_one_line(gem_clean(isset($lead['page']) ? $lead['page'] : '')), 200),
    'custom_request_summary' => gem_ctm_cut($sum, 500),
  );
  return array_filter($p, 'strlen');
}
// array(ok, http status). 2xx is success unless the body says {"status":"error"} or carries "error".
function gem_ctm_post($cfg, $url, $payload) {
  $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
  if ($json === false) return array(false, 0);
  $headers = array('Authorization: Basic ' . base64_encode($cfg['CTM_ACCESS_KEY'] . ':' . $cfg['CTM_SECRET_KEY']), 'Content-Type: application/json',
    'Accept: application/json', 'User-Agent: gemcap-cpanel-lead/1');
  list($status, $resp) = gem_post($url, $json, $headers, 3, 6);
  if ($resp === false || $status < 200 || $status >= 300) return array(false, $status);
  $j = json_decode((string)$resp, true);
  if (is_array($j) && (isset($j['error']) || (isset($j['status']) && $j['status'] === 'error'))) return array(false, $status);
  return array(true, $status);
}
function gem_ctm($cfg, $form, $f, $email, $lead, $test, $id) {
  if (!gem_ctm_on($cfg)) return;   // not connected: no call, no log line
  $status = 0;
  try {
    if ($test && !$cfg['CTM_SEND_TESTS']) { gem_log('relay', 'ctm skipped: test lead ' . $id); return; }
    $url = gem_ctm_url($cfg);
    if ($url === '') { gem_log('relay', 'ctm skipped: CTM_FORM_ID is not a form id, lead ' . $id); return; }
    $p = gem_ctm_payload($form, $f, $email, is_array($lead) ? $lead : array(), $test);
    if (!$p) { gem_log('relay', 'ctm skipped: no phone, lead ' . $id); return; }
    list($ok, $status) = gem_ctm_post($cfg, $url, $p);
    if ($ok) { gem_log('relay', 'ctm sent lead ' . $id . ' status ' . $status); return; }
  } catch (\Throwable $e) { $status = 0; }
  gem_log('relay', 'ctm FAILED lead ' . $id . ' status ' . $status);
  $dir = gem_spool_dir($cfg);
  if ($dir) gem_append($dir . '/ctm-retry.jsonl', array('id' => $id, 'at' => gmdate('c'), 'status' => $status));
}

// ---- the request -----------------------------------------------------------------------------------------------------------
function gem_handle() {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); gem_respond(405, array('ok' => false, 'error' => 'method')); }

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '') {
    $host = strtolower((string)parse_url($origin, PHP_URL_HOST));
    $ok = false;
    foreach (GEM_ALLOWED_HOSTS as $re) if (preg_match($re, $host)) { $ok = true; break; }
    if (!$ok) gem_respond(403, array('ok' => false, 'error' => 'origin'));
  }
  $clen = (float)($_SERVER['CONTENT_LENGTH'] ?? 0);
  if ($clen > GEM_MAX_FILE + 200000) gem_respond(413, array('ok' => false, 'error' => 'too large'));

  $file = null;   // array(name, tmp)
  $ctype = (string)($_SERVER['CONTENT_TYPE'] ?? '');
  if (stripos($ctype, 'multipart/form-data') !== false) {
    $pms = gem_ini_bytes(ini_get('post_max_size'));
    if (!$_POST && !$_FILES && $clen > 0 && $pms > 0 && $clen > $pms) gem_respond(413, array('ok' => false, 'error' => 'too large'));   // PHP dropped the body
    $raw = $_POST['lead'] ?? '';
    if (!is_string($raw)) gem_respond(400, array('ok' => false, 'error' => 'bad request'));
    $lead = json_decode($raw !== '' ? $raw : '{}', true);
    if (json_last_error() !== JSON_ERROR_NONE) gem_respond(400, array('ok' => false, 'error' => 'bad request'));
    $up = $_FILES['resume'] ?? null;
    if (is_array($up) && !is_array($up['error'] ?? null)) {
      $err = (int)$up['error'];
      if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE || $err === UPLOAD_ERR_PARTIAL) gem_respond(400, array('ok' => false, 'error' => 'file'));
      if ($err === UPLOAD_ERR_NO_TMP_DIR || $err === UPLOAD_ERR_CANT_WRITE || $err === UPLOAD_ERR_EXTENSION) {
        gem_log('php-errors', 'upload error ' . $err); gem_respond(503, array('ok' => false, 'error' => 'unavailable'));
      }
      if ($err === UPLOAD_ERR_OK && (int)$up['size'] > 0) {
        if ((int)$up['size'] > GEM_MAX_FILE || !preg_match(GEM_FILE_OK, (string)$up['name']) || !is_uploaded_file($up['tmp_name'])) gem_respond(400, array('ok' => false, 'error' => 'file'));
        $file = array('name' => gem_slice(preg_replace('/[^A-Za-z0-9_.\- ]/', '_', (string)$up['name']), 120), 'tmp' => $up['tmp_name']);
      }
    }
  } else {
    $in = @fopen('php://input', 'rb');
    $raw = $in ? stream_get_contents($in, GEM_MAX_FILE + 200001) : false;
    if ($in) fclose($in);
    if ($raw === false) gem_respond(400, array('ok' => false, 'error' => 'bad request'));
    if (strlen($raw) > GEM_MAX_FILE + 200000) gem_respond(413, array('ok' => false, 'error' => 'too large'));
    $lead = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) gem_respond(400, array('ok' => false, 'error' => 'bad request'));
  }

  $form = is_array($lead) && isset($lead['form']) && is_string($lead['form']) && isset(GEM_FORMS[$lead['form']]) ? $lead['form'] : null;
  if (!$form) gem_respond(400, array('ok' => false, 'error' => 'form'));
  if (gem_truthy($lead['partial'] ?? null)) gem_respond(200, array('ok' => true, 'partial' => true));
  $f = array();
  if (isset($lead['fields']) && is_array($lead['fields'])) {
    foreach ($lead['fields'] as $k => $v) if (is_string($v) && trim($v) !== '') $f[gem_slice(gem_clean((string)$k), 40)] = gem_clean($v);
  }
  $email = isset($f['email']) && preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $f['email']) ? $f['email'] : '';
  if ($email === '' && empty($f['phone'])) gem_respond(400, array('ok' => false, 'error' => 'contact'));

  $cfg = gem_config();
  if (!gem_key_ok($cfg)) gem_respond(503, array('ok' => false, 'error' => 'not configured'));

  $tok = $_SERVER['HTTP_X_LEAD_TEST'] ?? '';
  $test = $cfg['TEST_TOKEN'] !== '' && $tok !== '' && hash_equals($cfg['TEST_TOKEN'], $tok);
  if ($test && !gem_recipients($cfg['TEST_TO'])) gem_respond(503, array('ok' => false, 'error' => 'test not configured'));

  if (!$test) {   // partial steps returned above and are never counted; test requests are not limited
    $wait = gem_rate_hit($cfg, gem_spool_dir($cfg));
    if ($wait > 0) {
      gem_log('relay', 'rate limited (' . substr(gem_client_key(), 0, 8) . ') form ' . $form);
      header('Retry-After: ' . $wait);
      gem_respond(429, array('ok' => false, 'error' => 'rate'));
    }
    // after the limit, so a flood is refused before each request costs a siteverify call
    if ($cfg['TURNSTILE_SECRET'] !== '') {
      $v = gem_turnstile($cfg, $lead['turnstile'] ?? null);
      if ($v[0] === 'refused') {
        gem_log('relay', 'turnstile refused (' . $v[1] . ') (' . substr(gem_client_key(), 0, 8) . ') form ' . $form);
        gem_respond(400, array('ok' => false, 'error' => 'verify'));
      }
      if ($v[0] === 'unreachable') gem_log('relay', 'turnstile unreachable (' . $v[1] . '), lead accepted, form ' . $form);
    }
  }

  $body = gem_compose($cfg, $form, $f, $email, $lead, $file ? $file['name'] : null, $test);
  $id = gem_uuid();

  // 1. spool first: the lead is on disk (and its resume file) before anything can fail
  $dir = gem_spool_dir($cfg);
  $spooled = false;
  if ($dir) {
    $rec = array('id' => $id, 'at' => gmdate('c'), 'form' => $form, 'test' => $test, 'body' => $body, 'file' => null);
    $fileOk = true;
    if ($file) {
      @mkdir($dir . '/files', 0700, true);
      $dest = $dir . '/files/' . $id . '.bin';
      if (@copy($file['tmp'], $dest)) { @chmod($dest, 0600); $rec['file'] = array('filename' => $file['name'], 'path' => 'files/' . $id . '.bin'); }
      else $fileOk = false;
    }
    $spooled = $fileOk && gem_append($dir . '/leads-' . gmdate('Y-m') . '.jsonl', $rec);
  }
  if (!$spooled) gem_log('relay', 'spool FAILED lead ' . $id);

  // 2. send through Resend
  $msg = $body;
  if ($file) {
    $data = @file_get_contents($file['tmp']);
    if ($data === false) gem_respond(503, array('ok' => false, 'error' => 'unavailable'));
    $msg['attachments'] = array(array('filename' => $file['name'], 'content' => base64_encode($data)));
  }
  $r = gem_resend($cfg, $msg, 'lead-' . $id);
  if ($r[0]) {
    if ($dir) gem_append($dir . '/sent.jsonl', array('id' => $id, 'resend_id' => $r[2], 'at' => gmdate('c')));
    gem_log('relay', 'sent lead ' . $id . ($test ? ' (test)' : '') . ' resend ' . $r[2]);
    gem_autoreply($cfg, $form, $f, $email, $test, $id);
    gem_respond(200, array('ok' => true, 'id' => $r[2]), function () use ($cfg, $form, $f, $email, $lead, $test, $id) { gem_ctm($cfg, $form, $f, $email, $lead, $test, $id); });
  }
  gem_log('relay', 'resend FAILED lead ' . $id . ' (' . $r[1] . ' ' . $r[2] . ')' . ($spooled ? ' queued in spool' : ' NOT SAVED'));
  if ($spooled) {   // safe on disk; --replay sends it. Accepted, so CTM gets it too (after the answer)
    gem_autoreply($cfg, $form, $f, $email, $test, $id);
    gem_respond(200, array('ok' => true, 'queued' => true, 'id' => $id), function () use ($cfg, $form, $f, $email, $lead, $test, $id) { gem_ctm($cfg, $form, $f, $email, $lead, $test, $id); });
  }
  gem_respond(502, array('ok' => false, 'error' => 'send'));
}

// ---- CLI: php lead.php --replay [--dry-run]  (cron): send every spooled lead that was never sent -----------------------------
function gem_replay($dry) {
  $cfg = gem_config();
  if (!gem_key_ok($cfg)) { fwrite(STDERR, "not configured (config.php missing or RESEND_API_KEY not set)\n"); return 2; }
  $dir = gem_spool_dir($cfg);
  if (!$dir) { fwrite(STDERR, "spool dir missing or not writable\n"); return 2; }
  $sent = array();
  if (is_file($dir . '/sent.jsonl')) foreach (file($dir . '/sent.jsonl', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $j = json_decode($l, true); if (isset($j['id'])) $sent[$j['id']] = 1; }
  $pending = 0; $ok = 0; $fail = 0;
  $files = glob($dir . '/leads-*.jsonl') ?: array();
  sort($files);
  foreach ($files as $path) {
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) {
      $rec = json_decode($l, true);
      if (!is_array($rec) || empty($rec['id']) || !isset($rec['body']) || isset($sent[$rec['id']])) continue;
      $pending++;
      if ($dry) { echo 'pending ' . $rec['id'] . ' ' . ($rec['at'] ?? '') . "\n"; continue; }
      $msg = $rec['body'];
      if (!empty($rec['file']['path'])) {
        $data = @file_get_contents($dir . '/' . $rec['file']['path']);
        if ($data === false) { echo 'FAILED ' . $rec['id'] . " (resume file missing)\n"; $fail++; continue; }
        $msg['attachments'] = array(array('filename' => $rec['file']['filename'], 'content' => base64_encode($data)));
      }
      $r = gem_resend($cfg, $msg, 'lead-' . $rec['id']);
      if ($r[0]) { gem_append($dir . '/sent.jsonl', array('id' => $rec['id'], 'resend_id' => $r[2], 'at' => gmdate('c'))); gem_log('relay', 'replayed lead ' . $rec['id'] . ' resend ' . $r[2]); $ok++; echo 'sent ' . $rec['id'] . "\n"; }
      else { gem_log('relay', 'replay FAILED lead ' . $rec['id'] . ' (' . $r[1] . ' ' . $r[2] . ')'); $fail++; echo 'FAILED ' . $rec['id'] . ' (' . $r[1] . ' ' . $r[2] . ")\n"; }
    }
  }
  echo ($dry ? 'dry run: ' : '') . "pending $pending, sent $ok, failed $fail\n";
  return $fail ? 1 : 0;
}

gem_boot();
if (PHP_SAPI === 'cli') {
  if (in_array('--replay', $argv ?? array(), true)) exit(gem_replay(in_array('--dry-run', $argv, true)));
  fwrite(STDERR, "usage: php lead.php --replay [--dry-run]\n");
  exit(64);
}
gem_handle();
