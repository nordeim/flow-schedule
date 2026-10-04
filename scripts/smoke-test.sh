#!/usr/bin/env bash
# FlowSchedule end-to-end API smoke test.
# Boots the production standalone server, exercises auth + task/note CRUD +
# the AI endpoints' envelope contract, prints PASS/FAIL per step, cleans up,
# exits non-zero on any failure.
set -u
cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

BASE="http://localhost:3000"
CJ="/tmp/flowschedule-smoke-cookies.txt"
PASS=0; FAIL=0

say() { printf '%s\n' "$*"; }
ok()  { PASS=$((PASS+1)); say "PASS: $*"; }
bad() { FAIL=$((FAIL+1)); say "FAIL: $*"; }

# ---- 0. clean slate: kill any server holding port 3000 ----
pkill -f "standalone/server.js" 2>/dev/null
sleep 1
rm -f "$CJ" /tmp/smoke-*.json

# ---- 1. build (reuse if present) + boot the standalone server ----
if [ ! -f .next/standalone/server.js ]; then
  say "building (no standalone server present)…"
  bun run build >/tmp/smoke-build.log 2>&1 || { bad "build failed (see /tmp/smoke-build.log)"; exit 1; }
fi
( bun run start >/tmp/smoke-server.log 2>&1 & )
for i in $(seq 1 30); do
  curl -sf "$BASE/api/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -sf "$BASE/api/health" | grep -q '"status":"ok"' && ok "health endpoint up" || bad "health endpoint"

# ---- 2. auth ----
EMAIL="smoke-$(date +%s)@example.com"
curl -sf -c "$CJ" -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"SmokeTest123\",\"fullName\":\"Smoke Tester\"}" >/tmp/smoke-register.json
grep -q '"ok":true' /tmp/smoke-register.json && ok "register" || bad "register"

curl -sf -b "$CJ" "$BASE/api/auth/me" >/tmp/smoke-me.json
grep -q '"email":"'"$EMAIL"'"' /tmp/smoke-me.json && ok "session (me)" || bad "session (me)"

curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"demo@flowschedule.app","password":"wrong"}' | grep -q 'Invalid email or password' \
  && ok "bad password rejected" || bad "bad password rejection"

curl -sf -b "$CJ" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"demo@flowschedule.app","password":"demo1234"}' >/dev/null \
  && ok "demo login" || bad "demo login (did you run bun run db:seed?)"

# ---- 3. tasks CRUD ----
TODAY=$(date +%Y-%m-%d)
curl -sf -b "$CJ" -X POST "$BASE/api/tasks" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Smoke task\",\"priority\":\"high\",\"category\":\"work\",\"start_time\":\"${TODAY}T10:00:00.000Z\",\"duration_minutes\":30}" >/tmp/smoke-task.json
grep -q '"ok":true' /tmp/smoke-task.json && ok "task create" || bad "task create"
TASK_ID=$(python3 -c "import json;print(json.load(open('/tmp/smoke-task.json'))['data']['task']['id'])" 2>/dev/null || echo "")

curl -s -b "$CJ" -X POST "$BASE/api/tasks" -H 'Content-Type: application/json' \
  -d '{"title":""}' | grep -q '"ok":false' \
  && ok "empty title rejected" || bad "empty title rejection"

# Invalid enums coerce to the reference's entity defaults (medium/work) —
# stored enums are always valid; the wire never writes a bad enum value.
curl -sf -b "$CJ" -X POST "$BASE/api/tasks" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke enum coercion","priority":"nope","category":"nope"}' >/tmp/smoke-enum.json
grep -q '"priority":"medium"' /tmp/smoke-enum.json && grep -q '"category":"work"' /tmp/smoke-enum.json \
  && ok "invalid enum coerced to defaults" || bad "enum coercion"
ENUM_TASK_ID=$(python3 -c "import json;print(json.load(open('/tmp/smoke-enum.json'))['data']['task']['id'])" 2>/dev/null || echo "")
[ -n "$ENUM_TASK_ID" ] && curl -sf -b "$CJ" -X DELETE "$BASE/api/tasks/$ENUM_TASK_ID" >/dev/null \
  && ok "enum-coercion task cleanup" || bad "enum cleanup"

[ -n "$TASK_ID" ] && curl -sf -b "$CJ" -X PATCH "$BASE/api/tasks/$TASK_ID" -H 'Content-Type: application/json' \
  -d '{"status":"completed"}' | grep -q '"status":"completed"' \
  && ok "task status update" || bad "task status update"

curl -sf -b "$CJ" "$BASE/api/tasks" | grep -q 'Smoke task' && ok "task list" || bad "task list"

# ---- 4. notes CRUD ----
curl -sf -b "$CJ" -X POST "$BASE/api/notes" -H 'Content-Type: application/json' \
  -d '{"content":"Smoke note","tags":["smoke"]}' >/tmp/smoke-note.json
grep -q '"ok":true' /tmp/smoke-note.json && ok "note create" || bad "note create"
NOTE_ID=$(python3 -c "import json;print(json.load(open('/tmp/smoke-note.json'))['data']['note']['id'])" 2>/dev/null || echo "")
[ -n "$NOTE_ID" ] && curl -sf -b "$CJ" -X DELETE "$BASE/api/notes/$NOTE_ID" | grep -q '"ok":true' \
  && ok "note delete" || bad "note delete"

# ---- 5. ownership + auth guards ----
[ -n "$TASK_ID" ] && curl -s -X DELETE "$BASE/api/tasks/$TASK_ID" | grep -q 'UNAUTHORIZED\|must be signed in' \
  && ok "unauthenticated delete rejected" || bad "auth guard on delete"

[ -n "$TASK_ID" ] && curl -sf -b "$CJ" -X DELETE "$BASE/api/tasks/$TASK_ID" | grep -q '"ok":true' \
  && ok "task delete (cleanup)" || bad "task delete"

# ---- 6. AI envelope (fallbacks are valid responses) ----
curl -sf -b "$CJ" "$BASE/api/ai/daily-focus" | grep -q '"ok":true' && ok "daily-focus envelope" || bad "daily-focus"
curl -sf -b "$CJ" "$BASE/api/ai/summary" | grep -q '"ok":true' && ok "ai summary envelope" || bad "ai summary"

# ---- 6b. pages render (authed) ----
# Session 5: the reference serves the dashboard at BOTH "/" (its post-login
# landing) and "/Dashboard" (the header link) — authed requests must get 200
# on all app pages.
for path in /Dashboard /Planning /Profile /Settings /; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$CJ" "$BASE$path")
  [ "$CODE" = "200" ] && ok "page $path (authed)" || bad "page $path authed ($CODE)"
done
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/login")
[ "$CODE" = "200" ] && ok "page /login" || bad "page /login ($CODE)"

# ---- 7. logout ----
curl -sf -b "$CJ" -c "$CJ" -X POST "$BASE/api/logout" | grep -q '"ok":true' && ok "logout" || bad "logout"
curl -sf -b "$CJ" "$BASE/api/auth/me" | grep -q '"user":null' && ok "session cleared" || bad "session cleared"

# ---- 8. guarded routes redirect unauthenticated visitors ----
# Session 5: the (app) routes are session-guarded like the reference — an
# unauthenticated GET must 307 to /login (not render the shell).
for path in /Dashboard /Planning /Profile /Settings /; do
  LOCATION=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE$path")
  echo "$LOCATION" | grep -q "/login" && ok "guard $path (redirects to /login)" || bad "guard $path ($LOCATION)"
done

# ---- cleanup ----
pkill -f "standalone/server.js" 2>/dev/null
rm -f "$CJ" /tmp/smoke-*.json

say ""
say "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
