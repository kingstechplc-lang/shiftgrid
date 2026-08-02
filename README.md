# ShiftGrid

> The marketplace connecting hospitals with healthcare professionals for locum and permanent work.

A full-stack Next.js 16 web platform where hospital admins post, manage, and fill locum (temporary/shift-based) and permanent job offers, and healthcare professionals — doctors, nurses, allied health — browse, filter, apply to, and track offers that match their profile.

## ✨ Features

### For Hospital Admins
- **Dashboard** with key stats: open offers, applicants in pipeline, upcoming shift start dates, recently filled roles
- **Create, edit, publish, pause, and close offers** (both locum and permanent) with conditional fields
- **Set required qualifications** per offer: license type, specialty, minimum experience
- **Kanban-style applicant pipeline**: Applied → Under Review → Shortlisted → Offered → Accepted / Declined → Filled
- **Review candidate profiles** with CV, licenses, and certifications
- **In-app messaging** with candidates
- **Manage hospital profile**: name, departments/locations, description
- **Invite and manage** other admins at the same hospital
- **Export applicants to CSV**; duplicate an existing offer as a template

### For Healthcare Staff
- **Build a profile**: specialty/role, years of experience, licenses & certifications (with expiry dates), location, availability, preferred offer types, resume
- **Browse and search offers** with filters: specialty, offer type, location, pay range, start date, urgency, hospital
- **View full offer detail**: description, requirements, pay/rate, dates, hospital info
- **Save/bookmark offers** for later
- **Apply** (permanent) or **express interest** (locum) with a cover note
- **Track every application's status** on a personal dashboard
- **Withdraw an application**
- **Message hospital admins** in-app
- **Get notified** when: a new offer matches, an application status changes, a message is received, or a license is nearing expiry

### Authentication & Security
- **Email verification gate**: 6-digit code sent on registration (demo mode shows the code in the UI; production uses Postmark)
- **Google OAuth**: "Continue with Google" button (demo mode in sandbox; real OAuth via NextAuth in production)
- **Role-based access control** enforced on every API request — hospital admins are scoped to their own hospital's data
- **Password hashing** with SHA-256 (production should use Argon2/bcrypt via NextAuth)
- **Audit event log** tracking all offer and application status changes

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui (New York) |
| **Database** | Neon Postgres (serverless, scale-to-zero, Git-like branching) |
| **ORM** | Prisma (SQLite for dev, Postgres for production) |
| **Auth** | Custom session-based (email verification + Google OAuth demo); production-ready for NextAuth |
| **Email** | Postmark (production) / demo mode (codes shown in UI) |
| **Hosting** | Vercel (Neon is a native Vercel Marketplace integration) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun
- A Neon Postgres database ([get one free](https://neon.tech))

### Installation

```bash
# Clone the repo
git clone https://github.com/kingstechplc-lang/shiftgrid.git
cd shiftgrid

# Install dependencies
bun install

# Set up your environment
cp download/db/.env.example .env
# Edit .env with your Neon connection string + auth secrets

# Push the schema to Neon
bun run db:push

# Seed the database with sample data
bun run scripts/seed.ts

# Start the dev server
bun run dev
```

Visit `http://localhost:3000`.

### Demo Accounts

All seeded accounts use the password `password123`:

| Role | Email | Hospital |
|------|-------|----------|
| Hospital Admin | `sarah.chen@stmarys.test` | St. Mary's General |
| Hospital Admin | `priya.n@lakeside.test` | Lakeside Regional |
| Healthcare Staff | `james.morrison@staff.test` | — (Emergency Medicine) |
| Healthcare Staff | `anita.rao@staff.test` | — (ICU Nursing) |

Or click **"Continue with Google"** for instant demo login.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # REST API routes (20+ endpoints)
│   │   ├── auth/               # login, signup, logout, me, verify-email, google
│   │   ├── offers/             # CRUD + duplicate + filter
│   │   ├── applications/       # apply, withdraw, status update
│   │   ├── dashboard/          # role-specific stats
│   │   ├── messages/           # in-app messaging
│   │   ├── notifications/      # typed notifications
│   │   ├── credentials/        # license/cert tracking
│   │   └── health/db/          # DB health endpoint
│   └── page.tsx                # Root SPA router
├── components/
│   ├── shiftgrid/              # 19 view components
│   │   ├── auth-screen.tsx
│   │   ├── verify-email-screen.tsx
│   │   ├── app-shell.tsx
│   │   ├── dashboards.tsx
│   │   ├── browse.tsx
│   │   ├── offer-detail.tsx
│   │   ├── offer-form.tsx
│   │   ├── admin-offer-detail.tsx  # Kanban pipeline
│   │   └── ...
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── db.ts                   # Prisma client (Neon-aware)
│   ├── auth.ts                 # Session helpers + RBAC
│   ├── email.ts                # Postmark + demo mode
│   ├── verification.ts         # 6-digit code generation/verification
│   ├── types.ts                # Shared types + formatters
│   └── store.ts                # Zustand client state
└── prisma/
    └── schema.prisma           # 10 models, 5 enums
```

## 🗄 Database Schema

10 models: `Hospital`, `User`, `VerificationToken`, `Offer`, `Application`, `Credential`, `Message`, `Notification`, `SavedOffer`, `AuditEvent`

5 enums: `Role`, `OfferType`, `OfferStatus`, `Visibility`, `ApplicationStatus`

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema.

## 🔧 Production Deployment

### Environment Variables

```bash
DATABASE_URL=postgres://...           # Neon connection string
AUTH_SECRET=                          # openssl rand -base64 32
GOOGLE_CLIENT_ID=                     # Google OAuth (optional)
GOOGLE_CLIENT_SECRET=                 # Google OAuth (optional)
POSTMARK_API_KEY=                     # Transactional email (optional — demo mode if empty)
EMAIL_FROM="ShiftGrid <noreply@...>"
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
```

### Deploy to Vercel

1. Push this repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add the environment variables above
4. Neon is a native Vercel Marketplace integration — each preview deployment gets its own DB branch automatically

## 📊 Database Setup Automation

The `download/db/` folder contains everything you need to provision a production database:

| File | Purpose |
|------|---------|
| `schema.ts` | Drizzle ORM schema (alternative to Prisma) |
| `migration.sql` | Idempotent Postgres migration |
| `seed.sql` | SQL seed data |
| `setup-db.sh` | One-command setup script |
| `README.md` | Full documentation |

## 📝 License

MIT
