#!/usr/bin/env bash
set -Eeuo pipefail

readonly COMMIT_SHA="${1:?commit SHA is required}"
readonly SOURCE_DIR="${2:-/home/ubuntu/devmeet}"
if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit SHA" >&2
  exit 2
fi

exec 9>/tmp/devmeet-deploy.lock
if ! flock -n 9; then
  echo "Another devmeet deployment is already running" >&2
  exit 3
fi

cd "$SOURCE_DIR"

readonly CURRENT_SHA="$(git rev-parse HEAD)"
if [[ "$CURRENT_SHA" != "$COMMIT_SHA" ]]; then
  echo "Checked-out commit does not match requested deployment" >&2
  exit 4
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Tracked worktree changes detected; refusing to deploy" >&2
  git status --short
  exit 5
fi

readonly IMAGE_TAG="sha-${COMMIT_SHA:0:12}"
readonly IMAGE="docker.io/library/devmeet:${IMAGE_TAG}"
readonly PREVIOUS_IMAGE="$(sudo kubectl get deployment devmeet -o jsonpath='{.spec.template.spec.containers[0].image}')"
deploy_started=0

rollback() {
  local exit_code=$?
  if [[ "$deploy_started" == "1" ]]; then
    echo "Deployment failed; rolling back to ${PREVIOUS_IMAGE}" >&2
    sudo kubectl set image deployment/devmeet "devmeet=${PREVIOUS_IMAGE}" >/dev/null
    sudo kubectl rollout status deployment/devmeet --timeout=120s || true
  fi
  exit "$exit_code"
}
trap rollback ERR

docker build -t "$IMAGE" .
docker save "$IMAGE" | sudo k3s ctr images import -

DEPLOY_IMAGE="$IMAGE" python3 - <<'PYEOF'
from pathlib import Path
import os
import yaml

image = os.environ["DEPLOY_IMAGE"]
manifest = Path("k8s-manifest.yaml")
documents = [
    document
    for document in yaml.safe_load_all(manifest.read_text(encoding="utf-8"))
    if document
]
patched = 0
for document in documents:
    if document.get("kind") != "Deployment":
        continue
    for container in document["spec"]["template"]["spec"]["containers"]:
        if container["name"] == "devmeet":
            container["image"] = image
            patched += 1
if patched != 1:
    raise SystemExit(f"Expected exactly one devmeet container to patch, found {patched}")
Path("/tmp/devmeet-resources.yaml").write_text(
    yaml.safe_dump_all(documents, sort_keys=False),
    encoding="utf-8",
)
PYEOF

deploy_started=1
sudo kubectl apply -f /tmp/devmeet-resources.yaml
sudo kubectl rollout status deployment/devmeet --timeout=120s

readonly DEPLOYED_IMAGE="$(sudo kubectl get deployment devmeet -o jsonpath='{.spec.template.spec.containers[0].image}')"
if [[ "$DEPLOYED_IMAGE" != "$IMAGE" ]]; then
  echo "Deployment image verification failed" >&2
  false
fi

readonly HEALTH="$(curl --fail --silent --show-error --retry 10 --retry-delay 3 https://devmeet.zmint.dev/healthz)"
if [[ "$HEALTH" != "ok" ]]; then
  echo "Production health check returned an unexpected response" >&2
  false
fi

deploy_started=0
trap - ERR
echo "Deployed ${IMAGE} from ${COMMIT_SHA}"
