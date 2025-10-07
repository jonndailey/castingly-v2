# Castingly v2 - Platform Documentation

## Overview
Castingly v2 is a comprehensive casting management platform built with Next.js 14, designed to serve three distinct user roles: Actors, Agents, and Casting Directors. The platform facilitates the entire casting workflow from talent discovery to final bookings.

## Technical Architecture

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS v3 with custom design tokens
- **Animation**: Framer Motion for smooth transitions
- **State Management**: Zustand with persist middleware
- **Authentication**: Custom auth store with role-based access

### Project Structure
```
/app/
├── actor/           # Actor portal pages
├── agent/           # Agent portal pages
├── casting/         # Casting director portal pages
├── (auth)/          # Authentication pages
└── globals.css      # Global styles

/components/
├── layouts/         # Page layout components
├── ui/              # Reusable UI components
└── forms/           # Form components

/lib/
├── store/           # Zustand state stores
├── utils/           # Utility functions
└── types/           # TypeScript definitions
```

## User Roles & Portals

### 1. Actor Portal (`/actor/`)

#### Actor Dashboard (`/actor/dashboard/page.tsx`)
- **Purpose**: Central hub for actor activity and opportunities
- **Key Features**:
  - Active auditions and submissions tracking
  - Upcoming callbacks and schedule
  - Performance metrics and booking stats
  - Recent activity feed
  - Quick actions for profile updates and submissions
- **Components**: Dashboard cards, activity timeline, stats overview
- **Mock Data**: Realistic audition scenarios with various project types

#### Actor Opportunities (`/actor/opportunities/page.tsx`)
- **Purpose**: Browse and apply to casting opportunities
- **Key Features**:
  - Advanced filtering by role type, location, pay rate, project type
  - Detailed casting notices with requirements
  - One-click application submission
  - Saved opportunities and application tracking
  - Union/non-union categorization
- **Components**: Opportunity cards, filter system, application modal
- **Mock Data**: Diverse casting calls across film, TV, theater, and commercials

#### Actor Profile (`/actor/profile/page.tsx`)
- **Purpose**: Comprehensive actor profile management
- **Key Features**:
  - Tabbed interface: Overview, Experience, Media, Availability
  - Professional stats and achievements display
  - Resume and headshot management
  - Skills and training documentation
  - Availability calendar integration
  - Agent representation information
- **Components**: Tabbed layout, media gallery, stats cards
- **Mock Data**: Complete actor profiles with credits and media

#### Actor Submissions (`/actor/submissions/page.tsx`)
- **Purpose**: Track and manage all casting submissions
- **Key Features**:
  - Submission status tracking (pending, reviewed, callback, booked, passed)
  - Detailed submission history
  - Callback scheduling and management
  - Notes and feedback from casting directors
  - Withdrawal and resubmission options
- **Components**: Status timeline, submission cards, action buttons
- **Mock Data**: Various submission states and casting scenarios

### 2. Agent Portal (`/agent/`)

#### Agent Dashboard (`/agent/dashboard/page.tsx`)
- **Purpose**: Overview of agent's client roster and activity
- **Key Features**:
  - Client performance metrics and booking rates
  - Active submissions and callback tracking
  - Revenue and commission tracking
  - Industry insights and trends
  - Quick client management actions
- **Components**: Performance charts, client cards, activity feed
- **Mock Data**: Multi-client agency scenarios with diverse talent

#### Agent Clients (`/agent/clients/page.tsx`)
- **Purpose**: Comprehensive client management system
- **Key Features**:
  - Client roster with detailed profiles
  - Performance tracking and analytics
  - Submission management for multiple clients
  - Contract and commission tracking
  - Client communication history
- **Components**: Client grid/list views, performance metrics, search/filter
- **Mock Data**: Diverse client portfolio with various career stages

#### Agent Opportunities (`/agent/opportunities/page.tsx`)
- **Purpose**: Discover and submit clients for casting opportunities
- **Key Features**:
  - Advanced opportunity filtering and matching
  - Bulk client submission capabilities
  - Match scoring based on client profiles
  - Opportunity tracking and deadline management
  - Custom submission notes and pitches
- **Components**: Opportunity browser, client matching interface, bulk actions
- **Mock Data**: High-value casting opportunities across all mediums

#### Agent Analytics (`/agent/analytics/page.tsx`)
- **Purpose**: Business intelligence and performance reporting
- **Key Features**:
  - Client booking rates and revenue analytics
  - Market trend analysis
  - Commission tracking and forecasting
  - Success rate metrics by category
  - Competitive benchmarking
- **Components**: Chart placeholders, metrics cards, trend indicators
- **Mock Data**: Comprehensive agency performance data

### 3. Casting Director Portal (`/casting/`)

#### Casting Director Profile (`/casting/profile/page.tsx`)
- **Purpose**: Professional casting director profile and reputation management
- **Key Features**:
  - Tabbed interface: Overview, Current Projects, Achievements, Testimonials
  - Industry credentials and experience showcase
  - Client testimonials and recommendations
  - Awards and recognition display
  - Current project status overview
  - Professional statistics and success metrics
- **Components**: Professional profile tabs, testimonial cards, achievement badges
- **Mock Data**: Established casting director with notable credits

#### Casting Director Projects (`/casting/projects/page.tsx`)
- **Purpose**: Comprehensive project management for casting assignments
- **Key Features**:
  - Grid and list view options for projects
  - Advanced filtering by status, budget, deadline, genre
  - Detailed project cards with progress tracking
  - Role fulfillment status and casting progress
  - Budget and timeline management
  - Client and production company information
- **Components**: Project cards, progress bars, filter system, status indicators
- **Mock Data**: Diverse projects from indie films to major studio productions

#### Casting Director Submissions (`/casting/submissions/page.tsx`)
- **Purpose**: Advanced submission review and talent evaluation system
- **Key Features**:
  - Sophisticated filtering by role, status, rating, submission date
  - Detailed actor profiles with headshots and resume information
  - Star rating system (1-5 stars) for talent evaluation
  - Status management (new, reviewed, shortlisted, callback, passed)
  - Bulk actions for efficient workflow management
  - Notes and feedback system for each submission
- **Components**: Submission cards, rating interface, status badges, filter system
- **Mock Data**: Realistic submission scenarios with diverse talent profiles

#### Casting Director Talent Discovery (`/casting/talent/page.tsx`)
- **Purpose**: Proactive talent discovery and outreach platform
- **Key Features**:
  - Comprehensive talent database with advanced search
  - Match scoring algorithm for role compatibility
  - Detailed talent profiles with booking rates and availability
  - Invitation system for direct talent outreach
  - Talent categorization by experience level and specialty
  - Union status and representation information
- **Components**: Talent cards, match scoring, invitation system, search interface
- **Mock Data**: Diverse talent pool with varying experience levels

#### Casting Director Auditions (`/casting/auditions/page.tsx`)
- **Purpose**: Audition and callback scheduling management system
- **Key Features**:
  - Comprehensive audition scheduling interface
  - Support for both virtual and in-person auditions
  - Confirmation status tracking (confirmed, pending)
  - Detailed scheduling information with duration and location
  - Special notes and requirements for each audition
  - Integration with calendar systems
- **Components**: Audition cards, status badges, scheduling interface
- **Mock Data**: Mixed virtual and in-person audition scenarios

#### Casting Director Analytics (`/casting/analytics/page.tsx`)
- **Purpose**: Performance analytics and casting insights dashboard
- **Key Features**:
  - Key performance metrics (active projects, roles filled, success rates)
  - Submission and audition tracking statistics
  - Recent activity timeline
  - Chart placeholders for future data visualization
  - Export functionality for reporting
  - Time-to-fill metrics and efficiency tracking
- **Components**: Metrics cards, activity timeline, chart placeholders
- **Mock Data**: Comprehensive casting performance data

## Design System & Components

### Layout Components
- **AppLayout**: Consistent page wrapper with navigation and authentication
- **PageHeader**: Standardized page titles, subtitles, and action buttons
- **PageContent**: Main content area with proper spacing and responsive behavior

### UI Components
- **Card System**: Flexible card components with headers, content, and actions
- **Button Variants**: Primary, outline, ghost, and size variations
- **Badge System**: Status indicators with semantic color coding
- **Avatar Components**: User profile images with fallback handling
- **Form Elements**: Consistent input, select, and form controls

### Animation System
- **Framer Motion**: Smooth page transitions and component animations
- **Staggered Animations**: Sequential item reveals for better UX
- **Hover Effects**: Subtle interactive feedback on components

## State Management

### Authentication Store (`/lib/store/auth-store.ts`)
- Role-based authentication (actor, agent, casting_director)
- Persistent login state across sessions
- User profile and permissions management

### Data Patterns
- **Mock Data Strategy**: Realistic, comprehensive sample data for all user roles
- **Type Safety**: Full TypeScript coverage for all data structures
- **State Persistence**: Zustand persist middleware for auth and preferences

## Routing & Navigation

### App Router Structure
- Role-based route organization (`/actor/`, `/agent/`, `/casting/`)
- Nested layouts for consistent portal experiences
- Protected routes with role-based access control

### Navigation Patterns
- Portal-specific navigation menus
- Breadcrumb navigation for deep pages
- Quick action buttons for common workflows

## Responsive Design

### Mobile-First Approach
- Tailwind CSS responsive utilities throughout
- Optimized mobile experiences for all user roles
- Touch-friendly interface elements

### Breakpoint Strategy
- `sm`: 640px+ (mobile landscape, small tablets)
- `md`: 768px+ (tablets)
- `lg`: 1024px+ (desktops)
- `xl`: 1280px+ (large desktops)

## Performance Considerations

### Code Splitting
- App Router automatic code splitting
- Route-based component loading
- Optimized bundle sizes per portal

### Image Optimization
- Next.js Image component usage
- Placeholder images with proper sizing
- Responsive image loading

## Development Workflow

### File Organization
- Co-located components and styles
- Consistent naming conventions
- Modular architecture for maintainability

### Type Safety
- Comprehensive TypeScript coverage
- Shared type definitions across components
- Runtime type validation where needed

## Current Status

### Completed Features
✅ Actor Portal (4 pages): Dashboard, Opportunities, Profile, Submissions
✅ Agent Portal (4 pages): Dashboard, Clients, Opportunities, Analytics  
✅ Casting Director Portal (6 pages): Profile, Projects, Submissions, Talent, Auditions, Analytics
✅ Consistent design system across all portals
✅ Role-based authentication and state management
✅ Responsive design for all screen sizes
✅ Comprehensive mock data for realistic development

### Technical Achievements
- **14 Total Pages**: Complete coverage of all three user roles
- **Consistent Architecture**: Shared components and patterns across portals
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: Latest Next.js 14 with App Router
- **Performance**: Optimized bundle splitting and responsive images
- **Accessibility**: Semantic HTML and proper ARIA attributes

### Mock Data Coverage
- **Actor Scenarios**: Various career stages from emerging to established
- **Agent Scenarios**: Multi-client roster management and analytics
- **Casting Scenarios**: Diverse projects from indie to major studio productions
- **Industry Realism**: Authentic terminology, workflows, and business metrics

### Component Reusability
- **Shared UI Components**: 20+ reusable components across portals
- **Consistent Patterns**: Layout, navigation, and interaction patterns
- **Design System**: Cohesive visual language and component library

This platform represents a complete casting management ecosystem, providing role-specific experiences while maintaining consistency and professional workflows throughout the entire casting process.