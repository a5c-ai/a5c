set -e

GITLAB_REF=${GITLAB_REF:-main}
GITLAB_USERNAME=${GITLAB_USERNAME:-gitlab-bot}
GITLAB_EMAIL=${GITLAB_EMAIL:-gitlab-bot@example.com}
CLOUD_SETUP=${A5C_CLOUD_SETUP:-false}
GIT_SETUP=${GIT_SETUP:-true}
GITLAB_TOKEN=${GITLAB_TOKEN:-${GL_TOKEN:-}}
GITLAB_HOST=${GITLAB_HOST:-https://gitlab.com}

if [ "$GIT_SETUP" = "true" ]; then
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    REPO_DIR=repo
    PROJECT_PATH=${GITLAB_PROJECT_PATH:-${GITLAB_REPOSITORY:-}}
    if [ -z "$PROJECT_PATH" ]; then
      echo "GITLAB_PROJECT_PATH or GITLAB_REPOSITORY must be set" >&2
      exit 1
    fi

    REMOTE_URL="${GITLAB_HOST}/${PROJECT_PATH}.git"
    if [ -n "$GITLAB_TOKEN" ]; then
      REMOTE_URL="https://oauth2:${GITLAB_TOKEN}@${GITLAB_HOST#https://}/${PROJECT_PATH}.git"
    fi

    rm -rf "$REPO_DIR"
    if git clone "$REMOTE_URL" "$REPO_DIR" --depth 1 >/dev/null 2>&1; then
      echo "Cloned repository to $PWD/$REPO_DIR"
    else
      echo "Clone failed; ensure GITLAB_TOKEN is available and has api scope." >&2
      exit 0
    fi

    cd "$REPO_DIR" || { echo "Cannot cd to $REPO_DIR" >&2; exit 1; }
    echo "Now in repository $PWD"
    git remote set-url origin "$REMOTE_URL" >/dev/null 2>&1 || true

    CLEAN_REF="$GITLAB_REF"
    case "$CLEAN_REF" in
      refs/heads/*) CLEAN_REF=${CLEAN_REF#refs/heads/} ;;
    esac
    if [ -n "$CLEAN_REF" ]; then
      git fetch --no-tags --depth=1 origin "+refs/heads/$CLEAN_REF:refs/remotes/origin/$CLEAN_REF" >/dev/null 2>&1 || true
    fi

    REF_BRANCH="$GITLAB_REF"
    case "$REF_BRANCH" in
      refs/heads/*) REF_BRANCH=${REF_BRANCH#refs/heads/} ;;
    esac

    if [ -n "$REF_BRANCH" ] && [ "$REF_BRANCH" != "main" ]; then
      if git ls-remote --exit-code --heads origin "$REF_BRANCH" >/dev/null 2>&1; then
        git checkout -B "$REF_BRANCH" "origin/$REF_BRANCH"
      else
        git checkout -B main origin/main || git checkout main
        git checkout -B "$REF_BRANCH" main
      fi
    else
      git checkout -B main origin/main || git checkout main
    fi
  fi

  git config user.name "$GITLAB_USERNAME"
  git config user.email "$GITLAB_EMAIL"
fi

if [ -f ".a5c/hooks/pre-agent-run.sh" ]; then
  echo "Running agent pre-run hook..."
  . .a5c/hooks/pre-agent-run.sh
  echo "Agent pre-run hook completed"
else
  echo "Agent pre-run hook disabled"
fi

if [ "$CLOUD_SETUP" = "true" ]; then
  echo "Checking for cloud provider credentials..."
  if [[ -n "$AZURE_APPLICATION_CLIENT_ID" && -n "$AZURE_APPLICATION_CLIENT_SECRET" && -n "$AZURE_TENANT_ID" ]]; then
    echo "Azure credentials detected, installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    az login --service-principal \
      --username "$AZURE_APPLICATION_CLIENT_ID" \
      --password "$AZURE_APPLICATION_CLIENT_SECRET" \
      --tenant "$AZURE_TENANT_ID"
    echo "Azure CLI authentication successful"
  fi

  if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$AWS_SECRET_ACCESS_KEY" ]]; then
    echo "AWS credentials detected, installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws/
    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    if [[ -n "$AWS_DEFAULT_REGION" ]]; then
      aws configure set default.region "$AWS_DEFAULT_REGION"
    fi
    if [[ -n "$AWS_SESSION_TOKEN" ]]; then
      aws configure set aws_session_token "$AWS_SESSION_TOKEN"
    fi
    aws sts get-caller-identity
  fi

  if [[ -n "$GOOGLE_APPLICATION_CREDENTIALS" || -n "$GCP_SA_KEY" ]]; then
    echo "Google Cloud credentials detected, installing Google Cloud CLI..."
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
    sudo apt-get update && sudo apt-get install -y google-cloud-cli
    if [[ -n "$GCP_SA_KEY" ]]; then
      echo "$GCP_SA_KEY" | base64 -d > /tmp/gcp-key.json
      gcloud auth activate-service-account --key-file=/tmp/gcp-key.json
      rm /tmp/gcp-key.json
    elif [[ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]]; then
      gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
    fi
    if [[ -n "$GCP_PROJECT_ID" ]]; then
      gcloud config set project "$GCP_PROJECT_ID"
    fi
    gcloud auth list
  fi
fi

if command -v glab >/dev/null 2>&1; then
  if ! glab auth status --hostname "${GITLAB_HOST#https://}" >/dev/null 2>&1; then
    if [ -n "$GITLAB_TOKEN" ]; then
      printf '%s\n' "$GITLAB_TOKEN" | glab auth login --hostname "${GITLAB_HOST#https://}" --stdin >/dev/null 2>&1 || true
    else
      echo "GITLAB_TOKEN not set; glab commands may fail" >&2
    fi
  fi
else
  echo "glab CLI not installed; GitLab-specific commands may fail" >&2
fi

npx -y "$A5C_PKG_SPEC" generate_context \
    --in "$A5C_EVENT_PATH" \
    --template "$A5C_TEMPLATE_URI" --out /tmp/prompt.md
npx -y "$A5C_PKG_SPEC" run \
    --in /tmp/prompt.md \
    --out /tmp/last_message.txt \
    --profile "$A5C_CLI_PROFILE" \
    --mcps "$A5C_MCPS_PATH" | tee /tmp/full_output.txt | npx -y "$A5C_PKG_SPEC" parse \
    --type codex --out /tmp/parsed-codex.jsonl --pretty

if [ -f ".a5c/hooks/post-agent-run.sh" ]; then
  echo "Running agent post-run hook..."
  . .a5c/hooks/post-agent-run.sh
  echo "Agent post-run hook completed"
fi
