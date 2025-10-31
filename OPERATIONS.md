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
### Backfill actor avatar pointers (prod)
Use this when avatars exist in DMAPI but `users.avatar_url`/`profiles.metadata.avatar` are missing.

Via app (preferred):
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node scripts/backfill-avatars-via-app.mjs --force --host http://127.0.0.1:3003"'
```

Via DMAPI service (if Core login works for the service account):
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node scripts/backfill-avatars.mjs --force"'
```

Single user:
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node scripts/backfill-avatars-via-app.mjs --id 1024 --host http://127.0.0.1:3003"'
```

### Backfill DMAPI media metadata (category/sourceActorId)
Normalizes existing DMAPI media so server-side queries use fast metadata (instead of folder fallbacks). New admin route accepts Core admin tokens, X-Admin-Secret, or a dmapi_ API key for auth and supports small, safe batches.

Run (dry run) for a single actor:
```bash
curl -sS -X POST 'https://castingly.dailey.dev/api/admin/media/backfill?userId=<actor-uuid>&dry=1' \
  -H 'Authorization: Bearer <Core admin token or dmapi_ key>' | jq .
```

Run (apply) headshots in a small batch:
```bash
curl -sS -X POST 'https://castingly.dailey.dev/api/admin/media/backfill?userId=<actor-uuid>&dry=0&category=headshot&max=50' \
  -H 'Authorization: Bearer <Core admin token or dmapi_ key>' | jq .
```

Notes and prerequisites:
- Core/DMAPI alignment: the service account `dmapi-service@castingly.com` must be enrolled in Core app `castingly` (tenant `castingly`).
- DMAPI change needed (small) to complete writes via API: either
  - enable `/api/files` listing for `app_id=castingly` so it returns DB records (ids) for `user_id=…`, or
  - add a lookup filter by `storage_key` to resolve ids. Once one of these is available, the backfill route will PATCH ids directly (it already throttles and retries).
- Until the above change, the route will enumerate candidates from bucket folders and report totals, but PATCH may return rate-limit or endpoint-not-found errors.

Gallery rendering:
- The profile/gallery grid shows only small variants to improve load time.
- Clicking any image opens the full-size image from DMAPI (original if present; else the largest variant).

Profile & Media diagnostics:
- `/api/actors/:id` sets `X-Profile-Source: db|fallback|cache` (check in Network tab) and, with `?media=1`, `X-Media-Meta-Count` and `X-Media-Folder-Count`.
- Server logs media counters per request. Tail with: `pm2 logs castingly-v2 --lines 200`.

Caching for owner views:
- Self-requests (Authorization userId === :id) respond with `Cache-Control: private, no-store` so PATCHes and uploads reflect immediately.
- Client hooks (`useActorProfile`, `useActorMedia`) add `cache: 'no-store'` and a `ts` query param to bypass any intermediaries.

Logout:
- Client posts to `/api/auth/logout` (server→Core) and clears persisted auth, then hard-navigates to `/login`. Ensures full sign-out across tabs.

DMAPI client caveats:
- For folder listings, DMAPI expects `path` to include the userId as the first segment. We prefix `<userId>/…` when calling `/api/buckets/:bucket/files`.
- We no longer override actor userId with `DMAPI_LIST_USER_ID` in `listActorFiles`.

CLI fallback (server env, supports `DMAPI_API_KEY`):
```bash
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && \
  DMAPI_API_KEY=dmapi_*** node scripts/backfill-media.mjs --user <actor-uuid> --dry"'
```
CDN & DMAPI streaming (images):
- DMAPI now streams image content for public media via `/api/serve/files/<userId>/castingly-public/...` with HTTP 200 and long-lived Cache-Control. Cloudflare caches these responses at edge (cf-cache-status: HIT after first warm).
- Private/signed media (castingly-private or `?signed=`) remains BYPASS (no-store).
- For private-only headshots, DMAPI generates a small public thumbnail (`*_small.webp`, width≈384px) under `castingly-public/actors/<id>/headshots` at upload. A backfill script is available to generate small variants for existing users.

DMAPI host (dmapiapp01) quick refs:
- Live code path: `/opt/dailey-media-api/releases/<release>/src`
- Serve route patched: `src/routes/serve.js` — streams image bytes (200) instead of 302 for images.
- Upload route patched: `src/routes/upload.js` — generates `*_small.webp` for private headshots into `castingly-public`.
- Backfill scripts:
  - Per-user: `node scripts/backfill-small-public.mjs <userId>`
  - All users: `MAX_USERS=0 node scripts/backfill-small-public-all.mjs` (limit with `MAX_USERS`)
- Restart: `pm2 restart dmapi-backend`

Cloudflare checks (from your workstation):
- Warm: `curl -I 'https://media.dailey.cloud/api/serve/files/<uid>/castingly-public/actors/<uid>/headshots/<name>.webp'`
- Repeat: expect `cf-cache-status: HIT`, `Cache-Control: public, max-age=31536000, immutable`.
### Email (SendGrid) — configure and test

1) Set env in `.env.production` on the app server:

```
SENDGRID_API_KEY=...            # or SEND_GRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@castingly.com
SENDGRID_FROM_NAME=Castingly
```

2) Rebuild + restart to load new envs:

```
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && npm run build && pm2 restart castingly-v2 --update-env"'
```

3) Send a test email:

```
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && TO=you@example.com node tools/sendgrid-test.mjs"'
```

### Provision Beta Actors (Core + Castingly DB)

Create/activate users in Dailey Core under the `castingly` tenant, enroll in tenant apps, and ensure public actor profiles exist in the Castingly DB (so /api/actors and /talent routes work pre-login).

1) Run provisioning in production env:

```
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node tools/provision-beta-actors.mjs --dry"'
# if output looks good, apply (creates users + DB rows):
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && MIGRATION_ENV=.env.production node tools/provision-beta-actors.mjs"'
```

Outputs passwords CSV for emailing: `artifacts/provision/beta-actors-passwords.csv`.

2) Send the welcome email (test first):

```
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && export SENDGRID_API_KEY=*** SENDGRID_FROM_EMAIL=noreply@castingly.com SENDGRID_FROM_NAME=Castingly && node tools/send-welcome-castingly.mjs"'
# Sends to jonny@dailey.llc by default (TEST_ONLY)
```

3) Send to all recipients (requires passwords CSV):

```
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && export SENDGRID_API_KEY=*** SENDGRID_FROM_EMAIL=noreply@castingly.com SENDGRID_FROM_NAME=Castingly ALL=1 node tools/send-welcome-castingly.mjs"'
```
### Media: Broken Image Swaps / Cleanup

Detect if a good `/api/serve` image is replaced by a raw S3/OVH URL after login:

```
BASE_URL=https://castingly.dailey.dev \\
USERNAME='actor.demo@castingly.com' \\
PASSWORD='Act0r!2025' \\
npm run -s tools:check:image-swap
```

Artifacts: `artifacts/check/events.json`, `artifacts/check/profile.png`.

Run DMAPI cleaner for public headshots (dry-run):

```
ACTOR_ID='<actor-uuid>' \\
DMAPI_BASE_URL='https://media.dailey.cloud' \\
DAILEY_CORE_AUTH_URL='https://core.dailey.cloud' \\
DMAPI_SERVICE_EMAIL='dmapi-service@castingly.com' \\
DMAPI_SERVICE_PASSWORD='********' \\
npm run -s dmapi:clean:headshots
```

Apply deletes:

```
ACTOR_ID='<actor-uuid>' DELETE=1 npm run -s dmapi:clean:headshots
```

Notes:
- The tiles API (server) emits `/api/serve` URLs for public assets and HEAD‑validates fallback URLs.
- The client never swaps a working image to a raw storage host and removes tiles on error.
