#!/bin/sh
set -eu
APP=/home/codexops/apps/haiboss
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DEST=/home/codexops/backups/haiboss-candidate-$STAMP
# This is the new, isolated Haiboss database only. Existing projects are untouched.
test -f "$APP/shared/postgres/PG_VERSION"
test "$(systemctl --user is-active haiboss-cms.service || true)" != active
umask 077
mkdir -p "$DEST"
systemctl --user stop haiboss-postgres.service
trap 'systemctl --user start haiboss-postgres.service' EXIT
test ! -f "$APP/shared/postgres/postmaster.pid"
tar -C "$APP/shared" -czf "$DEST/postgres-media.tar.gz" postgres media
tar -C /home/codexops/.config -czf "$DEST/private-config.tar.gz" haiboss
tar -tzf "$DEST/postgres-media.tar.gz" >/dev/null
tar -tzf "$DEST/private-config.tar.gz" >/dev/null
sha256sum "$DEST/postgres-media.tar.gz" "$DEST/private-config.tar.gz" >"$DEST/SHA256SUMS"
systemctl --user start haiboss-postgres.service
trap - EXIT
printf '%s\n' "$DEST"
