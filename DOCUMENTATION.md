# Castingly 2.0 Documentation

## 🎬 Project Overview

Castingly is a professional casting platform that connects actors, agents, and casting directors in a seamless, modern interface. Built with Next.js 15, TypeScript, and Tailwind CSS, it provides a mobile-first experience with thoughtful UX and animations.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + CSS Custom Properties
- **State Management**: Zustand with persistence
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **Database**: PostgreSQL (planned)
- **Authentication**: JWT-based (demo mode active)

### Project Structure
```
castingly-v2/
├── app/                    # Next.js app directory
│   ├── actor/             # Actor-specific pages
│   ├── agent/             # Agent-specific pages
│   ├── casting/           # Casting director pages
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layouts/          # Layout components
│   ├── navigation/       # Navigation components
│   └── video/            # Video-specific components
├── lib/                   # Utilities and stores
│   ├── store/            # Zustand stores
│   └── utils.ts          # Helper functions
└── public/               # Static assets
```

## 👥 User Roles

### 1. Actor
- **Purpose**: Showcase talent, find auditions, submit for roles
- **Key Features**:
  - Professional profile with headshots, reels, resume
  - Browse and filter casting opportunities
  - Submit self-tapes and applications
  - Track submission status
  - Manage availability calendar
  - 12 Jungian archetypes system

### 2. Agent
- **Purpose**: Manage talent roster, submit clients for roles
- **Key Features**:
  - Roster management dashboard
  - Bulk submission capabilities
  - Track client bookings and earnings
  - Communication with casting directors
  - Performance analytics

### 3. Casting Director
- **Purpose**: Post roles, review submissions, manage auditions
- **Key Features**:
  - Project and role management
  - Swipe-based video review interface
  - Advanced filtering and search
  - Callback and booking management
  - Collaboration tools

## 💬 Forum System

- **Automatic bootstrap**: On first access the platform ensures required tables exist and seeds default categories (`public-forum`, `actor-lounge`, `industry-insights`, `investor-circle`).
- **Sample content**: Public and actor lounges are pre-populated with welcome threads so teams can test conversation flows immediately.
- **Access control**: Routes enforce category-level permissions based on the requester’s role (unauthenticated users only reach public discussions).

## 🎨 Design System

### Color Palette
```css
--color-primary: #9C27B0 (Purple)
--color-primary-light: #BA68C8
--color-primary-dark: #7B1FA2

--color-actor: #9C27B0 (Purple)
--color-agent: #009688 (Teal)
--color-casting: #FF5722 (Orange)

--color-success: #4CAF50
--color-warning: #FFC107
--color-error: #F44336
```

### Typography
- **Headings**: Poppins (400-800 weight)
- **Body**: Inter (300-700 weight)
- **Base Size**: 16px (1rem)

### Spacing Scale
```css
--spacing-xs: 0.25rem (4px)
--spacing-sm: 0.5rem (8px)
--spacing-md: 1rem (16px)
--spacing-lg: 1.5rem (24px)
--spacing-xl: 2rem (32px)
--spacing-2xl: 3rem (48px)
--spacing-3xl: 4rem (64px)
```

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔐 Authentication

### Login UI updates
- Login page uses lucide-react icons (no emojis)
- Removed broken Dailey Core logo and “Powered by Dailey Core” line
- Small auth source pill in sidebar near Logout (desktop)

### Session Management
- Uses Zustand with localStorage persistence
- JWT tokens for API authentication (planned)
- Role-based route protection
- Development mode for role switching

## 📱 Key Components (Mobile-first)

### Layout Components
- **AppLayout**: Main application wrapper with navigation
- **PageHeader**: Consistent page headers with actions
- **PageContent**: Content wrapper with proper spacing

### UI Components
- **Button**: Multiple variants (primary, outline, ghost)
- **Input**: Form inputs with validation states
- **Card**: Content containers with consistent styling
- **Badge**: Status indicators and labels
- **Avatar**: User profile images with fallbacks

### Specialized Components
- **VideoReview**: Swipe-based video review for casting directors
- **VideoUpload**: Drag-and-drop or link video uploads
- **BottomNav**: Mobile navigation bar (active underline removed; highlight only)
- **SideNav**: Desktop sidebar navigation (auth pill near Logout)
- **Inside Connect**: Actor discover (`/actor/connect`), Agent inbox (`/agent/connect`), Agent listings (`/agent/connect/listings`)

## 🧭 Inside Connect

### API
- `GET/POST /api/connect/listings`, `GET/PATCH /api/connect/listings/:id`
- `GET/POST /api/connect/submissions`, `PATCH /api/connect/submissions/:id`
- `GET/PUT /api/connect/agency` (agent), `PUT /api/connect/prefs` (actor)

### Database
- `database/migrations/20251026_inside_connect.sql`
- Index fixes: `database/migrations/20251026_inside_connect_fix_indexes.sql`

### Seeding
- `scripts/seed-inside-connect.sql` (base), `scripts/seed-inside-connect-more.sql` (more listings)
- `scripts/seed-inside-connect-submissions-simple.sql` (sample inbox)

### Migration helper
- `scripts/apply-inside-connect.mjs` reads `.env` and applies schema idempotently

## 🚀 Features

### Current Features
- ✅ Beautiful, responsive UI
- ✅ Role-based dashboards
- ✅ Video upload and review system
- ✅ Mobile-first design (buttons/tabs readable on small screens; no horizontal scrolling)
- ✅ Demo authentication
- ✅ Profile completion tracking (real; can be hidden per user preference)
- ✅ Submission tracking

### Planned Features
- 🔄 Real backend API
- 🔄 PostgreSQL database
- 🔄 File storage (S3/Cloudinary)
- 🔄 Email notifications
- 🔄 Payment integration
- 🔄 Advanced search/filtering
- 🔄 Analytics dashboard
- 🔄 PWA capabilities

## 🛠️ Development

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables (production highlights)
```env
# Database (cluster)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=castingly
DB_USER=castingly_app
DB_PASSWORD=********

# Dailey Core + DMAPI
DAILEY_CORE_AUTH_URL=https://core.dailey.cloud
DMAPI_BASE_URL=https://media.dailey.cloud
DMAPI_APP_ID=castingly
DMAPI_SERVICE_EMAIL=dmapi-service@castingly.com
DMAPI_SERVICE_PASSWORD=********

# App port behind Apache
PORT=3003
```

### Backfill DMAPI Metadata (category/sourceActorId)

An admin route normalizes legacy imports so the app can use fast metadata lookups instead of folder scans.

- Endpoint: `POST /api/admin/media/backfill`
- Auth: `X-Admin-Secret`, Core admin Bearer token, or a `dmapi_` API key
- Params:
  - `userId=<actor-uuid>` optional (omit to scan all)
  - `dry=1|0` for dry-run vs apply
  - `category=headshot|gallery|reel|resume|self_tape|voice_over|document` (optional)
  - `max=<n>` optional cap per invocation (safe batches)
- Behavior: scans `castingly-public` and `castingly-private` folders for the actor, infers category + `sourceActorId`, and PATCHes file metadata with retry/backoff.

DMAPI prerequisite (small change):
- Either enable `/api/files` listing for `app_id=castingly` so user-scoped queries return DB ids, or add a `storage_key` lookup filter. The backfill route will then PATCH ids directly.

### Gallery Images (variants)

- Grid displays only the small variant to keep layouts fast and uniform.
- Clicking a gallery tile opens the full image (original if present; otherwise the largest available variant) from DMAPI.
- Variants follow the `_small|_medium|_large` naming convention; the UI groups variants by base name and picks the best for thumbnail and full views.

### Media Categorization

- Category priority: folder path > first tag > metadata.category (ignoring `other`/`image`) > mime.
- Folders containing `gallery` → gallery; `headshot` → headshot; `reel`, `voice`, `resume`, `self-tape`, `document` map respectively.
- Older items without metadata are still surfaced via folder listing fallbacks (public + private headshots, gallery).

### Avatars & First Paint

- Dashboard avatar priority: `local preview` → `store user.avatar_url` (from login) → `server profile avatar_url` → `safe avatar proxy`.
- Profile avatar priority: `server avatar_url` → first small headshot tile → safe avatar proxy.
- Large avatars load with `fetchPriority=high` and `loading=eager` to remove first-paint delay.

### Profile Updates

- PATCH `/api/actors/:id/profile` updates both `users` and `profiles` fields.
- GET `/api/actors/:id` returns full users+profiles for self (any role). Edits reflect immediately.
- Response headers: `X-Profile-Source: db|fallback|cache` and, with `?media=1`, `X-Media-Meta-Count`/`X-Media-Folder-Count` for diagnostics.

### Deleting Media

- DELETE `/api/media/actor/:actorId/files/:fileId` accepts either a DMAPI id or a filename.
- If a filename is provided, the server resolves it within common actor folders and deletes by the actual DMAPI id.

## 📄 API Structure (Planned)

### Endpoints
```
/api/auth
  POST /login
  POST /register
  POST /logout
  GET  /me

/api/actors
  GET    /profile
  PUT    /profile
  GET    /submissions
  POST   /submissions
  GET    /opportunities

/api/casting
  GET    /projects
  POST   /projects
  GET    /submissions
  PUT    /submissions/:id

/api/agents
  GET    /roster
  POST   /roster
  GET    /submissions
```

## 🧪 Testing

### Test Coverage Areas
- Component rendering
- User authentication flow
- Form validation
- API endpoints
- Role-based access control
- Video upload functionality

## 📝 Notes

### Mobile Optimization
- Touch-optimized interfaces
- Swipe gestures for video review
- Bottom navigation for thumb reach
- Responsive typography and spacing

### Performance Considerations
- Image optimization with Next.js Image
- Lazy loading for heavy components
- Code splitting by route
- Skeleton loaders for better perceived performance

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

## 🤝 Contributing

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Maintain component modularity
- Write descriptive commit messages
- Document complex logic

### Component Guidelines
- Keep components focused and reusable
- Use composition over inheritance
- Implement proper error boundaries
- Add loading and error states
- Test on multiple devices

## 📞 Support

For issues or questions, please refer to the GitHub repository or contact the development team.

---

**Version**: 2.0.0
**Last Updated**: September 2024
**Status**: Active Development
### CDN & DMAPI Streaming (Images)

- Public images are served via `https://media.dailey.cloud/api/serve/<storage_key>` (e.g., `api/serve/files/<userId>/castingly-public/actors/<id>/headshots/<name>`).
- DMAPI streams image content with HTTP 200 for public images, enabling Cloudflare edge caching of actual bytes (no 302 redirects). Response headers: `Cache-Control: public, max-age=31536000, immutable`.
- Private/signed assets continue to bypass cache (`private, no-store`) to preserve security.
- Thumbnails: prefer `*_small.webp` (≈384px) and `*_thumbnail.webp` for grids; open large/original on click (lightbox).

Cloudflare (Free/Pro) rules to use:
- Cache Everything for `media.dailey.cloud/api/serve/.../castingly-public/...` (long TTLs), BYPASS for `.../castingly-private/...` or when the URL has `?signed=`.
- If on Pro, you can use Image Resizing (`cdn-cgi/image`) for responsive thumbs; otherwise use pre-generated `*_small.webp`.
