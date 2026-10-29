# Operating rules (portable copy)

Copied by sync.sh from the websites repo. Part 1 is its CLAUDE.md (pipeline, gates, model protocol, testing,
motion vs. Core Web Vitals). Part 2 is the index of Arthur's standing memories: the rules the skills call
"Arthur's memories". In another project, a project CLAUDE.md or memory that says otherwise wins.
Paths inside part 1 (docs/, clientes/, experimentos/) describe the websites repo's layout: create the same
folders in the new project when a phase needs them.

## Part 1 - CLAUDE.md

## Metodologia de construção de websites

Design completo: `docs/superpowers/specs/2026-09-22-metodologia-websites-design.md`.
Este arquivo é o **operacional** — carrega em toda sessão deste repositório.

### Pipeline (9 fases)

1. Briefing (Arthur despeja) → 2. Pesquisa (delegada) → 3. Estratégia →
4. Arquitetura + wireframe HTML → 5. Referências (arquivar) →
6. Hero → destila style guide → 7. Demais seções → 8. Copy → 9. Build + deploy VPS.

Cada fase produz um artefato no dossiê `clientes/<cliente>/` que destrava a
seguinte. Três portões: (1) wireframe aprovado antes de caçar referência;
(2) style guide aprovado antes das demais seções; (3) Lighthouse CI antes do deploy.

**No início de toda fase, invocar a skill `site-method`** (`.claude/skills/site-method/`): checklist de
entrada, procedimento e saída de cada fase (baseline e inventário de sistemas da fase 2, arquitetura de funil da
fase 4, varredura de referências e recibo da fase 5, direção de imagem da fase 6, PRE-PRODUCTION e entrega de leads
da fase 9). Ler a seção da fase na hora, não de memória. Ela é viva: lição nova de processo entra nela no mesmo dia.

**Padrões de todo site** (pedidos de Arthur/Erick que nunca se pedem duas vezes: e-mail de confirmação ao visitante,
remetente no domínio do cliente, tema claro/escuro, noindex em /lp/, guarda de arquivos, preview só com o site, regras
atrás do Cloudflare): seção "Every site ships these" da `site-method`. Pedido novo que valha para todos os sites entra
lá no mesmo dia.

Regra do baseline: o alvo da fase 9 é `max(baseline, limiar absoluto de "bom")`; o piso levanta a meta, nunca a
abaixa. Medição sempre passiva; nunca ativa na produção deles.

### Modelos e esforço por fase

Padrão da thread principal: **Opus, esforço high**. A main **delega a subagentes**
(Sonnet/Haiku) toda tarefa em lote ou auto-contida (pesquisa, captura, crawl, HTML
de wireframe, deploy mecânico). Julgamento fica na main — orquestrar é julgamento,
main fraca delega mal.

- **Fase 2 (pesquisa):** delegar coleta em leque (Sonnet) → síntese (Opus).
- **Fase 5 (arquivar referências):** clerical. Ao ENTRAR, avisar Arthur:
  *"Fase 5, arquivamento — pode ir de `/model haiku`."* A auditoria de conflitos
  do fim roda em **subagente Opus**, independente do modelo da main.
- **Fase 6 (hero + style guide):** pedir esforço **max**. Nunca economizar aqui.

### Protocolo de troca (a main anuncia; Arthur seta o /model)

A main NÃO troca o próprio modelo — anuncia na fronteira, Arthur digita.
- Entrar na fase 5 → avisar para `/model haiku`.
- Arthur disser **"fim das referências"** → a main (ainda Haiku) avisa para voltar
  a `/model opus` (high) e **PARA**. NÃO dispara a auditoria ainda. Só depois de
  Arthur confirmar a troca ("ok"/"trocado") a main — agora Opus — dispara o
  subagente da auditoria de conflitos. O spawn é julgamento e não pode sair do
  Haiku; anunciar a troca pode.

Se Arthur esquecer de rebaixar na fase 5, a perda é limitada: a main não gasta
raciocínio num "ok" mesmo em high — o custo é só o preço de input do Opus sobre o
contexto. Não é catástrofe.

**Fable 5.1 não entra.** Custa 2,5x o Opus 5.5 ($10/$50 vs $4/$20 por milhão de tokens, tabela 2026-10) e não economiza —
compra qualidade não-comprovada em design. Teto = Opus/max. Uso só experimental:
A/B da fase 3 (estratégia) Fable vs Opus, adota se a diferença aparecer.

### Testes de segurança (Strix)

- Site do cliente: **passivo** (leitura pública) OU **clone em container** (ataca
  cópia local). **Proibido**: teste ativo direto na produção do cliente.
- Site próprio: Strix completo, só **após o cliente aprovar o build**.
- Autorização registrada em `ESCOPO-TESTES.md` antes de qualquer leitura.

### Motion vs. Core Web Vitals (regra do style guide)

Animar só `transform`/`opacity`; reveal reserva espaço antes (CLS); nada atrasa o
maior elemento (LCP); scroll em CSS quando der, JS só abaixo da dobra;
`prefers-reduced-motion` sempre respeitado.

### Experimentos de arsenal (A/B de modelo × esforço × skills)

Arthur compara combinações de configuração/skills. Toda saída de fase criativa
(wireframe, hero, style guide, seções, copy) nasce dentro de uma **rodada**
`clientes/<cliente>/experimentos/E<NN>-<slug>/`, com `MANIFESTO.md` (config exata +
skills **de fato** invocadas) e a spec de entrada salva (`SPEC-*.md`). A/B = mesma
spec, arsenal diferente. A vencedora é promovida ao caminho canônico do dossiê e
registrada em `experimentos/REGISTRO.md`. Ver `experimentos/README.md`.

## Part 2 - Arthur's memories (index)

- **Deliverables in English** — new files in English; old PT docs translated only if client-facing; chat stays PT-BR
- **Use existing research and refs** — consult dossier/refs (open the real ref) before asking or inventing; research if needed
- **Toggle panel conventions** — toggles in page order, remove decided ones, verify by screenshot
- **Autonomous rounds** — on "pode construir", run spec→plan→checks→build→review end-to-end; few ★-default options
- **No spec review gate** — spec matching chat decisions = approved; never ask him to read a spec/plan file
- **Forms cost TBT** — below-fold <form> = ~50 ms TBT (autofill); stamp from <template>; intrinsic-size is content-box
- **No weak numbers** — omit weak proof counts ("12 reviews"); keep the strong figure; sweep every occurrence
- **Arthur's screen** — he judges at 1534×692 CSS px (125% scaling); check first-screen work there
- **Mobile: fluid, not one device** — fluid from 320px; check 360/390/414 (Arthur iPhone 11)/768; light for SEO
- **Perf traps: 3D + decode** — container-type on big above-fold elements = +170-200 ms mobile TBT; decode() on hidden lazy img crashes headless
- **Dev server no-cache** — serve reviews with no-store; stale cache made a working fix look broken
- **Fixes are pre-approved** — proven bug → just fix it; ask only if the fix makes the site heavier
- **Copy from the lead's side** — forms/copy in the visitor's words and situation; no questions that only serve us; options not limited to our niches
- **Technical calls are mine** — Arthur isn't technical: I decide stack/code, ask him taste/business only
- **Progress + ETA in long rounds** — every summary ends with hours to next /clear + to completion (stage, milestone, finish)
- **Quiet chat in long rounds** — routine agent events = no chat text at all; speak only if he must act, a real problem, a milestone, or he asks
- **Sites are lead machines** — plan full attribution/funnel/CRM measurement by default, gated by Lighthouse with tags on
- **Ready to connect, no fake data** — no credentials yet → connector + "not connected" state; no demo/partial data in UI or site
- **Round clone gotchas** — set git identity after cloning a round; MSYS_NO_PATHCONV=1 for URL env vars
- **Quality over speed** — "when it is done, it is done"; speed from process cuts, never quality cuts
- **Lean, not skipped phases** — wireframe -> style guide -> site always; lean = avoid TMC mistakes, never cut phases
- **Branded generated imagery** — generate art-directed branded scenes; never ask client for photos/shoots
- **UX calls are mine** — decide structure/funnel/form placement with rationale; toggles only for visual taste
- **Visual balance** — even grid counts, similar sibling lengths, no orphans; hero text block in sync with the photo's subject (no diagonal 'torto')
- **Mark-ups are exact** — measure his pencil/box on the image and apply literally (box = new bounds); show a proof overlay
- **Instructions in the final message** — his UI collapses mid-turn text; anything he must read/do ends the turn
- **Reuse approved components** — port TMC's approved pieces (pill nav, sheet...) with new tokens; never rebuild from zero
- **Phone review on the iPhone** — desktop phone frames mislead him; use the live preview, NO Desktop shortcuts/QR/.cmd for local sites (removed 2026-10-05)
- **Review on the live preview** — noindex preview link over local+QR; in a feedback stage publish change by change without asking (not production)
- **Astro props: no &amp;** — plain & in quoted props; grep dist for &amp;amp;
- **No focus ring on click** — never a focus box after mouse/tap on any site; keyboard-only ring via data-input modality
- **Reveal pace** — reveals ~240/320 ms, fire at the screen edge; review cards faster and earlier
- **Awave: ideas only** — Awave Agents license: reimplement ideas, never copy its code/prompts/SKILL.md into hub/sites
- **Clear at a safe boundary** — checkpoints + push + "Seguro para /clear agora" + stage table/ETA; agents SURVIVE /clear (2026-10-15): list in-flight ids in HANDOFF, never re-dispatch
- **TMC cPanel host gotchas** — CSC-Webhost-001: no gzip (ship .gz twins); clear NGINX cache after uploads; mail routing Local→Remote; server can't mail Google → Resend (full verify); Windows zips = 0777
- **Verify lead delivery before switch** — prove a test alert is DELIVERED from the prod server before going live
- **Hash every image URL** — re-exported photos stay stale 7 days unless every img/OG URL has ?h=<hash>
- **Web toolbox path** — browser scripts require playwright/lighthouse from C:/dev/web-toolbox (manifest tools/web-toolbox); never a scratchpad
- **Machine move Oct 2026** — notebook → Arthur's PC via pendrive kit C:\dev\mudanca-websites; restore log first if paths/tools break; old notebook fallback ~1 week
- **Closing apps on his PC** — any app incl. PowerToys may close for RAM when parallel work needs it (OK 2026-10-15); MWB = his keyboard, close it last
- **Paste in chat, not paths** — forwarded text pasted WhatsApp-ready (plain code block, English for Erick); impersonal, Arthur = first person, never as Claude
- **No fixed lead deletion** — policies don't promise N-month lead deletion; keep leads, delete on request
- **Lead alert recipients** — TMC leads: Wilbur main + Erick backup only; every other client site gets its own recipients
- **Claims need proof** — counts/exclusivity need proof at copy time (incl. screenshots); a client's written confirmation is the proof; awards + claims Arthur states true: his call
- **Client questions after approval** — client fact questions only after the site is presented + approved; build with safe wording meanwhile
- **find-skills approved** — Arthur wants find-skills installed/used (vendored in .claude/skills); read any skill before installing it
- **Migrated content compliance** — old blog/pages carried into a new site get the same claims review before publishing; flagged posts ship as drafts
- **Home: low cognitive load** — strong visual hero, one CTA everywhere, little text, details on inner pages; attorney photos in colour, well cropped
- **Image direction first** — show 3-4 image styles (2 cheap samples each) before generating a site's image set
- **Reference sweep arsenal** — phase 5 sweeps galleries into _metodologia/referencias/; proposals carry 2-3 alternatives
- **Known mistakes ledger** — every bug Arthur catches -> site-craft known-mistakes.md (cause, rule, check) same day; run its checks before showing
- **Site defaults for every site** — a request that fits every site becomes a site-method "Every site ships these" default the same day (confirmation email, CTM forms, thank-you conversions...)
- **Proportional checks** — size checks to the change; CSS tweak = targeted shots + package diff vs live; bound delegated checks
- **Token-cost levers** — spend = Opus subagents at 200k+; never resume a >200k agent after a quota stop (WIP commit + fresh); ceiling ~70 calls IN the dispatch prompt (2026-10-25 audit)
- **Publish myself** — after "pode publicar" I run the deploy (cPanel publish.mjs, pushes); he doesn't run commands
- **No prospecting, no meetings** — Arthur does no prospecting/client meetings (partners: unknown); skip sales/outreach/proposal tooling in scans
- **Funnel architecture** — page goal first; every section names its funnel step + objection; Elevate v1 too long, v2 too short, v3 right
- **Old-site systems inventory** — phase 2 lists tags/GTM/forms/recipients/mail passively; TMC launch waited on it
- **Client preview host** — client previews on Cloudflare Pages from day one; GEMCAP lost 2 days on EasyPanel
- **Existing brand and copy first** — check kept logo, real look of their products/premises/team, approved copy before designing (any niche)
- **Production blockers list** — every preview-only switch goes in PRE-PRODUCTION.md, walked at launch
- **graphify A/B deferred** — promised for E12 S5, deferred 2026-10-15; run at the S6 final review on ONE small unit (the extra arm costs one task run); Effortless not A/B-tested (main-thread only)
- **Rejections need a concrete conflict** — reject skill/ref ideas only for a named rule/decision/perf conflict; taste → toggle; adapt before dropping
- **Skills are niche-agnostic** — method/skills serve any site and niche; law/trucking are worked examples only; never brief agents by niche
- **cPanel use authorized** — read (10-15) + change for hub onboarding (10-16) on any of our cPanels; log in ESCOPO first
- **site-skills GitHub copy** — yfd86dct8s-alt/site-skills (C:/dev/site-skills), PUBLIC ok (2026-10-22); re-sync with sync.sh; scan output for secrets/origin IPs before push
- **No phone apps** — never ask him/TMC to install apps; alerts by email; outside accounts only when the server can't do it, with the reason
- **Explain, don't script** — "o que eu falo pra ele" = explain to Arthur plainly, no ready-made message in his voice
- **Erick's account loan** — from 2026-10-15 ~1 week; claude-erick shares projects/memories via junctions; rmdir junctions before deleting it
- **Subscription quota only** — no extra-usage credits (Arthur 2026-10-15); near the limit stop clean, resume fresh after the weekly reset
- **Server deploys: durable OK** — update/deploy/upload to any server I can reach, any situation, never ask (2026-10-15)
- **Re-run after a memory kill** — reaped for RAM → close unneeded/orphaned processes, re-run at once with lower concurrency; never wait for his OK
- **Confirm what was read** — open replies to his attachments with a receipt list (each file/audio read + what it held); ask for anything referenced but missing
- **TMC's role in the lead flow** — client firms answer/mark their own leads (email links); TMC only watches and reports via the hub; clients see the portal
- **TMC client roster + hosting** — each TMC client: host (cPanel/Shopify/server 1-2), frozen/lost/not-ours; elaw lost → out of hub
- **External links in a new tab** — every link out gets target=_blank rel=noopener, never replaces our site; scan dist after builds
- **Artifact sub-page links** — never target=_blank to a sibling file in an artifact (frame URL blocked); publish it as its own artifact and link that
- **Bold, current look** — colourful + personality, always pill, but colour = meaning: one action colour, few hues ("500 cores" = messy, Cold Air 2026-10-21)
- **cPanel 2FA keys** — logins ask TOTP since 2026-10-21; keys in his "cPanel 2FA" sheet; GEMCAP + TMC keys stored (TMC 2026-10-22)
- **Serena removed** — Serena plugin disabled 2026-10-24 (dashboard RAM leak, unused); low RAM: check parent chains + orphans before blaming his apps
- **Pasted images need a path** — use an image only via its "[Image: source: path]" line; none -> ask him to paste again in one line, no disk hunt
- **No surprise costs** — every estimate lists every outside service + free limits; stay free by design; paid cap/plan only with his OK and the number
- **Hub after 100%** — when E12 is done: run every parked item unasked, then click-guided in-hub tutorials (TMC team + clients)
- **No lawyer** — TMC/Arthur have no lawyer: never gate on a lawyer sign-off; legal docs = factual records + open points as his business calls
- **PC filter blocks fixtures** — antivirus learns exact PHP fixture text and blocks reads (EINVAL); per-run nonce in fixture text
- **Arthur's TMC email** — arthur@marketingcartel.com since 2026-10-28; his hub owner login
- **Keys in one place on the PC** — every key in C:/Users/PC GAMER/.tmc-private + INDEX.md; never delete PC copies after handover
