#!/usr/bin/env bash
# InvoDesk Production Pilot Automated Backup Runner
set -euo pipefail

ENV_FILE="/home/sesame-ai/InvoDesk/config/pilot.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

LABEL="${1:-pilot-scheduled}"
/home/sesame-ai/InvoDesk/scripts/backup.sh "$LABEL"
