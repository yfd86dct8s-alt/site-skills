# site-skills

Arthur's website-building skills for Claude Code (private).

- `site-method` - phase-by-phase method (briefing -> research -> strategy -> wireframe -> references -> hero/style guide -> sections -> copy -> build/launch)
- `site-craft` - design craft floor, structures catalog, measurement, review pass
- `site-copy` - conversion copy and forms
- `site-seo` - SEO architecture and structured data

Install in a project: copy the folders under `skills/` into that project's `.claude/skills/`.
Third-party sources and licences: each skill's `NOTICE.md`.
Self-contained: the original repo's `CLAUDE.md` and Arthur's memory index travel in
`site-method/reference/operating-rules.md`, the check tools (`look`, form/anchor/font/theme/circle checks, image
helpers, the `web-toolbox` manifest) in `site-craft/tools/`, and the cited worked examples in `site-method/examples/`.
The tools need the shared Playwright toolbox at `C:/dev/web-toolbox` (`site-craft/tools/web-toolbox/README.md`).

Update from the websites repo: `bash sync.sh` (copies the skills, bundles those files, rewrites the paths and fails
if anything still points into the websites repo), then check the repo is private and push.
