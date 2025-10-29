# Castingly v2 🎭

> **Professional Casting Platform for Actors, Agents, and Casting Directors**

A comprehensive platform built with Next.js 15, TypeScript, and MySQL that connects the entertainment industry through streamlined casting processes, profile management, and professional networking.

## 🚀 Current Status: **Production Ready - Fully Migrated**

### Recent Updates (Oct 2025)
- Mobile polish across actor dashboards, submissions, opportunities, and profile
  - Buttons and tabs are readable on phones and remain large tap‑targets
  - Bottom nav active line removed; highlight state is sufficient
  - Public Profile card now uses a copyable input with full‑width buttons on mobile
- Real profile completion with hide option
  - Completion is calculated from profile fields + media (headshot + gallery)
  - Users can hide the banner (stored in `profiles.metadata.preferences.hideProfileCompletion`)
- Faster, resilient images
  - `/api/media/proxy` issues 302 redirects to working URLs and picks the best image variant
  - Short DMAPI timeouts to avoid page stalls; longer cache for proxy/avatar redirects
  - Safe avatar endpoint now streams bytes (200) to avoid redirect loops; UI prefers DMAPI `/api/serve` tiles
  - Video/audio proxies redirect to signed/public URLs for correct object names; images prefer `/api/serve`
- Distinct logins per role
  - When authenticating via Dailey Core, Castingly overrides the role from the users table if present to ensure agent/casting/admin experiences are correct
- Navigation and routing
  - Removed the standalone "Submit" link; `/actor/submit` is only reachable when applying to a role (via `?opportunity=...`)

### New: Inside Connect (Representation)
- Embedded two‑sided marketplace for actors ↔ agents
- Endpoints
  - `GET/POST /api/connect/listings`, `GET/PATCH /api/connect/listings/:id`
  - `GET/POST /api/connect/submissions`, `PATCH /api/connect/submissions/:id`
  - `GET/PUT /api/connect/agency` (agent profile), `PUT /api/connect/prefs` (actor visibility)
- UI
  - Actor: `/actor/connect`
  - Agent: `/agent/connect` (inbox), `/agent/connect/listings` (manage)
- DB migrations
  - `database/migrations/20251026_inside_connect.sql`
  - Index fixes: `database/migrations/20251026_inside_connect_fix_indexes.sql`
- Seeding (dev/cluster)
  - `scripts/seed-inside-connect.sql` (base)
  - `scripts/seed-inside-connect-more.sql` (more listings)
  - `scripts/seed-inside-connect-submissions-simple.sql` (sample inbox)
- Migration helper
  - `scripts/apply-inside-connect.mjs` (env‑aware, idempotent)

### Login + UI polish
- Login page icons use lucide‑react (no emojis); removed broken Core image and “Powered by Dailey Core” line.
- Auth indicator is a small pill near Logout (desktop sidebar) instead of a large banner.
- Profile photo consistency: Actor Profile uses the same source as Dashboard (`/api/media/avatar/:id` fallback).
- Mobile avatar camera button made smaller (reduced border/ring/shadow).

### Headshots: private by default, owner signed render
- Headshots are uploaded to DMAPI with private access by default under `castingly-private/actors/:actorId/headshots`.
- The app keeps DB pointers for convenience and fallback:
  - `users.avatar_url` → short proxy URL (`/api/media/proxy?...`) without embedding signatures
  - `profiles.metadata.avatar` → structured pointer `{ bucket, userId, path, name }`
- Owner views (Dashboard/Profile) render privatized headshots by fetching a short‑lived signed URL server‑side.
- Public proxy (`/api/media/proxy`) only resolves public files; private headshots 404 for unauthenticated requests (expected).

Utilities
- Backfill existing avatars (app-assisted):
  - `MIGRATION_ENV=.env.production node scripts/backfill-avatars-via-app.mjs --force --host http://127.0.0.1:3003`
  - Optional single user: `--id <userId>`
- Backfill via DMAPI service (requires Core login to succeed):
  - `MIGRATION_ENV=.env.production node scripts/backfill-avatars.mjs --force`
  - Note: if Core rejects with “Invalid application”, use the app-assisted script above.

### Media Retrieval Matrix
- Owner (private):
  - `GET /api/media/headshot/signed/:actorId` with Authorization: returns `{ url }` (signed or public). Only owner is allowed.
  - UI uses this to render private headshots without exposing tokens in `<img>`.
- Public/unauthenticated:
  - `GET /api/media/proxy?bucket=…&userId=…&path=…&name=…` tries to resolve public assets (lists folder → redirects). Private files return 404.
- Admin/service:
  - Use DMAPI list endpoints via service token when needed.

### Troubleshooting 404 on proxy
- If calling `/api/media/proxy` for a private headshot or a variant name that doesn’t exist in the headshots folder (e.g., `*_large.webp`), a 404 is expected.
- For owner display, use the signed headshot endpoint (above) or `/api/media/list?category=headshot` with Authorization and prefer `signed_url`.

### Profile saves across mixed schemas
- Profile update only writes columns that exist (`profiles` table introspection) to avoid “Unknown column” errors.
- Headshot uploads trigger a client `reloadMedia()` for immediate counters and thumbnails.

### ✅ Migration Complete (October 17, 2025)
- ✅ **1,082 users fully migrated** to Dailey Core authentication
- ✅ **2,500+ media files** migrated to DMAPI storage
- ✅ **Castingly tenant** established in Dailey Core
- ✅ **Service accounts** configured for all integrations
- ✅ **JWT authentication** via Dailey Core RSA tokens
- ✅ **Responsive UI** with mobile-first design
- ✅ **Real data integration** with MySQL database
- ✅ **Forum discussions** seeded with sample conversations
- ✅ **Centralized user management** through Dailey Core
- 🔄 **Password resets required** for all migrated users

## 🎯 Project Goals

### Immediate (Beta Release)
- Replace all mock data with production-ready systems
- Implement enterprise-grade security (MFA, password reset)
- Harden DMAPI storage with AWS S3 + CloudFront replication
- Build comprehensive admin panel for user management
- Set up monitoring and analytics (Grafana integration)

### Completed Integrations
- ✅ **Dailey Core authentication system** - Fully integrated with 1,082 users migrated
- ✅ **DMAPI media storage** - 2,500+ files migrated and operational
- ✅ **Centralized tenant management** - Castingly tenant established

### Future Enhancements
- Advanced forum system for industry networking
- Enhanced analytics and user insights
- Mobile app development
- Multi-factor authentication (MFA)

## 🔐 Authentication Integration

Castingly v2 is **fully integrated** with the DAILEY CORE authentication system:

### Features
- **RSA JWT Authentication**: Uses RS256 algorithm with DAILEY CORE as the authority
- **Hybrid Authentication**: Supports DAILEY CORE, legacy accounts, and demo users
- **JWT Validation Strategy**: Validates RS256 tokens via Core's JWKS (`/.well-known/jwks.json`) with optional `/auth/validate` check when available
- **Token Refresh**: Automatic token refresh for seamless user experience
- **Visual Status Indicators**: Authentication badges showing current auth source
- **Role Mapping**: Maps DAILEY CORE roles to Castingly application roles

### Authentication Flow
1. **Login**: Users authenticate via API which tries DAILEY CORE first
2. **Token Issuance**: DAILEY CORE issues RSA-signed JWT tokens
3. **Validation**: Frontend validates tokens locally via JWKS; falls back to Core `/auth/validate` when available
4. **Fallback**: System supports legacy and demo accounts for development
5. **Status Display**: UI shows authentication source with color-coded badges

### Developer Features
- **Role Switching**: Development mode allows quick role switching
- **Test Users**: Access to real migrated actor accounts for testing
- **Authentication Status**: Visual indicators in sidebar showing auth source

## 📦 Media Storage (DMAPI)

The application includes a full integration with the **Dailey Media API (DMAPI)**. API routes and UI components already target DMAPI for listings, uploads, and deletions, but the legacy filesystem (`downloaded_images/`, `downloaded_resumes/`) still holds the canonical assets until the migration script is executed.

- **Public & Private buckets** (`castingly-public`, `castingly-private`) are preconfigured via metadata so DMAPI can mirror the legacy folder structure.
- **Categorised metadata** (headshots, reels, resumes, self-tapes, documents, voice overs) is attached during migration for downstream filtering.
- **Signed URLs** will be generated on demand for private media once the data resides in DMAPI.
- **Admin tooling** already queries DMAPI, falling back to legacy records when the integration credentials are missing or the migration has not been run.

### Migrating Legacy Assets

Use the provided migration script to elevate legacy filesystem + MySQL media into DMAPI.

```bash
# Dry-run the migration first (no uploads)
node scripts/migrate-media-to-dmapi.mjs --dry-run

# Migrate everything with a short delay between uploads
DMAPI_MIGRATION_DELAY_MS=200 node scripts/migrate-media-to-dmapi.mjs

# Resume a partial migration from a specific actor_media ID
node scripts/migrate-media-to-dmapi.mjs --start-at 1050
```

Environment variables in `.env.local` are reused automatically. Ensure the following are present for the service account that can access both Dailey Core and DMAPI:

- `DMAPI_SERVICE_EMAIL` / `DMAPI_SERVICE_PASSWORD`
- `DMAPI_BASE_URL`
- `DAILEY_CORE_AUTH_URL`
- `DMAPI_APP_ID` (defaults to `castingly`)

The script will:

1. Ensure the DMAPI application record exists.
2. Mirror Dailey Core user references for media ownership.
3. Upload media, tagging `sourceActorId`, `sourceMediaId`, and actor contact metadata.
4. Enrich DMAPI metadata for downstream querying.
5. Preserve the legacy directory structure through the `folderPath` metadata so DMAPI's browser UI reflects familiar actor-centric folders.

> **Note:** Until `DMAPI_SERVICE_EMAIL` / `DMAPI_SERVICE_PASSWORD` are supplied and the migration completes, most actors will continue to read media from the legacy directories.

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for responsive design
- **Framer Motion** for animations
- **Zustand** for state management

### Backend
- **Next.js API Routes** with TypeScript
- **MySQL/MariaDB** database
- **JWT** authentication with refresh tokens
- **File serving** for media content
- **Role-based** access control (Actor, Agent, Casting Director)

### Infrastructure
- **Tailscale** for secure remote access
- **Local file storage** (migrating to S3)
- **Development environment** with hot reload

## 🗂️ Project Structure

```
castingly-v2/
├── app/                    # Next.js 15 App Router
│   ├── actor/             # Actor-specific pages
│   ├── agent/             # Agent-specific pages
│   ├── casting/           # Casting Director pages
│   ├── api/               # API routes
│   └── (auth)/            # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layouts/          # Layout components
│   └── navigation/       # Navigation components
├── lib/                  # Utility libraries
│   ├── db/               # Database connections
│   ├── store/            # State management
│   └── hooks/            # Custom React hooks
├── database/             # Migration scripts
└── scripts/              # Tooling (DMAPI migration, maintenance)
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL/MariaDB database
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jonndailey/castingly-v2.git
   cd castingly-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Optional: Configure SendGrid for emails**
   - Add to `.env.local`:
     - `SENDGRID_API_KEY=...`
     - `SENDGRID_FROM_EMAIL=noreply@castingly.com`
     - `SENDGRID_FROM_NAME=Castingly` (optional)
   - Test locally:
     ```bash
     TO=you@example.com node tools/sendgrid-test.mjs
     ```

4. **Run the app**

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Database setup**
   ```bash
   # Import the existing database structure
   # (Database dump and migration scripts available separately)
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Local: http://localhost:3000
- Production behind Apache proxies to http://127.0.0.1:3003 (PM2 `PORT=3003`)

### Browser Automation via MCP (Playwright)

This repo includes a minimal MCP server that exposes Playwright controls so MCP‑aware clients can drive a browser session to test Castingly.

- Start server (stdio):
  ```bash
  npm run mcp:browser
  ```
- Output directory: `artifacts/mcp-browser/` (screenshots and HAR)
- Default launch is headless (works without X server). Set `{ headless: false }` in the `launch` tool only if a display is available.

Exposed tools

- `launch({ headless?, width?, height?, baseUrl?, harName? })`
- `goto({ url, waitUntil?, timeout? })`
- `fill({ selector, value, timeout? })`
- `click({ selector, timeout? })`
- `wait_for_selector({ selector, state?, timeout? })`
- `wait_for_url({ equals?, pattern?, timeout? })`
- `screenshot({ path?, fullPage? })` → returns file path
- `get_console()` → returns and clears collected console events
- `get_network()` → returns and clears collected network events
- `close()`

Example flow (pseudocode via MCP tools)

1) `launch({ headless: true, baseUrl: "http://localhost:4874" })`
2) `goto({ url: "/login" })`
3) `fill({ selector: "input[name=\"email\"]", value: "actor.demo@castingly.com" })`
4) `fill({ selector: "input[type=password]", value: "Act0r!2025" })`
5) `click({ selector: "button:has-text(\"Sign In\")" })`
6) `wait_for_url({ pattern: "/actor/dashboard" })`
7) `screenshot({ path: "after-login.png", fullPage: true })`
8) `get_console()` / `get_network()`

Client configuration

Point your MCP client at the stdio command:

- Command: `npm`
- Args: `["run", "mcp:browser"]`
- CWD: project root (e.g., `/home/jonny/apps/castingly-v2`)

### Inside Connect: applying DB schema
```bash
# Local/dev DB
mysql -h 127.0.0.1 -P 3306 -u nikon -p casting_portal < database/migrations/20251026_inside_connect.sql
mysql -h 127.0.0.1 -P 3306 -u nikon -p casting_portal < database/migrations/20251026_inside_connect_fix_indexes.sql

# Cluster via app server env (.env.production)
MIGRATION_ENV=.env.production node scripts/apply-inside-connect.mjs

# Seed (optional)
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p castingly < scripts/seed-inside-connect.sql
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p castingly < scripts/seed-inside-connect-more.sql
mysql -h 127.0.0.1 -P 3307 -u castingly_app -p castingly < scripts/seed-inside-connect-submissions-simple.sql
```

### Test Accounts
Development includes test accounts with real migrated data:
- **Actor**: `ellewootsionn@gmail.com` / `changeme123`
- **Actor**: `magjofogu@gmail.com` / `changeme123`
- See admin panel for full list of test accounts

## 📋 Beta Release Roadmap

View our comprehensive [Beta Release Roadmap](./BETA_RELEASE_ROADMAP.md) for detailed planning.

### Phase 1: Security & Infrastructure (Critical)
- [ ] [Password Reset System](../../issues/1) 
- [ ] [Multi-Factor Authentication](../../issues/4)
- [ ] [AWS S3 Migration](../../issues/3)
- [ ] [Security Hardening](../../issues/6)

### Phase 2: Admin & Monitoring (High Priority)
- [ ] [Admin Panel](../../issues/2)
- [ ] [User Analytics](../../issues/10)
- [ ] [Error Monitoring](../../issues/11)
- [ ] [Production Environment](../../issues/12)

### Phase 3: Communication & Features (Medium Priority)
- [ ] [SendGrid Integration](../../issues/5)
- [ ] [Investor Demo Accounts](../../issues/7)
- [ ] [Forum System](../../issues/8)

### Phase 4: Future Integration (Low Priority)
- [ ] [DaileyCore Integration](../../issues/9)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run dev:tailscale` - Start server for Tailscale access
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run login:capture` - Headless login capture (HAR + console + screenshot)
- `npm run tools:check:image-swap` - Detects if a good `/api/serve` image is later replaced by a raw S3/OVH URL
- `npm run dmapi:clean:headshots` - DMAPI cleaner for public headshots (dry-run by default)
- `pm2 start ecosystem.config.js --only castingly-v2` - Launch compiled app under PM2
 - `node scripts/backfill-avatars-via-app.mjs --host http://127.0.0.1:3003` - Backfill avatar pointers via app
 - `node scripts/backfill-avatars.mjs` - Backfill avatar pointers via DMAPI service

### Development Features
- **Hot reload** with fast refresh
- **TypeScript** checking
- **Role switcher** for testing different user types
- **Test user dropdown** for quick account switching
- **Real data integration** with migrated actors

## 🏢 User Roles

### Actor
- Complete profile management with photos and resumes
- Media gallery with modal viewing
- Opportunity browsing and submissions
- Public profile sharing

### Agent
- Client roster management
- Submission tracking
- Opportunity management
- Client profile oversight

### Casting Director
- Project creation and management
- Talent discovery and search
- Submission review
- Casting analytics

### Admin (Future)
- User management and analytics
- System monitoring
- Content moderation
- Platform administration

## 🔒 Security Features

### Current Security
- **DAILEY CORE Integration**: RSA JWT authentication with centralized auth system
- **JWT-based authentication** with refresh tokens  
- **Role-based access control** (Actor, Agent, Casting Director, Admin)
- **Session management** with token validation
- **Password hashing** (SHA256) for legacy accounts
- **Protected API routes** with middleware validation
- **Authentication status indicators** showing auth source (DAILEY CORE/Legacy/Demo)

### Planned Security Enhancements
- Multi-factor authentication (MFA)
- Password reset system
- Rate limiting
- Input validation and sanitization
- HTTPS/SSL certificates
- Security headers and CORS

## 📊 Data & Analytics

### Current Data
- **1,071 migrated actors** with complete profiles
- **4,000+ media files** organized by actor
- **Real industry data** from legacy system
- **MySQL relational database** with proper structure

### Planned Analytics
- User engagement metrics
- Platform usage statistics  
- Performance monitoring
- Grafana dashboard integration
- Admin analytics panel

## 🌐 Deployment

### Current Environment
- **Development**: Local with hot reload
- **Tailscale Access**: Remote development access
- **Database**: Local MySQL/MariaDB

### Planned Production
- **Cloud hosting** with scalable infrastructure
- **AWS S3** for media file storage
- **CloudFront** CDN for global distribution
- **CI/CD pipeline** with GitHub Actions
- **Monitoring** and alerting systems

## 🚀 Production Runbook

This app is stateless in production (auth via Dailey Core, media via DMAPI). Recommended: Nginx in front, PM2 for the Node process on Linode.

1) Environment setup
- Create `.env.production` (or export env vars) using `.env.example` as a reference.
- Set:
  - `NEXT_PUBLIC_DAILEY_CORE_AUTH_URL=https://core.dailey.cloud`
  - `NEXT_PUBLIC_DMAPI_BASE_URL=https://media.dailey.cloud`
  - Toggle `NEXT_PUBLIC_ENABLE_INVESTOR_DEMO=true` only on investor demo environments.

2) Build and start with PM2
```bash
npm ci
npm run build
pm2 start ecosystem.production.cjs --env production
pm2 save
```

## 🖧 Servers & Access (Ops Notes)

This repo is developed and deployed from the dev workstation (“king”), with a remote app server (“dev”) and a separate database cluster.

- Dev Workstation “king” (you are here)
  - Code: `/home/jonny/apps/castingly-v2`
  - Local MySQL (for development):
    - Host: `127.0.0.1`, Port: `3306`
    - User: `nikon`, Password: `@0509man1hattaN`
    - DB: `casting_portal`
  - Typical usage: edit code, run local MySQL, commit/push to GitHub, rsync to the app server.

- App Server “dev” (runs Castingly under PM2)
  - SSH: `ssh dev`
  - Code: `~/apps/castingly-v2`
  - Build/Restart:
    - `npm run build`
    - `pm2 restart castingly-v2 --update-env`
  - Runtime: Next.js behind Apache proxy → `http://127.0.0.1:3003` (domain: `https://castingly.dailey.dev`)
  - DB: connects to the cluster via local port `3307` (tunnel/service)
  - Safe place to run env‑aware schema helper:
    - `MIGRATION_ENV=.env.production node scripts/apply-inside-connect.mjs`

- Database Cluster
  - coredb1 (primary): `40.160.239.176`
    - SSH: `ssh ubuntu@40.160.239.176`, then `sudo -i`
    - MySQL root password: `/root/.mysql_root_pw`
    - App DB: `castingly` (for Castingly features, e.g., Inside Connect)
    - Core DB: `dailey_core_auth` (Dailey Core auth service)
    - Apply schema as root (example):
      - `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS castingly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
      - `mysql -u root -p castingly < database/migrations/20251026_inside_connect.sql`
      - `mysql -u root -p castingly < database/migrations/20251026_inside_connect_fix_indexes.sql`
  - coredb2 (replica): `40.160.239.175`
    - Replicates from coredb1; do not apply writes here
    - (Optional) Verify replication with `SHOW SLAVE STATUS\G`

- Media API (DMAPI)
  - Base URL (prod): `https://media.dailey.cloud` (see `DMAPI_BASE_URL`)
  - Used by upload routes; short timeouts to avoid UI stalls

Quick deploy from king → dev app server:
```bash
rsync -az --delete --exclude '.git' --exclude 'node_modules' --exclude '.next' \
      --exclude '.env.production' --exclude '.env.local' ./ dev:~/apps/castingly-v2/
ssh dev 'bash -lc "cd ~/apps/castingly-v2 && npm run build && pm2 restart castingly-v2 --update-env"'
```

3) Nginx
- Proxy `server_name castingly.dailey.cloud` to `127.0.0.1:3000`.
- Add no‑cache headers for `index.html` to avoid stale SPA after deploys.

## 🔧 Dev Server Status (Quick Reference)

Environment: ssh dev

- App process
  - PM2 name: `castingly-v2`
  - Port: `3003`
  - Directory: `~/apps/castingly-v2`
  - Restart: `pm2 restart castingly-v2 --update-env`

- Apache vhosts (HTTPS → app)
  - `/etc/apache2/sites-enabled/castingly.conf` → `ProxyPass / http://127.0.0.1:3003/`
  - `/etc/apache2/sites-enabled/castingly-ssl.conf` → `ProxyPass / http://127.0.0.1:3003/`
  - Reload: `sudo systemctl reload apache2`

- DB (cluster) via SSH tunnel
  - Local forward on dev: `127.0.0.1:3307 -> coredb1:127.0.0.1:3306`
  - Check: `lsof -iTCP:3307 -sTCP:LISTEN`
  - Start script: `~/.local/bin/start_castingly_tunnel.sh`
  - Autostart: `@reboot /home/jonny/.local/bin/start_castingly_tunnel.sh` (crontab)

- App DB env (in `~/apps/castingly-v2/.env.production`)
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3307`
  - `DB_NAME=castingly`
  - `DB_USER=castingly_app`
  - `DB_PASSWORD=<stored in ~/.secrets/castingly_db_password>`

- Core/DMAPI env (in `.env.production`)
  - `NEXT_PUBLIC_DAILEY_CORE_AUTH_URL=https://core.dailey.cloud`
  - `DAILEY_CORE_AUTH_URL=https://core.dailey.cloud`
  - `DAILEY_CORE_APP_SLUG=castingly-portal`
  - `DAILEY_CORE_TENANT_SLUG=castingly`
  - `NEXT_PUBLIC_DMAPI_BASE_URL=https://media.dailey.cloud`
  - Do NOT set `DAILEY_CORE_CLIENT_ID` (omitted header avoids “Invalid application”)

## 🧪 Demo Accounts (Core → Castingly tenant)

These users exist in `dailey_core_auth.users` and are joined to the `castingly` tenant. Use for demos/tests.

- Investor: `investor.demo@castingly.com` / `Inv3stor!2025`
- Actor: `actor.demo@castingly.com` / `Act0r!2025`
- Agent: `agent.demo@castingly.com` / `Ag3nt!2025`
- Casting Director: `director.demo@castingly.com` / `D1rect0r!2025`
- Admin: `admin.demo@castingly.com` / `Adm1n!2025`

Core auth test (should return a token):

```bash
curl -sS -X POST https://core.dailey.cloud/auth/login \
  -H 'Content-Type: application/json' \
  --data-binary '{"email":"actor.demo@castingly.com","password":"Act0r!2025","app_slug":"castingly-portal"}'
```

## 🐞 Core Auth Login Issue (Tracking)

Symptom
- UI POST `https://castingly.dailey.dev/api/auth/login` returns 401 with “Invalid email or password”.
- Server logs show `Dailey Core auth failed … Invalid application`.

Known Good
- Direct Core call (above) returns an `access_token` using `app_slug=castingly-portal`.

Current Hypothesis
- A header/body mismatch to Core causes rejection when called from the server. We removed `X-Client-Id` and send only `Content-Type` and optional `X-Tenant-Slug`. Ensure the server is using the latest build and env.

What to Verify
1) Env in `~/apps/castingly-v2/.env.production`:
   - `DAILEY_CORE_AUTH_URL=https://core.dailey.cloud`
   - `DAILEY_CORE_APP_SLUG=castingly-portal`
   - `DAILEY_CORE_TENANT_SLUG=castingly`
   - (no `DAILEY_CORE_CLIENT_ID`)
2) Rebuild + restart:
   - `npm run build && pm2 restart castingly-v2 --update-env`
3) Tail server logs during a login:
   - `pm2 logs castingly-v2 --lines 200`
  - Expect to see log line with: `Attempting login for … (baseUrl=https://core.dailey.cloud, appSlug=castingly-portal, tenant=castingly, clientId=n/a)`

If still failing
- Add diagnostic: temporarily log Core response `{status, data}` and the outbound payload headers (password redacted). Compare against working curl.
- Token validation uses JWKS locally; `/auth/validate` errors do not block login. Investigate Core logs for `/auth/validate` if needed.
- As a temporary demo fallback, set `ENABLE_LEGACY_AUTH_FALLBACK=true` in `.env.production` to allow legacy auth while Core headers are tuned.

## 📘 Definitive Integration: Core + DMAPI + DB

- Core auth (recommended pattern)
  - Use app and tenant slugs, not a client id
  - POST `/auth/login` body: `{ email, password, app_slug, tenant_slug }`
  - Optionally send `X-Client-Id: <app_slug>` and `X-Tenant-Slug: <tenant_slug>`
  - Token validation: verify RS256 JWTs against Core JWKS at `/.well-known/jwks.json`; use `/auth/validate` only as a best‑effort check
  - Reference: `../dailey-core/INTEGRATION_GUIDE.md` (Critical Update section)

- DMAPI integration
  - Accepts Bearer tokens issued by Core and verifies locally via JWKS
  - Optional best‑effort call to Core `/auth/validate` when available
  - Reference: `../dailey-media-api/docs/DEPLOYMENT_CORE_INTEGRATION.md` (Token Validation Strategy)
  - Production env (server):
    - `DMAPI_BASE_URL=https://media.dailey.cloud`
    - `DMAPI_SERVICE_EMAIL` / `DMAPI_SERVICE_PASSWORD` (required for server reads/uploads)
    - Optional: `DMAPI_LIST_USER_ID=<service_subject_id>` to scope bucket folder listings for profile headshots
  - Private files (resumes): served via app proxy `GET /api/media/proxy?bucket=castingly-private&userId=<svcUser>&path=actors/<actorId>/resumes&name=<file>` so the UI never reveals DMAPI credentials.

- MySQL cluster access
  - Use an SSH tunnel locally: listen on `127.0.0.1:3307`, connect to cluster primary/HA
  - App env: `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER/DB_PASSWORD/DB_NAME` per app
  - Quick test: `mysql -h127.0.0.1 -P3307 -u <user> -p -e 'SELECT 1' <db>`
  - Reference: `../dailey-core/docs/MYSQL_CORE_DMAPI_CONNECTION_GUIDE.md`

Notes on legacy profile reads
- The profile API reads legacy tables. When a Core UUID reaches `/api/actors/:id`, the API now falls back to map via email from the bearer token to the legacy numeric id before loading the profile.

## 🛠️ Current Integration Status (Oct 2025)

- Core login: working end-to-end (slug-based, RS256+JWKS).
- Actor profile API: returns 200 for authenticated users (builds a minimal profile when legacy row is missing). Public headshots are listed from DMAPI buckets; private resumes stream via `/api/media/proxy`.
- Forum activity: uses new schema fields (`name`, `avatar_url`). Endpoint requires authentication.
- DMAPI audience: temporarily permissive (accepts any Core audience). Plan: set `CORE_AUDIENCE=<Castingly app_id>` and remove `ALLOW_CORE_ANY_AUD`.
- DMAPI DB: uploads succeed to storage; a small DB patch (ensure application row exists) removes occasional FK insert failures and populates `/api/files` immediately.

## 🖼️ Uploads & Limits (Current Behavior)

- User upload flows
  - Dashboard camera: uploads a headshot inline and updates avatar immediately.
  - Profile Media: headshots/gallery show counters (x/20) and fill space as soon as the upload starts.
  - The “Upload Media” page link has been removed; uploads are inline.

- Server limits (enforced)
  - Size caps: reels up to 500MB; images/docs capped by env.
  - Count caps: headshots/gallery 20, reels 10 (temporarily relaxed while DMAPI list is stabilized).
  - Env knobs (Castingly):
    - `MEDIA_LIMIT_IMAGE_COUNT` (default 20)
    - `MEDIA_LIMIT_REEL_COUNT` (default 10)
    - `MEDIA_LIMIT_REEL_MAX_MB` (default 500)
    - `DISABLE_IMAGE_LIMITS=true` (temporarily bypass headshot/gallery count while DMAPI list is being fixed)

- DMAPI integration flags
  - `DMAPI_DISABLE_DB_LIST=true` (on DMAPI): bypass DB listing and use storage fallback; faster and avoids list SQL errors.
  - PM2: disable `watch` for dmapi-backend in production; `pm2 save` to persist.

- Reset endpoint (cleanup)
  - POST `/api/admin/media/reset-actor/:actorId` with header `x-confirm: purge` purges headshots/gallery for that actor.
  - Uses DMAPI storage folder fallback (no DB required) and returns JSON `{success, deleted, failed[]}`.

- Upload responses (simplified)
  - APIs return a single file entry with `id`, and when DMAPI DB is delayed, a `signed_url` and `proxy_url` for immediate use.
  - The UI prefers a usable URL so the image persists across refresh immediately.

## 🧰 DMAPI Fixes (Planned/Applied)

- Applied now
  - Feature-flagged DB listing off: `DMAPI_DISABLE_DB_LIST=true` to avoid `mysqld_stmt_execute` errors and latency.
  - Hardened JSON parsing in duplicate-hash lookup paths to avoid `Unexpected end of JSON input`.

- Next patches
  - Replace `COUNT(*) OVER()` with separate `COUNT(*)` in DB list; whitelist `order_by` binding.
  - Gate pdf processing to `application/pdf` to stop pdfjs parse noise.
  - Disable pm2 `watch` for dmapi-backend; `pm2 save`.

### Backfill normalization (server)

- Route: `POST /api/admin/media/backfill`
- Auth: `X-Admin-Secret`, Core admin token, or `dmapi_` API key
- Params: `userId`, `dry`, `category`, `max`
- Behavior: scans `actors/<id>/*` across public/private buckets, infers `metadata.category` and `metadata.sourceActorId`, and PATCHes with retry/backoff.
- DMAPI prerequisite to complete writes:
  - Enable `/api/files` listing for `app_id=castingly` so user-scoped lists return DB ids, or
  - Add `storage_key` lookup filter to `/api/files` to resolve ids from folder results.
  - Once available, the route patches ids directly (no further app changes).

## 🔒 Production Checklist (Castingly server)

- Core
  - `DAILEY_CORE_AUTH_URL=https://core.dailey.cloud`
  - `DAILEY_CORE_APP_SLUG=castingly-portal`
  - `DAILEY_CORE_TENANT_SLUG=castingly`
  - Do not set `DAILEY_CORE_CLIENT_ID` unless you have a provisioned value.
- DMAPI
  - `DMAPI_BASE_URL=https://media.dailey.cloud`
  - `DMAPI_SERVICE_EMAIL=dmapi-service@castingly.com`
  - `DMAPI_SERVICE_PASSWORD=******`
  - Optional: `DMAPI_LIST_USER_ID=<service_subject_id>` for bucket-scoped folder listings
- DB (cluster via tunnel)
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3307`
  - `DB_USER/DB_PASSWORD/DB_NAME` as provisioned

## 🧯 Troubleshooting (common)

- 404 on `/api/actors/:id` after successful login
  - Cause: UI request missing Authorization header; server can’t map Core UUID.
  - Fix: pass `Authorization: Bearer <token>` on all actor fetches (talent pages updated).
- 500 on forum endpoints
  - Cause: queries referenced legacy columns (`first_name`, `profile_image`).
  - Fix: updated to `name`, `avatar_url`. Require authentication on `/api/forum/activity/:userId`.
- Private resume not rendering
  - Use `/api/media/proxy` to stream from DMAPI with the server’s service token.

## 🔜 DMAPI Hardening (next)

- Set `CORE_AUDIENCE=<Castingly Core app_id>` on DMAPI and remove `ALLOW_CORE_ANY_AUD=true`.
- Add `ensureApplication('castingly')` before `media_files` inserts to avoid FK failures; keep `ensureUser` as-is.
- Keep Castingly proxy for private files; use DMAPI direct serve URLs for public headshots.

## 🔍 Quick Checks

App health
```bash
pm2 status castingly-v2
curl -sS http://127.0.0.1:3003/api/admin/system/health | jq
```

DB tunnel
```bash
lsof -iTCP:3307 -sTCP:LISTEN
mysql -h127.0.0.1 -P3307 -ucastingly_app -p -e 'SELECT 1' castingly
```

Apache → app
```bash
curl -I https://castingly.dailey.dev/
```

## 🧯 Troubleshooting: Profile 500 on /api/actors/:id

Symptoms
- Browser console shows 500 errors for `/api/actors/<uuid>` after a successful login.

Likely causes
- Database connectivity mismatch. The API routes use the legacy Castingly DB via MySQL. In production, access is through an SSH tunnel on `127.0.0.1:3307`, but `.env.production` may be pointing to the cluster IP/port directly.
- Schema mismatch. Production DB uses `users` + `profiles` + `media` (no `actors` or `actor_media`). The server has been aligned to this schema.

Fix
- Set DB env to the tunnel and restart:
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3307`
  - `DB_USER/DB_PASSWORD/DB_NAME` as provisioned
  - `pm2 restart castingly-v2 --update-env`
- Verify tunnel and DB:
  - `lsof -iTCP:3307 -sTCP:LISTEN`
  - `mysql -h127.0.0.1 -P3307 -ucastingly_app -p -e 'SELECT 1' castingly`
- Health endpoint:
  - `curl -sS http://127.0.0.1:3003/api/admin/system/health | jq`

Notes
- This endpoint reads from the legacy schema (`lib/db_existing.ts`). Production schema is `users` + `profiles` + `media`; the code has been updated accordingly.
- If you pass a Core UUID that doesn’t exist in `users`, the API now falls back to a minimal Core‑derived profile so the page renders (200). For a complete profile, add a `users` row (char(36) id) and an associated `profiles` row, or run the migration.
- For details on the standard DB access pattern, see `../dailey-core/docs/MYSQL_CORE_DMAPI_CONNECTION_GUIDE.md`.


### User Migration to Dailey Core

Use the tools in `~/apps/dailey-core` to import legacy users so they benefit from Core’s replication:
1. Copy `scripts/migrate-logins.config.example.json` to `scripts/migrate-logins.config.json` and point the source to `casting_portal.users`.
   - `target.defaultTenantId`: `22222222-2222-2222-2222-222222222222`
   - `target.defaultAppId`: `66666666-6666-6666-6666-666666666666`
   - Map `email`, `first_name`, `last_name`, `password_hash` (sha256 → generally requires reset), timestamps.
2. Run:
```bash
cd ~/apps/dailey-core
node scripts/migrate-logins.js --config=./scripts/migrate-logins.config.json --dry-run
node scripts/migrate-logins.js --config=./scripts/migrate-logins.config.json
```

### Media Migration to DMAPI

Run from this repo to move all media to production DMAPI:
```bash
export DMAPI_BASE_URL=https://media.dailey.cloud
export DAILEY_CORE_AUTH_URL=https://core.dailey.cloud
export DMAPI_SERVICE_EMAIL=dmapi-service@castingly.com
export DMAPI_SERVICE_PASSWORD=castingly_dmapi_service_2025

# Dry run
node scripts/migrate-media-to-dmapi.mjs --dry-run

# Live run
DMAPI_MIGRATION_DELAY_MS=200 node scripts/migrate-media-to-dmapi.mjs
```

The script ensures the DMAPI application and user references exist, uploads files, and enriches metadata for Castingly.

## 🤝 Contributing

This is currently a private beta project. For questions or collaboration:

- 📧 Email: jonndailey@gmail.com
- 🐛 Issues: [GitHub Issues](../../issues)
- 📋 Project Board: [Beta Release Project](../../projects/1)

## 📄 License

Private/Proprietary - All rights reserved.

---

## 🎬 About Castingly

Castingly revolutionizes the casting process by providing a centralized platform where:

- **Actors** can showcase their talents with professional profiles
- **Agents** can efficiently manage their client rosters
- **Casting Directors** can discover perfect talent for their projects

Built with modern web technologies and real industry data, Castingly v2 represents the future of professional casting platforms.

**Ready for Beta • Built with ❤️ for the Entertainment Industry**
### Broken Images & Tiles

- Tiles prefer DMAPI `/api/serve` URLs for public assets and exclude raw storage hosts (S3/OVH). Client removes tiles immediately on `<img>` error (no gray placeholders).

Troubleshoot swaps:
- `BASE_URL=<site> USERNAME=<email> PASSWORD=<pwd> npm run -s tools:check:image-swap`
- Artifacts: `artifacts/check/events.json`, `artifacts/check/profile.png`

Clean junk public headshots (dry-run):
- `ACTOR_ID='<actor-uuid>' DMAPI_BASE_URL='https://media.dailey.cloud' DAILEY_CORE_AUTH_URL='https://core.dailey.cloud' DMAPI_SERVICE_EMAIL='...' DMAPI_SERVICE_PASSWORD='...' npm run -s dmapi:clean:headshots`
- Apply deletes: add `DELETE=1`
