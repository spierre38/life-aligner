# LifeAligner

A career planning and development platform featuring interactive workshops, goal-setting tools, and community support.

## 🚀 Project Overview

LifeAligner helps professionals align their career goals with their core values through:
- 📹 **Expert Video Seminars** - Learn proven frameworks for career planning
- 📝 **Interactive Workbook** - Build your personalized LifeFrame and Roadmap
- 👥 **Community Forum** - Connect with others on similar journeys
- 📄 **PDF Export** - Print your career plan as a one-page reference

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase/Neon)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Hosting:** Vercel

## 📋 Development Timeline

**Phase 1 (Weeks 1-3):** Foundation & Authentication  
**Phase 2 (Weeks 4-8):** Core Features (Videos, Workbook, Payments)  
**Phase 3 (Weeks 9-11):** Advanced Features (Community, AI)  
**Phase 4 (Weeks 12-14):** Polish & Launch  

**Target Launch:** May 1, 2026

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase or Neon account)
- Stripe account for payments

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
/app              # Next.js pages and routes
/components       # Reusable React components
/lib              # Utility functions and helpers
/prisma           # Database schema and migrations
/public           # Static assets
```

## 🔑 Environment Variables

See `.env.example` for required environment variables.

## 📚 Documentation

- See `/docs` folder for detailed documentation
- [Setup Walkthrough](./docs/setup-walkthrough.md)
- [Implementation Plan](./docs/implementation-plan.md)

## 👨‍💻 Development

Built with collaboration between human developer and AI assistant.

**Creator:** spierre38  
**Project Start:** January 2026

## 📄 License

Private project - All rights reserved
