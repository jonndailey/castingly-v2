# Operations Notes: Servers & Access (Castingly)

This document is a quick reference for machines, SSH targets, and the common commands we use to deploy Castingly and apply database changes. It mirrors the Dailey Core OPERATIONS.md so either repo can be used to reorient quickly.

## Machines & Roles

- Dev Workstation ("king")
  - Castingly repo: `/home/jonny/apps/castingly-v2`
  - Dailey Core repo: `/home/jonny/apps/dailey-core`
  - Local MySQL for development (Castingly):
    - Host: `127.0.0.1`, Port: `3306`
    - User: `nikon`, Password: `@0509man1hattaN`
    - DB: `casting_portal`
  - Use case: edit code, run local DB, commit/push to GitHub, rsync to app server.

- App Server ("dev") — Castingly under PM2
  - SSH: `ssh dev`
  - Code: `~/apps/castingly-v2`
  - Build/Restart:
    - `npm run build`
    - `pm2 restart castingly-v2 --update-env`
  - Runtime: Next.js behind Apache → `http://127.0.0.1:3003` (domain: `https://castingly.dailey.dev`)
  - DB access (cluster via tunnel/service): `127.0.0.1:3307`, user `castingly_app`, DB `castingly`

- Database Cluster
  - coredb1 (primary): `40.160.239.176`
    - SSH: `ssh ubuntu@40.160.239.176`, then `sudo -i`
    - MySQL root password file: `/root/.mysql_root_pw`
    - App DB: `castingly`
    - Core DB: `dailey_core_auth`
  - coredb2 (replica): `40.160.239.175` (replicates from coredb1; do not write)

- Dailey Core (Auth)
  - Backend: `/home/jonny/apps/dailey-core/backend` (port 3002)
  - Frontend Admin: `/home/jonny/apps/dailey-core/frontend`

- Media API (DMAPI)
  - Base URL (prod): `https://media.dailey.cloud`
  - Buckets: `castingly-public`, `castingly-private`

## Quick Commands

### Deploy Castingly from king → dev
```bash
rsync -az --delete --exclude '.git' --exclude 'node_modules' --exclude '.next' \
      --exclude '.env.production' --exclude '.env.local' ./ dev:~/apps/castingly-v2/
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && npm run build && pm2 restart castingly-v2 --update-env"'
```

### Apply Inside Connect schema using app server env (cluster)
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node scripts/apply-inside-connect.mjs"'
```

### Apply Inside Connect schema on coredb1 as root
```bash
ssh ubuntu@40.160.239.176
sudo -i
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS castingly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p castingly < /home/ubuntu/apps/castingly-v2/database/migrations/20251026_inside_connect.sql
mysql -u root -p castingly < /home/ubuntu/apps/castingly-v2/database/migrations/20251026_inside_connect_fix_indexes.sql
```

### Seed Inside Connect data (listings + sample submissions)
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && \
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p$DB_PASSWORD -D castingly < scripts/seed-inside-connect.sql && \
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p$DB_PASSWORD -D castingly < scripts/seed-inside-connect-more.sql && \
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p$DB_PASSWORD -D castingly < scripts/seed-inside-connect-submissions-simple.sql"'
```

## AI/Automation Quick Reference

- Paths
  - Castingly: `/home/jonny/apps/castingly-v2` (king, dev)
  - Dailey Core: `/home/jonny/apps/dailey-core` (king)

- PM2
  - `castingly-v2` on dev (PORT=3003, Apache proxy)
  - (Core) `dailey-core-backend` (if running locally)

- Envs
  - `.env.local` (king): local dev, DB on 3306 (`casting_portal`)
  - `.env.production` (dev): cluster DB 127.0.0.1:3307 (`castingly`), PM2 `PORT=3003`

- DB endpoints
  - king local: 127.0.0.1:3306 user `nikon`
  - cluster primary: 40.160.239.176 (root pw in `/root/.mysql_root_pw`)
  - dev tunnel: 127.0.0.1:3307 user `castingly_app`, DB `castingly`

- Inside Connect files
  - Migrations: `database/migrations/20251026_inside_connect.sql`, `..._fix_indexes.sql`
  - Helper: `scripts/apply-inside-connect.mjs`
  - Seeds: `scripts/seed-inside-connect.sql`, `scripts/seed-inside-connect-more.sql`, `scripts/seed-inside-connect-submissions-simple.sql`

- Pitfalls
  - Collations (`utf8mb4_0900_ai_ci` vs `utf8mb4_unicode_ci`) can break `WHERE role='actor'` in seeds — avoid strict equals or specify explicit collation.
  - MySQL LIMIT/OFFSET placeholders may fail — inline validated numbers.
  - Mixed schemas: only update profile columns that exist (handled in code).

- Health Checks
  - `curl -sS http://127.0.0.1:3003/api/connect/listings`
  - `pm2 ls` (ensure `castingly-v2` online)
  - `mysql -h 127.0.0.1 -P 3307 -u castingly_app -p -D castingly -e "SHOW TABLES LIKE 'agencies';"`

