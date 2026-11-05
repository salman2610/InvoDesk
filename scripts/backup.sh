#!/usr/bin/env bash
# InvoDesk PostgreSQL backup
# Usage: scripts/backup.sh [label]
# Env:   PGHOST (127.0.0.1) PGPORT (5433) PGUSER (postgres) PGDATABASE (invodesk)
#        BACKUP_DIR (./backups)  BACKUP_RETENTION_DAYS (14)
set -euo pipefail

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-invodesk}"
BACKUP_DIR="${BACKUP_DIR:-$(cd "$(dirname "$0")/.." && pwd)/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
LABEL="${1:-scheduled}"

# Pin client tools to the server's major version. On hosts with several
# PostgreSQL versions installed, Ubuntu's pg_wrapper can pick a newer pg_dump
# whose archive format older pg_restore binaries cannot read.
PGMAJOR="${PGMAJOR:-$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc 'show server_version_num' | cut -c1-2)}"
PGBIN="${PGBIN:-/usr/lib/postgresql/${PGMAJOR}/bin}"
[ -x "$PGBIN/pg_dump" ] || PGBIN="$(dirname "$(command -v pg_dump)")"
pg_dump()    { "$PGBIN/pg_dump" "$@"; }
pg_restore() { "$PGBIN/pg_restore" "$@"; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/invodesk-${STAMP}-${LABEL}.dump"

# Custom format: compressed, supports selective & parallel restore.
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  --format=custom --no-owner --no-privileges --file="$FILE"

# Integrity check: archive must be readable and list its table of contents.
TABLES=$(pg_restore --list "$FILE" | grep -c "TABLE DATA" || true)
if [ "$TABLES" -lt 1 ]; then
  echo "{\"level\":\"error\",\"event\":\"backup_failed\",\"file\":\"$FILE\",\"reason\":\"no table data in archive\"}" >&2
  exit 1
fi

(cd "$(dirname "$FILE")" && sha256sum "$(basename "$FILE")" > "$(basename "$FILE").sha256")
SIZE=$(stat -c %s "$FILE")

# Retention
find "$BACKUP_DIR" -name 'invodesk-*.dump' -mtime +"$RETENTION_DAYS" -print -delete | sed 's/^/pruned: /' >&2 || true
find "$BACKUP_DIR" -name 'invodesk-*.dump.sha256' -mtime +"$RETENTION_DAYS" -delete || true

echo "{\"level\":\"info\",\"event\":\"backup_ok\",\"file\":\"$FILE\",\"bytes\":$SIZE,\"tables\":$TABLES}"
