<?php
// Local stand-in for Resend (tests only). Appends each request to $STUB_OUT as one JSON line and answers {"id":...}.
// If the file $STUB_MODE contains "fail", answers 500 instead. Checks the Bearer key and the Idempotency-Key header.
$out = getenv('STUB_OUT'); $mode = getenv('STUB_MODE');
$h = function ($n) { return $_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $n))] ?? null; };
if (($h('Authorization') ?? '') !== 'Bearer test-key-local') { http_response_code(401); echo '{"message":"bad key"}'; return; }
$body = json_decode(file_get_contents('php://input'), true);
$rec = array('idem' => $h('Idempotency-Key'), 'body' => $body);
if ($mode && is_file($mode) && trim(file_get_contents($mode)) === 'fail') { http_response_code(500); echo '{"message":"stub failure"}'; return; }
file_put_contents($out, json_encode($rec) . "\n", FILE_APPEND);
header('Content-Type: application/json');
echo json_encode(array('id' => 'stub-' . bin2hex(random_bytes(4))));
