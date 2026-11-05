# InvoDesk Enterprise Backup, Restore & Disaster Recovery Guide

This document outlines automated procedures and verification routines for protecting InvoDesk production PostgreSQL databases.

---

## 1. Automated Backups
InvoDesk includes a production backup utility at `scripts/backup.sh`.

### Execution:
```bash
# Run manual on-demand backup
./scripts/backup.sh daily-close

# Crontab schedule for automatic nightly backups (at 2:00 AM)
0 2 * * * /home/sesame-ai/InvoDesk/scripts/backup.sh nightly >> /var/log/invodesk-backup.log 2>&1
```

### Characteristics:
- **Format**: PostgreSQL Custom Compressed Archive (`.dump`), compatible with selective table restoration.
- **Verification**: Automatically computes SHA-256 integrity checksums (`.sha256`) and runs table-of-contents validation.
- **Retention**: Prunes backup archives older than 14 days automatically (configurable via `BACKUP_RETENTION_DAYS`).

---

## 2. Recovery & Restoration
InvoDesk provides `scripts/restore.sh` to safely restore backups without risking accidental data loss.

### Safe Verification Procedure:
```bash
# 1. Restore into an isolated verification database
./scripts/restore.sh backups/invodesk-20261105-102153-pre-phase6-migration.dump invodesk_test_verify --force

# 2. Check record counts
psql -h 127.0.0.1 -p 5433 -U postgres -d invodesk_test_verify -c "SELECT count(*) FROM \"Invoice\";"
```

### Anti-Tamper & Corruption Defense:
- `restore.sh` validates the archive's SHA-256 checksum prior to execution.
- If an archive has been altered, corrupted, or tampered with, restoration is halted immediately with an explicit error code.
- Overwrite protection requires the explicit `--force` flag to replace existing target databases.

