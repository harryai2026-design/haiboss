#!/bin/sh
set -eu
# A complete build cgroup is capped, including all compiler children. No global
# dependency upgrades, system limits or other application services are changed.
ROOT=/home/codexops/apps/haiboss/releases/20261103-content-v1
exec systemd-run --user --unit=haiboss-cms-build --collect \
  --property=WorkingDirectory="$ROOT" \
  --property=MemoryMax=1200M --property=MemoryHigh=900M \
  --property=CPUQuota=80% --property=TasksMax=64 \
  --property=OOMPolicy=stop --property=KillMode=control-group \
  --property=TimeoutStartSec=900 \
  --setenv=NODE_OPTIONS=--max-old-space-size=512 \
  --setenv=NEXT_TELEMETRY_DISABLED=1 \
  /usr/bin/node --env-file=.env scripts/run.mjs cms:build
