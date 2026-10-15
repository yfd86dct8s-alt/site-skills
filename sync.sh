#!/usr/bin/env bash
# Re-copy the 4 site-* skills from the websites repo and make the copy self-contained:
# CLAUDE.md + memory digest -> site-method/reference/operating-rules.md, check tools -> site-craft/tools/,
# worked examples -> site-method/examples/, and every path in the skills rewritten to those copies.
# usage: bash sync.sh [websites repo=/c/Users/PC GAMER/websites] [memory dir]
set -euo pipefail
SRC="${1:-/c/Users/PC GAMER/websites}"
MEM="${2:-/c/dev/claude-arthur/config/projects/C--Users-PC-GAMER-websites/memory}"
OUT="$(cd "$(dirname "$0")" && pwd)/skills"
S=".claude/skills"

rm -rf "$OUT"; mkdir -p "$OUT"
for k in site-method site-craft site-copy site-seo; do cp -r "$SRC/$S/$k" "$OUT/"; done

# 1. operating rules: the websites CLAUDE.md + the one-line index of Arthur's memories
R="$OUT/site-method/reference"; mkdir -p "$R"
{
  echo "# Operating rules (portable copy)"
  echo
  echo "Copied by sync.sh from the websites repo. Part 1 is its CLAUDE.md (pipeline, gates, model protocol, testing,"
  echo "motion vs. Core Web Vitals). Part 2 is the index of Arthur's standing memories: the rules the skills call"
  echo "\"Arthur's memories\". In another project, a project CLAUDE.md or memory that says otherwise wins."
  echo "Paths inside part 1 (docs/, clientes/, experimentos/) describe the websites repo's layout: create the same"
  echo "folders in the new project when a phase needs them."
  echo
  echo "## Part 1 - CLAUDE.md"
  echo
  sed -e 's/^#/##/' "$SRC/CLAUDE.md"
  echo
  echo "## Part 2 - Arthur's memories (index)"
  echo
  sed -E 's/^- \[([^]]+)\]\([^)]+\)/- **\1**/' "$MEM/MEMORY.md"
} > "$R/operating-rules.md"

# 2. tools the skills tell the agent to run (all need the shared toolbox at C:/dev/web-toolbox)
T="$OUT/site-craft/tools"; mkdir -p "$T/look" "$T/checks" "$T/img" "$T/web-toolbox"
cp "$SRC/tools/look/look.mjs" "$SRC/tools/look/README.md" "$T/look/"
cp "$SRC"/tools/web-toolbox/{package.json,package-lock.json,README.md} "$T/web-toolbox/"
E="$SRC/clientes/elevate-legal/tools"
for f in form-flow form-steps anchor-landing font-fallback theme-clicks circle-center; do cp "$E/$f.mjs" "$T/checks/"; done
cp "$E/circle_center.py" "$T/checks/"
cp "$SRC/clientes/gem-cap-trucking/tools/img/guide.py" "$E/img/people_plainwall.py" "$T/img/"

# 3. worked examples the skills cite
X="$OUT/site-method/examples"; mkdir -p "$X"
cp "$SRC/clientes/elevate-legal/04-home-v3.md" "$X/elevate-home-v3.md"
cp "$SRC/clientes/the-marketing-cartel/09-measurement-plan.md" "$X/tmc-measurement-plan.md"
cp "$SRC/clientes/gem-cap-trucking/06-brand/IMAGE-PLAN.md" "$X/gemcap-image-plan.md"
cp "$SRC/clientes/elevate-legal/site/public/js/forms.js" "$X/elevate-forms.js"
cp "$SRC/_metodologia/referencias/README.md" "$X/reference-sources.md"
cp "$SRC/_metodologia/inbox/2026-10-14-arthur-links-scan.md" "$X/links-scan-2026-10-14.md"

# 4. point the skills at the copies (the tool READMEs too: their usage lines say tools/look/...)
find "$OUT" -name '*.md' ! -name operating-rules.md -print0 | xargs -0 sed -i -E \
  -e "s#clientes/elevate-legal/04-home-v3\.md#$S/site-method/examples/elevate-home-v3.md#g" \
  -e "s#clientes/the-marketing-cartel/09-measurement-plan\.md#$S/site-method/examples/tmc-measurement-plan.md#g" \
  -e "s#clientes/gem-cap-trucking/06-brand/IMAGE-PLAN\.md#$S/site-method/examples/gemcap-image-plan.md#g" \
  -e "s#clientes/elevate-legal/site/public/js/forms\.js#$S/site-method/examples/elevate-forms.js#g" \
  -e "s#_metodologia/referencias/README\.md#$S/site-method/examples/reference-sources.md#g" \
  -e "s#_metodologia/inbox/2026-10-14-arthur-links-scan\.md#$S/site-method/examples/links-scan-2026-10-14.md#g" \
  -e "s#clientes/elevate-legal/tools/#$S/site-craft/tools/checks/#g" \
  -e "s#\.claude/skills/site-craft/reference/known-mistakes\.md#$S/site-craft/reference/known-mistakes.md#g" \
  -e "s#(^|[ \`(])tools/look/#\1$S/site-craft/tools/look/#g" \
  -e "s#(^|[ \`(])tools/web-toolbox/#\1$S/site-craft/tools/web-toolbox/#g" \
  -e "s#Gem Cap \`tools/img/guide\.py\`#\`$S/site-craft/tools/img/guide.py\`#g" \
  -e "s#\`tools/img/people_plainwall\.py#\`$S/site-craft/tools/img/people_plainwall.py#g" \
  -e "s#this repo's CLAUDE\.md#the operating rules' (site-method \`reference/operating-rules.md\`)#g" \
  -e "s#\`CLAUDE\.md\`#\`$S/site-method/reference/operating-rules.md\`#g" \
  -e "s#([ (])CLAUDE\.md#\1operating-rules.md#g" \
  -e "s#Arthur's memories#Arthur's memories (index in operating-rules.md)#g" \
  -e "s#^( +)memories \(#\1memories (index in operating-rules.md; #"
sed -i -E "s#(^|[ \`(])tools/look/#\1$S/site-craft/tools/look/#g" "$T/look/look.mjs"

# 5. nothing may still point into the websites repo
left=$(grep -rnE "clientes/(elevate|the-marketing|gem-cap)|_metodologia/(inbox|referencias/README)|(^|[ \`(])tools/look/|[^-]CLAUDE\.md" "$OUT" \
  --include='*.md' --include='*.mjs' | grep -v 'reference/operating-rules.md' || true)
if [ -n "$left" ]; then echo "still pointing at the websites repo:"; echo "$left"; exit 1; fi
echo "synced from $SRC ($(git -C "$SRC" rev-parse --short HEAD))"
