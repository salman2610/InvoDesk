#!/usr/bin/env bash
# InvoDesk PostgreSQL restore
# Usage: scripts/restore.sh <backup.dump> <target_database> [--force]
#
# Restores into <target_database>. Refuses to overwrite an existing database
# unless --force is given. Recommended practice: restore into a NEW database
# (e.g. invodesk_restore), verify it, then switch DATABASE_URL.
set -euo pipefail

FILE="${1:?usage: restore.sh <backup.dump> <target_database> [--force]}"
TARGET="${2:?usage: restore.sh <backup.dump> <target_database> [--force]}"
FORCE="${3:-}"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"

[ -f "$FILE" ] || { echo "backup not found: $FILE" >&2; exit 1; }

# Pin client tools to the server's major version (see backup.sh).
PGMAJOR="${PGMAJOR:-$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc 'show server_version_num' | cut -c1-2)}"
PGBIN="${PGBIN:-/usr/lib/postgresql/${PGMAJOR}/bin}"
[ -x "$PGBIN/pg_restore" ] || PGBIN="$(dirname "$(command -v pg_restore)")"
pg_restore() { "$PGBIN/pg_restore" "$@"; }
createdb()   { "$PGBIN/createdb" "$@"; }
dropdb()     { "$PGBIN/dropdb" "$@"; }

if [ -f "$FILE.sha256" ]; then
  (cd "$(dirname "$FILE")" && sha256sum --check --status "$(basename "$FILE").sha256") \
    || { echo "checksum mismatch: $FILE (archive corrupted or modified)" >&2; exit 1; }
else
  echo "warning: no checksum file for $FILE; integrity not verified" >&2
fi

EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${TARGET}'")

if [ "$EXISTS" = "1" ]; then
  if [ "$FORCE" != "--force" ]; then
    echo "database '$TARGET' exists. Re-run with --force to drop and replace it." >&2
    exit 1
  fi
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${TARGET}' AND pid<>pg_backend_pid();" >/dev/null
  dropdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$TARGET"
fi

createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$TARGET"
pg_restore -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TARGET" \
  --no-owner --no-privileges --exit-on-error "$FILE"

echo "{\"level\":\"info\",\"event\":\"restore_ok\",\"file\":\"$FILE\",\"database\":\"$TARGET\"}"
