<?php
// php -S router for the local tests: what public_html/api/.htaccess does on Apache (/api/lead -> lead.php).
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api/lead/?$#', $p)) { require __DIR__ . '/../public_html/api/lead.php'; return true; }
http_response_code(404);
