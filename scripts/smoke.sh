#!/usr/bin/env bash
# Integration smoke test against a running dev server: bash scripts/smoke.sh http://localhost:3100
B=${1:-http://localhost:3100}; R=$RANDOM
mk(){ J=/tmp/cj_$1; rm -f $J; }
call(){ local J=$1; shift; curl -s -b $J -c $J -H "Content-Type: application/json" -H "Origin: $B" "$@"; }
ok=0; bad=0
chk(){ if echo "$2" | grep -q "$3"; then ok=$((ok+1)); else bad=$((bad+1)); echo "FAIL $1: $(echo "$2" | head -c 200)"; fi; }
U=/tmp/cj_u; A=/tmp/cj_a; rm -f $U $A
call $U -X POST $B/api/auth/signup -d "{\"email\":\"u$R@example.com\",\"password\":\"correct-horse-battery\",\"isAdult\":true}" >/dev/null
call $U -X PATCH $B/api/profile -d '{"onboarded":true}' >/dev/null
chk journal "$(call $U -X POST $B/api/journal -d '{"kind":"journal","body":"a private thought"}')" '"id"'
chk journal-list "$(call $U $B/api/journal)" 'private thought'
chk sleep "$(call $U -X PUT $B/api/sleep -d '{"day":"2026-11-20","bedtime":"01:00","wake":"09:00","quality":2}')" 'ok\|id\|item'
chk eating "$(call $U -X PUT $B/api/eating -d '{"day":"2026-11-20","meals":1,"energy":2}')" 'ok\|id\|item'
chk strengths "$(call $U -X POST $B/api/strengths -d '{"kind":"small_win","text":"got out of bed"}')" 'id\|item'
chk contact "$(call $U -X POST $B/api/contacts -d '{"name":"Asha","phone":"+91 98765 43210","role":"friend"}')" 'id\|item'
chk contacts-dec "$(call $U $B/api/contacts)" 'Asha'
chk plan-put "$(call $U -X PUT $B/api/safety-plan -d '{"warningSigns":["not sleeping"],"copingSteps":[],"peopleAndPlaces":[],"peopleToAsk":[],"professionals":[],"makingSafe":[],"reasons":["my sister"]}')" 'ok'
chk plan-get "$(call $U $B/api/safety-plan)" 'my sister'
chk kit "$(call $U -X POST $B/api/kit -d '{"section":"helps","text":"warm shower"}')" 'id\|item'
chk goals "$(call $U -X POST $B/api/goals -d '{"title":"Walk daily","status":"active"}')" 'id\|item'
chk substance "$(call $U -X POST $B/api/substance -d '{"kind":"urge","intensity":6}')" 'id\|item\|ok'
chk growth "$(call $U -X POST $B/api/growth -d '{"dimension":"self_soothing","value":3}')" 'ok\|id'
chk growth-get "$(call $U $B/api/growth)" 'dimensions'
chk insights "$(call $U $B/api/insights)" 'observations'
chk memory "$(call $U -X POST $B/api/memory -d '{"text":"My sister is called Meera"}')" 'id'
chk wearable "$(call $U -X PUT $B/api/wearable -d '{"rows":[{"day":"2026-11-19","sleepMinutes":400,"steps":5000,"restingHr":70,"activeMinutes":20}]}')" 'count'
chk reminder "$(call $U -X POST $B/api/reminders -d '{"kind":"check_in","dueAt":"2027-01-01T10:00:00.000Z"}')" 'id'
chk flow "$(call $U -X POST $B/api/modules/minimum_day/flow -d '{"answers":{"water":"drink water","tiny":"open laptop"}}')" 'text'
chk flow-crisis "$(call $U -X POST $B/api/modules/minimum_day/flow -d '{"answers":{"tiny":"I want to end my life tonight"}}')" '"crisis":true'
chk community-list "$(call $U $B/api/community)" 'items'
GID=$(call $U $B/api/community | python3 -c 'import sys,json;print(json.load(sys.stdin)["items"][0]["id"])')
chk join "$(call $U -X POST $B/api/community -d "{\"groupId\":\"$GID\",\"action\":\"join\"}")" 'ok'
chk post "$(call $U -X POST $B/api/community/$GID/posts -d '{"body":"Some days are harder than others."}')" 'id'
chk post-held "$(call $U -X POST $B/api/community/$GID/posts -d '{"body":"call me on 9876543210"}')" '"held":true'
chk family "$(call $U -X POST $B/api/family -d '{"topic":"career choice"}')" 'inviteCode'
chk pros "$(call $U $B/api/professionals)" 'items'
chk pro-apply "$(call $U -X POST $B/api/professionals -d '{"name":"Dr Test","credentialType":"counsellor","registrationBody":"RCI","registrationNo":"X1","qualifications":"MA","languages":["en"],"modes":["online"],"specialties":["anxiety"]}')" 'pending'
chk admin-denied "$(call $U $B/api/admin/overview)" 'error'
chk export "$(call $U $B/api/export)" 'private thought'
# admin
call $A -X POST $B/api/auth/signup -d "{\"email\":\"a$R@example.com\",\"password\":\"correct-horse-battery\",\"isAdult\":true}" >/dev/null
PGPASSWORD= psql -h localhost -p 5433 -U udaan udaan -qc "update users set role='admin' where email='a$R@example.com'" >/dev/null 2>&1
chk admin-overview "$(call $A $B/api/admin/overview)" 'launchChecks'
chk admin-content "$(call $A $B/api/admin/content)" 'items'
chk admin-approve-needs-reviewer "$(CID=$(call $A $B/api/admin/content | python3 -c 'import sys,json;print(json.load(sys.stdin)["items"][0]["id"])'); call $A -X PATCH $B/api/admin/content/$CID -d '{"status":"approved"}')" 'reviewer'
chk admin-moderation "$(call $A $B/api/admin/community)" 'held'
chk admin-incidents "$(call $A $B/api/admin/incidents)" 'items'
chk admin-settings "$(call $A $B/api/admin/settings)" 'modules'
chk admin-inst "$(call $A -X POST $B/api/admin/institutions -d '{"name":"Test College","kind":"university","minCohort":20}')" 'joinCode'
chk inst-dash "$(call $A $B/api/institution/dashboard)" 'error\|suppressed'
for p in / /welcome /recover /privacy /transparency /safe /hide /talk /grow /grow/breathing /reflect /care /me /admin /pro /org /onboarding; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -b $U $B$p); [ "$code" = "200" ] || [ "$code" = "307" ] && ok=$((ok+1)) || { bad=$((bad+1)); echo "FAIL page $p -> $code"; }; done
echo "passed=$ok failed=$bad"
