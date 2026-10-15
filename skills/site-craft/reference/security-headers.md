Distilled from addyosmani/agent-skills `security-and-hardening` (MIT, commit 1be8e34, read 2026-10-12). Changes: cut to static site + small PHP endpoints; Always/Ask-first/Never tiers rewritten for our passive-testing rule; CSP rollout via Report-Only added; AI/LLM, SQL and auth sections dropped. For deep review use the `security-audit` skill; for attacks see CLAUDE.md (Strix rules).

# Security headers and small endpoints

Scope: Astro static output served by nginx/Apache/cPanel (or Cloudflare) plus small PHP handlers
(contact/quote forms, mail). Hardening is built in at build time; testing a client's live site stays passive.

## Tiers

**Always**
- HTTPS everywhere; 301 http->https; HSTS after HTTPS is proven.
- Security headers below on every response; verified in DevTools/`curl -I` (read-only) after deploy.
- Validate and sanitise every PHP input server-side; client validation is UX only.
- Secrets (SMTP/Resend keys, tokens) outside the web root or in env, never in the repo, JS or dist.
- Lead alerts tested end to end from the production server before go-live.

**Ask first (Arthur or the client decides)**
- Adding a third-party script/domain (each is a CSP hole and a TBT cost), embeds, chat widgets.
- Storing lead data anywhere new, changing retention, adding a CRM, sending data to a new processor.
- Any active scan or load test of an environment (own sites after client approval only; see below).
- Loosening CSP (`unsafe-inline`, wildcard sources) or CORS.

**Never**
- Commit secrets; log full personal data or message bodies; expose stack traces or `phpinfo`.
- Disable a header "to make it work"; use `eval`/`innerHTML` with visitor data.
- Run active tests against a client's production site, or use their credentials. Passive reading of
  public headers only (CLAUDE.md). Strix/active testing: own sites after approval, or a local clone.
- Promise N-month lead deletion in policies (delete on request).

## Header set

| Header | Value (start here) |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (add `preload` only deliberately) |
| `Content-Security-Policy` | see rollout; start `default-src 'self'` and tighten |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` unless needed |
| Frame control | CSP `frame-ancestors 'self'` (plus `X-Frame-Options: SAMEORIGIN` for old browsers) |
| `Cross-Origin-Opener-Policy` | `same-origin` if no popups need an opener |
| Caching | static assets `immutable` (hashed), HTML revalidated; forms/endpoints `no-store` |

Remove `Server`/`X-Powered-By` version leaks; disable directory listing; block dotfiles, `.git`, backups.

## CSP rollout (static site)

1. Inventory origins actually used: own domain, analytics/tag domains loaded after interaction, form
   endpoint, maps/video facade targets, fonts (self-hosted so none).
2. Ship `Content-Security-Policy-Report-Only` with `default-src 'self'` plus the inventory and a
   `report-to`/`report-uri` endpoint (or watch the console in Playwright) for a few days of real traffic.
3. Replace inline scripts/styles with files or hashes/nonces (Astro can emit hashes); avoid `'unsafe-inline'`.
4. Fix the violations, then switch to enforcing `Content-Security-Policy`; keep Report-Only running with
   the next tighter policy. Re-run Lighthouse with tags on (CSP must not break the tag-after-interaction path).
5. Every new third-party origin goes through "Ask first" and the CSP list together.

## PHP form handlers

- POST only; check content type and size; allowlist fields; trim and length-limit; validate email/phone.
- CSRF defence for stateful endpoints: SameSite cookie + origin/referer check or token; with no session,
  verify `Origin` matches the site.
- Spam: honeypot field plus time-to-submit check and rate limit per IP (and a global cap); CAPTCHA only if
  abuse proves it (it costs UX and a11y).
- Mail header injection: reject CR/LF in any value used in headers (From, Reply-To, Subject); set From to a
  fixed domain address and Reply-To to the sanitised visitor email.
- Output: escape for HTML context; JSON endpoints send `Content-Type: application/json` and `nosniff`.
- Errors return a generic message; details go to a server log without personal data. Send the lead alert
  from the production server and verify delivery before launch.
- Dependencies: pin and audit before release (`composer audit` / `npm audit` on the lockfile only when
  Arthur's environment allows; no unvetted packages on the server).

## Verify

`curl -sI https://site/` and DevTools Network: each header present, CSP console clean, form works with
CSP enforced, mixed-content zero, cookies (if any) `Secure; HttpOnly; SameSite`. Record the result in
the deploy checklist; a failed header is a P1.
