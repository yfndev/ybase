#!/usr/bin/env bash
#
# Setzt das frisch gebaute Image in Coolify, stösst das Deployment an und
# wartet, bis es abgeschlossen ist. Bricht mit Exit-Code != 0 ab, wenn das
# Deployment fehlschlaegt oder das Zeitlimit reisst.
#
# Erwartete Umgebung:
#   COOLIFY_URL       z.B. https://coolify.youngfounders.network
#   COOLIFY_TOKEN     API-Token mit Deploy-Berechtigung
#   COOLIFY_APP_UUID  UUID der Anwendung in Coolify
#   IMAGE_TAG         eindeutiger Tag des neuen Images, z.B. sha-a1b2c3d
#   TAG_MODE          "image" -> Tag in docker_registry_image_tag schreiben
#                     "env"   -> Tag in die Env-Variable IMAGE_TAG schreiben
#   DEPLOY_TIMEOUT    optional, Sekunden bis zum Abbruch (Standard 900)

set -euo pipefail

: "${COOLIFY_URL:?COOLIFY_URL fehlt}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN fehlt}"
: "${COOLIFY_APP_UUID:?COOLIFY_APP_UUID fehlt}"
: "${IMAGE_TAG:?IMAGE_TAG fehlt}"
: "${TAG_MODE:?TAG_MODE fehlt}"

TIMEOUT="${DEPLOY_TIMEOUT:-900}"
API="${COOLIFY_URL%/}/api/v1"
AUTH="Authorization: Bearer ${COOLIFY_TOKEN}"

# Fuehrt einen API-Aufruf aus und trennt Body von HTTP-Status.
# Gibt den Body auf stdout aus; schlaegt bei Status >= 400 fehl.
api() {
  local method="$1" path="$2" body="${3:-}"
  local out status
  if [ -n "$body" ]; then
    out=$(curl -sS -X "$method" -H "$AUTH" -H "Content-Type: application/json" \
      -d "$body" -w $'\n%{http_code}' "${API}${path}")
  else
    out=$(curl -sS -X "$method" -H "$AUTH" -w $'\n%{http_code}' "${API}${path}")
  fi
  status="${out##*$'\n'}"
  body="${out%$'\n'*}"
  if [ "$status" -ge 400 ]; then
    echo "::error::Coolify ${method} ${path} antwortete HTTP ${status}: ${body}" >&2
    return 1
  fi
  printf '%s' "$body"
}

echo "==> Setze Image-Tag ${IMAGE_TAG} (Modus: ${TAG_MODE})"
case "$TAG_MODE" in
  image)
    api PATCH "/applications/${COOLIFY_APP_UUID}" \
      "$(printf '{"docker_registry_image_tag":"%s"}' "$IMAGE_TAG")" >/dev/null
    ;;
  env)
    # PATCH legt die Variable an, falls sie noch nicht existiert.
    api PATCH "/applications/${COOLIFY_APP_UUID}/envs" \
      "$(printf '{"key":"IMAGE_TAG","value":"%s","is_literal":false}' "$IMAGE_TAG")" >/dev/null
    ;;
  *)
    echo "::error::Unbekannter TAG_MODE: ${TAG_MODE} (erlaubt: image, env)" >&2
    exit 1
    ;;
esac

echo "==> Starte Deployment"
# Coolify hat den Endpunkt auf POST umgestellt; ein GET antwortet seit dem
# Wechsel mit HTTP 405 ("This endpoint has changed to a POST request.") und
# liess jedes Deployment nach erfolgreichem Image-Build scheitern.
deploy_response=$(api POST "/deploy?uuid=${COOLIFY_APP_UUID}&force=false")
deployment_uuid=$(printf '%s' "$deploy_response" | python3 -c '
import json, sys
data = json.load(sys.stdin)
items = data.get("deployments") or []
if not items:
    sys.exit("Coolify hat kein Deployment gestartet: " + json.dumps(data))
print(items[0]["deployment_uuid"])
')
echo "    Deployment-UUID: ${deployment_uuid}"

echo "==> Warte auf Abschluss (Zeitlimit ${TIMEOUT}s)"
elapsed=0
interval=10
last_status=""
while [ "$elapsed" -lt "$TIMEOUT" ]; do
  sleep "$interval"
  elapsed=$((elapsed + interval))

  status=$(api GET "/deployments/${deployment_uuid}" | python3 -c '
import json, sys
print(json.load(sys.stdin).get("status", "unknown"))
')

  if [ "$status" != "$last_status" ]; then
    echo "    [${elapsed}s] ${status}"
    last_status="$status"
  fi

  case "$status" in
    finished)
      echo "==> Deployment erfolgreich (${elapsed}s)"
      exit 0
      ;;
    failed|cancelled-by-user)
      echo "::error::Deployment endete mit Status '${status}'. Logs: ${COOLIFY_URL}/project" >&2
      exit 1
      ;;
  esac
done

echo "::error::Zeitlimit von ${TIMEOUT}s erreicht, letzter Status: '${last_status}'." >&2
echo "Das Deployment laeuft in Coolify moeglicherweise weiter." >&2
exit 1
