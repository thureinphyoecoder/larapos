# POS Backup Plan (Local + Server)

## Objectives
- RPO: 15 minutes (transaction loss tolerance)
- RTO: 60 minutes (restore and service back online)
- Coverage: database, uploaded files (`storage/app/public`), environment/config snapshots

## Local Backup (Branch Office)
- Frequency: every 30 minutes incremental + end-of-day full backup
- Storage path: `/var/backups/larapee/local/`
- Retention: 7 days
- Artifacts:
  - `db-YYYYmmdd-HHMM.sql.gz`
  - `public-uploads-YYYYmmdd-HHMM.tar.zst`
  - `config-YYYYmmdd-HHMM.tar.zst` (`.env`, deployment manifests, nginx/app configs)

### Local Cron
```bash
*/30 * * * * mysqldump --single-transaction --quick --lock-tables=false larapos | gzip > /var/backups/larapee/local/db-$(date +\%Y\%m\%d-\%H\%M).sql.gz
15 23 * * * tar -C /var/www/storage/app/public -c . | zstd -T0 -19 -o /var/backups/larapee/local/public-uploads-$(date +\%Y\%m\%d-\%H\%M).tar.zst
```

## Server Backup (Central)
- Frequency: hourly sync from branch + nightly immutable snapshot
- Transport: `rsync` over SSH with key rotation
- Storage targets:
  - Hot: object storage bucket (30 days)
  - Cold: immutable archive (90-365 days)

### Server Pull Job
```bash
rsync -az --delete branch-node:/var/backups/larapee/local/ /srv/backups/larapee/branches/branch-001/
```

## Verification
- Every backup run writes entry into `backup_runs` table (`pending/success/failed`)
- Daily at 02:30 run checksum verification (`sha256sum`)
- Weekly restore drill to staging from latest full + incrementals

## Restore Runbook (High Level)
1. Stop API workers and queue consumers.
2. Restore DB from latest valid dump.
3. Restore file archive to `storage/app/public`.
4. Run `php artisan migrate --force` and cache warmups.
5. Validate API health + POS login + sample order creation.
6. Re-enable workers and monitor logs for 30 minutes.

## Security
- Encrypt backups at rest and in transit.
- Restrict backup operator role to least privilege.
- Keep restore credentials separate from application credentials.
