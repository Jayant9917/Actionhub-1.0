#!/usr/bin/env bash
set -euo pipefail
umask 077

main() {
  local state_dir release current backup services service host
  local -a compose

  state_dir=$(git rev-parse --absolute-git-dir)/actionhub-cd
  mkdir -p "$state_dir"
  exec 9>"$state_dir/lock"
  flock -n 9 || return 0

  if [[ -e "$state_dir/in-progress" ]]; then
    echo "Deployment paused after an incomplete release. See deploy/README.md." >&2
    return 1
  fi

  git fetch --no-tags origin refs/heads/production
  release=$(git rev-parse 'FETCH_HEAD^{commit}')
  current=$(git rev-parse HEAD)
  [[ "$release" != "$current" ]] || return 0

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Deployment stopped because the checkout has local changes." >&2
    return 1
  fi
  if ! git merge-base --is-ancestor "$current" "$release"; then
    echo "Deployment stopped because the release is not a descendant of the current checkout." >&2
    return 1
  fi

  compose=(sudo -n docker compose --env-file .env.production -f compose.production.yaml)
  printf '%s %s\n' "$current" "$release" > "$state_dir/in-progress"

  if ! git diff --quiet "$current" "$release" -- primary-backend/prisma/migrations; then
    backup="$state_dir/pre-$release.dump"
    "${compose[@]}" exec -T postgres pg_dump -U actionhub -d actionhub -Fc > "$backup.tmp"
    mv "$backup.tmp" "$backup"
    printf 'Pre-migration backup saved at %s\n' "$backup"
  fi

  git checkout --detach "$release"
  "${compose[@]}" config --quiet
  "${compose[@]}" up -d --build --wait --wait-timeout 180

  services=$("${compose[@]}" ps --status running --services)
  for service in postgres kafka gateway primary-backend hooks processor worker; do
    if ! grep -Fxq "$service" <<< "$services"; then
      printf 'Service is not running: %s\n' "$service" >&2
      return 1
    fi
  done
  host=$(sed -n 's/^ACTIONHUB_API_HOST=//p' .env.production)
  if [[ ! "$host" =~ ^[a-zA-Z0-9.-]+$ ]]; then
    echo "ACTIONHUB_API_HOST must be a bare DNS hostname." >&2
    return 1
  fi
  curl --fail --silent --show-error --retry 3 --max-time 10 --output /dev/null "https://$host/api/v1/trigger/available"

  rm -- "$state_dir/in-progress"
  printf 'Deployed %s\n' "$release"
}

main "$@"
