#!/bin/sh
set -eu
ROOT=/home/codexops/apps/haiboss/releases/20261103-content-v1
# Keep the public static site and durable inquiry intake running while taking a
# clean, project-only PostgreSQL snapshot. No existing backup is pruned here.
if curl --silent --fail --max-time 5 http://127.0.0.1:45203/health | grep -q '"building":true'; then
 echo 'Backup deferred while a content publication is building' >&2
 exit 1
fi
systemctl --user stop haiboss-cms.service
trap 'systemctl --user start haiboss-postgres.service haiboss-cms.service' EXIT
sh "$ROOT/deploy/backup-candidate.sh"
systemctl --user start haiboss-postgres.service haiboss-cms.service
trap - EXIT
