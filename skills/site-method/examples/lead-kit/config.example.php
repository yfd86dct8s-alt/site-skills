<?php
// GEMCAP lead intake - server config. Copy to ~/gemcap-config/config.php (ONE LEVEL ABOVE public_html, never inside it),
// fill the values, chmod 600 (the folder 700). public_html/api/lead.php reads it on every request.
// While RESEND_API_KEY is empty or still the placeholder, every real lead gets 503 "not configured" (the form shows its
// phone + email fallback; never a fake success).
return array(
  // Resend SENDING-ONLY key for the marketingcartel.com domain (resend.com). Never commit it, never paste it in chat.
  'RESEND_API_KEY' => 're_CHANGE_ME',

  // Who gets each lead: one address or several separated by commas (Arthur 2026-10-20: info@gemcaptrucking.com for now).
  'LEAD_TO' => 'info@gemcaptrucking.com',

  // Sender: an address on Resend's verified domain (marketingcartel.com). The visitor's address goes in Reply-To.
  'LEAD_FROM' => 'GEMCAP Website <alerts@marketingcartel.com>',

  // Delivery check: a request with header  X-Lead-Test: <TEST_TOKEN>  is emailed to TEST_TO (subject "[TEST] ...") and
  // NOT to LEAD_TO. Leave TEST_TOKEN empty to switch the test path off. Use a long random token.
  'TEST_TOKEN' => '',
  'TEST_TO' => '',

  // Optional. The visitor's confirmation email (on by default). Sender must be on a Resend-verified domain; replies go to
  // AUTOREPLY_REPLY_TO (default: the first LEAD_TO). Switch the sender to gemcaptrucking.com once Resend verifies it.
  // 'AUTOREPLY' => true,
  // 'AUTOREPLY_FROM' => 'GEMCAP Trucking <noreply@gemcaptrucking.com>',
  // 'AUTOREPLY_REPLY_TO' => 'info@gemcaptrucking.com',
  // At most this many confirmations per UTC day (the Resend account is shared with other sites; lead alerts come first).
  // 'AUTOREPLY_PER_DAY' => 30,
  // Optional. Who gets the site-guard alerts (guard-config.php); default the TMC team.
  // 'GUARD_ALERT_TO' => array('erick@marketingcartel.com'),
  // Optional. Leads per visitor IP per hour before the form gets 429 (default 30, 0 = off).
  // 'RATE_PER_HOUR' => 30,
  // Optional. Count visitors by CF-Connecting-IP / X-Real-IP / X-Forwarded-For instead of REMOTE_ADDR. Leave off on
  // CSC-Webhost-001: its proxy already puts the real visitor in REMOTE_ADDR, and those headers can be faked.
  // 'TRUST_PROXY_HEADERS' => false,

  // Optional. Where leads are kept (outside public_html). Default: the "spool" folder next to this file.
  // 'SPOOL_DIR' => __DIR__ . '/spool',
  // Optional. Only the local tests change this (a stub); leave it out in production.
  // 'RESEND_API_URL' => 'https://api.resend.com/emails',
);
