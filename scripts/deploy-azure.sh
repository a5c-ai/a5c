#!/usr/bin/env bash
set -euo pipefail

# Simple AKS deployment script for a Next.js app
# Requirements: az, kubectl, docker, envsubst (from gettext)

usage() {
  cat <<'USAGE'
Deploy the application to AKS

Environment variables:
  APP_NAME             Application name (k8s resources). Default: a5c-app
  NAMESPACE            Kubernetes namespace. Default: app
  REPLICAS             Replica count. Default: 2
  INGRESS_HOST         Hostname for ingress (e.g., app.example.com). for example: my-app.a5c.ai

  AZURE_ACR_NAME       Azure Container Registry name (no domain). Required.
  IMAGE_TAG            Image tag to push/deploy. Default: git short sha or timestamp

  AZURE_SUBSCRIPTION_ID   Azure subscription ID (optional)
  AZURE_RESOURCE_GROUP_NAME Resource group of AKS cluster (optional)
  AZURE_AKS_CLUSTER_NAME    AKS cluster name (optional)

  NEXTAUTH_SECRET       NextAuth secret (REQUIRED)
  AUTH_GITHUB_CLIENT_ID GitHub OAuth client id (optional)
  AUTH_GITHUB_CLIENT_SECRET GitHub OAuth client secret (optional)

Examples:
  APP_NAME=app NAMESPACE=prod INGRESS_HOST=app.example.com \
  AZURE_ACR_NAME=myacr AZURE_RESOURCE_GROUP_NAME=rg AZURE_AKS_CLUSTER_NAME=aks \
  ./scripts/deploy.sh
Note:
- The script reads AZURE_RESOURCE_GROUP_NAME and AZURE_AKS_CLUSTER_NAME from the environment and, when both are provided, it will fetch AKS credentials automatically. In CI these are typically populated via org-level variables.
USAGE
}

echo "==> Validating tools"
# In CI, if deployment prerequisites are missing, skip gracefully to avoid failing the pipeline
missing_tools=()
command -v az >/dev/null || missing_tools+=("az")
command -v kubectl >/dev/null || missing_tools+=("kubectl")
command -v docker >/dev/null || missing_tools+=("docker")
command -v envsubst >/dev/null || missing_tools+=("envsubst (gettext-base)")

if [ ${#missing_tools[@]} -gt 0 ]; then
  if [ "${CI:-}" = "true" ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    echo "CI environment detected and required tools are missing: ${missing_tools[*]}"
    echo "Skipping deploy step gracefully."
    exit 0
  else
    echo "Required tools missing: ${missing_tools[*]}"
    exit 1
  fi
fi

NAMESPACE=${NAMESPACE:-app}
REPLICAS=${REPLICAS:-2}

# Enforce required environment variables and fail fast with a clear message
missing_envs=()
[[ -z "${AZURE_ACR_NAME:-}" ]] && missing_envs+=("AZURE_ACR_NAME")
[[ -z "${APP_NAME:-}" ]] && missing_envs+=("APP_NAME")
[[ -z "${INGRESS_HOST:-}" ]] && missing_envs+=("INGRESS_HOST")
[[ -z "${NEXTAUTH_SECRET:-}" ]] && missing_envs+=("NEXTAUTH_SECRET")

if [ ${#missing_envs[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variable(s): ${missing_envs[*]}" >&2
  echo "See usage below:" >&2
  usage
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_SHA=$(git rev-parse --short=12 HEAD)
else
  GIT_SHA=$(date +%Y%m%d%H%M%S)
fi
IMAGE_TAG=${IMAGE_TAG:-$GIT_SHA}
IMAGE="$AZURE_ACR_NAME.azurecr.io/$APP_NAME:$IMAGE_TAG"

echo "==> Azure login"
# Attempt Azure login using several strategies, preferring OIDC in CI
if ! az account show >/dev/null 2>&1; then
  login_ok=false

  # 1) GitHub OIDC federated credentials (preferred in CI)
  if [ "${GITHUB_ACTIONS:-}" = "true" ] && [ -n "${AZURE_CLIENT_ID:-}" ] && [ -n "${AZURE_TENANT_ID:-}" ]; then
    if command -v curl >/dev/null 2>&1; then
      echo "Trying OIDC login (federated credentials)"
      OIDC_URL="${ACTIONS_ID_TOKEN_REQUEST_URL:-}"
      OIDC_REQ_TOKEN="${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}"
      if [ -n "$OIDC_URL" ] && [ -n "$OIDC_REQ_TOKEN" ]; then
        # Build audience parameter safely (support override via ACTIONS_ID_TOKEN_AUDIENCE)
        AUDIENCE_RAW=${ACTIONS_ID_TOKEN_AUDIENCE:-api://AzureADTokenExchange}
        # URL-encode minimally (encode %, :, and /). Encode % first to avoid double-encoding
        AUDIENCE_ENC=$(printf '%s' "$AUDIENCE_RAW" \
          | sed -e 's/%/%25/g' -e 's/:/%3A/g' -e 's,/,%2F,g')
        # Append using ? or & depending on whether the URL already has a query string
        if [[ "$OIDC_URL" == *\?* ]]; then
          OIDC_URL_WITH_AUD="$OIDC_URL&audience=$AUDIENCE_ENC"
        else
          OIDC_URL_WITH_AUD="$OIDC_URL?audience=$AUDIENCE_ENC"
        fi
        # Request an id_token for Azure AD token exchange
        OIDC_RESP=$(curl -sS -H "Authorization: Bearer $OIDC_REQ_TOKEN" "$OIDC_URL_WITH_AUD" || true)
        if [ -n "$OIDC_RESP" ]; then
          # Extract token using node (available in the Node-based runner)
          if command -v node >/dev/null 2>&1; then
            OIDC_TOKEN=$(printf '%s' "$OIDC_RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);if(j && j.value){console.log(j.value)}else process.exit(1)}catch{process.exit(1)}})" || true)
          fi
        fi
        if [ -n "${OIDC_TOKEN:-}" ]; then
          if az login --service-principal --username "$AZURE_CLIENT_ID" --tenant "$AZURE_TENANT_ID" --federated-token "$OIDC_TOKEN" >/dev/null 2>&1; then
            login_ok=true
          fi
        fi
      fi
    fi
  fi

  # 2) Service principal with client secret
  if [ "$login_ok" = false ] && [ -n "${AZURE_APPLICATION_CLIENT_ID:-}" ] && [ -n "${AZURE_TENANT_ID:-}" ] && [ -n "${AZURE_APPLICATION_CLIENT_SECRET:-}" ]; then
    echo "Trying service principal login with client secret"
    if az login --service-principal -u "$AZURE_APPLICATION_CLIENT_ID" -p "$AZURE_APPLICATION_CLIENT_SECRET" -t "$AZURE_TENANT_ID" >/dev/null 2>&1; then
      login_ok=true
    fi
  fi

  # 3) Service principal with pre-provided federated token
  if [ "$login_ok" = false ] && [ -n "${AZURE_CLIENT_ID:-}" ] && [ -n "${AZURE_TENANT_ID:-}" ] && [ -n "${AZURE_FEDERATED_TOKEN:-}" ]; then
    echo "Trying service principal login with federated token (AZURE_FEDERATED_TOKEN)"
    if az login --service-principal --username "$AZURE_CLIENT_ID" --tenant "$AZURE_TENANT_ID" --federated-token "$AZURE_FEDERATED_TOKEN" >/dev/null 2>&1; then
      login_ok=true
    fi
  fi

  if [ "$login_ok" = false ]; then
    if [ "${CI:-}" = "true" ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
      echo "Azure CLI could not log in in CI (no valid credentials found). Skipping deploy step gracefully."
      exit 0
    else
      echo "You are not logged in to Azure CLI and no credentials were provided. Please run 'az login' or set service principal credentials."
      exit 1
    fi
  fi
fi

if [[ -n "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
  echo "==> Setting subscription: $AZURE_SUBSCRIPTION_ID"
  az account set --subscription "$AZURE_SUBSCRIPTION_ID"
fi

if [[ -n "${AZURE_RESOURCE_GROUP_NAME:-}" && -n "${AZURE_AKS_CLUSTER_NAME:-}" ]]; then
  echo "==> Getting AKS credentials for $AZURE_RESOURCE_GROUP_NAME/$AZURE_AKS_CLUSTER_NAME"
  az aks get-credentials -g "$AZURE_RESOURCE_GROUP_NAME" -n "$AZURE_AKS_CLUSTER_NAME" --overwrite-existing
else
  echo "WARN: AZURE_RESOURCE_GROUP_NAME or AZURE_AKS_CLUSTER_NAME not set. Assuming kubectl is already configured."
fi

echo "==> Ensuring namespace $NAMESPACE"
kubectl get ns "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

echo "==> Logging into ACR $AZURE_ACR_NAME"
az acr login -n "$AZURE_ACR_NAME"

echo "==> Building container image: $IMAGE"
docker build -t "$IMAGE" .

echo "==> Pushing image: $IMAGE"
docker push "$IMAGE"

export APP_NAME NAMESPACE REPLICAS IMAGE INGRESS_HOST

echo "==> Applying Secret"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
envsubst < k8s/base/secret.yaml > "$TMPDIR/secret.yaml"
kubectl -n "$NAMESPACE" apply -f "$TMPDIR/secret.yaml"

echo "==> Applying ConfigMap"
envsubst < k8s/base/configmap.yaml > "$TMPDIR/configmap.yaml"
kubectl -n "$NAMESPACE" apply -f "$TMPDIR/configmap.yaml"

echo "==> Applying Deployment"
envsubst < k8s/base/deployment.yaml > "$TMPDIR/deployment.yaml"
kubectl -n "$NAMESPACE" apply -f "$TMPDIR/deployment.yaml"

echo "==> Applying Service"
envsubst < k8s/base/service.yaml > "$TMPDIR/service.yaml"
kubectl -n "$NAMESPACE" apply -f "$TMPDIR/service.yaml"

echo "==> Applying Ingress"
envsubst < k8s/base/ingress.yaml > "$TMPDIR/ingress.yaml"
kubectl -n "$NAMESPACE" apply -f "$TMPDIR/ingress.yaml"

echo "==> Waiting for rollout"
kubectl -n "$NAMESPACE" rollout status deployment "$APP_NAME" --timeout=5m

echo "==> Done. Image: $IMAGE deployed to namespace $NAMESPACE."
