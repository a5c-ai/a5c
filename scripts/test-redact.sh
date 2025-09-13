#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="node"

pass=0; fail=0

expect_eq() {
  local got="$1"; shift
  local want="$1"; shift
  local msg="${1:-}"
  if [[ "$got" == "$want" ]]; then
    ((pass++))
    echo "ok - $msg"
  else
    ((fail++))
    echo "not ok - $msg"
    echo "   got:  $got"
    echo "   want: $want"
  fi
}

run_node() {
  "$NODE_BIN" -e "$1"
}

echo "# Redaction unit tests"

# 1. String redaction for GitHub PAT
got=$(run_node "const r=require('./scripts/redact.cjs');console.log(r.redactString('token ghp_1234567890abcdef1234567890abcdef1234'))")
expect_eq "$got" "REDACTED" "GitHub PAT masked in string"

# 2. JWT masking in string
got=$(run_node "const r=require('./scripts/redact.cjs');console.log(r.redactString('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.sgn'))")
expect_eq "$got" "REDACTED" "JWT masked in string"

# 3. Object key masking
got=$(run_node "const r=require('./scripts/redact.cjs');console.log(JSON.stringify(r.redactObject({password:'supersecret', nested:{api_key:'abc'}})))")
expect_eq "$got" '{"password":"REDACTED","nested":{"api_key":"REDACTED"}}' "Sensitive keys masked in object"

# 4. Values with patterns masked but non-sensitive keys preserved
got=$(run_node "const r=require('./scripts/redact.cjs');console.log(JSON.stringify(r.redactObject({note:'Bearer abcdefghijklmnop', ok:'hello'})))")
expect_eq "$got" '{"note":"REDACTED","ok":"hello"}' "Bearer masked in non-sensitive key value"

# 5. Env redaction
got=$(run_node "const r=require('./scripts/redact.cjs');console.log(JSON.stringify(r.redactEnv({STRIPE_SECRET_KEY:'sk_live_abcdef0123456789', NORMAL:'x'})))")
expect_eq "$got" '{"STRIPE_SECRET_KEY":"REDACTED","NORMAL":"x"}' "Env masking for known secrets"

echo "\n# Summary: $pass passed, $fail failed"
test $fail -eq 0
