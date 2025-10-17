# Castingly v2 🎭

> **Professional Casting Platform for Actors, Agents, and Casting Directors**

A comprehensive platform built with Next.js 15, TypeScript, and MySQL that connects the entertainment industry through streamlined casting processes, profile management, and professional networking.

## 🚀 Current Status: **Production Ready - Fully Migrated**

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
- **Automatic Token Validation**: Real-time validation against DAILEY CORE `/auth/validate` endpoint
- **Token Refresh**: Automatic token refresh for seamless user experience
- **Visual Status Indicators**: Authentication badges showing current auth source
- **Role Mapping**: Maps DAILEY CORE roles to Castingly application roles

### Authentication Flow
1. **Login**: Users authenticate via API which tries DAILEY CORE first
2. **Token Issuance**: DAILEY CORE issues RSA-signed JWT tokens
3. **Validation**: Frontend validates tokens against DAILEY CORE
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
   - Tailscale: http://100.105.97.19:3002

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
- `pm2 start ecosystem.config.js --only castingly-v2` - Launch compiled app under PM2

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
