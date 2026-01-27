# LifeAligner

A career planning and contentment platform featuring interactive workshops, goal-setting tools, and community support based on Tim Collins' proven framework.

## 🚀 Project Overview

LifeAligner helps professionals align their career goals with their core values through:
- 🎯 **Interactive Landing Page** - Beautiful, engaging introduction to the framework
- 📝 **Interactive Workbook** - Build your personalized LifeFrame and Roadmap
- 🎬 **TEDx Integration** - Watch Tim Collins' "Redefining Contentment" talk
- 👥 **Community Forum** - Connect with others on similar journeys
- 📄 **PDF Export** - Print your career plan as a one-page reference

## ✨ Current Features

### Landing Page Components
- **Hero Section** - Animated background with mockup showcase
- **What is Contentment** - Navy-to-teal gradient section explaining the framework
- **5-Step Process** - Animated circular flow diagram with orbiting steps
- **Interactive Tools** - Tab-based LifeFrame and Roadmap previews
- **Interactive Journey** - Step-by-step navigator with examples and time estimates
- **Social Proof** - TEDx video embed and credibility stats (40+ years, $2B+ company)
- **Testimonial Carousel** - Auto-playing with manual navigation
- **Gradient Wave Dividers** - Smooth transitions between all sections

### Design System
- Workbook-inspired color gradients
- Smooth wave section transitions
- Micro-animations and hover effects
- Mobile-responsive layouts

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase)
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Hosting:** Vercel
- **Version Control:** Git + GitHub

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase account)
- Git configured with increased buffer size for large files

### Installation

```bash
# Clone the repository
git clone https://github.com/spierre38/life-aligner.git
cd life-aligner

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
/app
  /components          # Reusable React components
    Interactive5StepJourney.tsx
    InteractiveToolsSection.tsx
    RealSocialProof.tsx
    WorkingTestimonialCarousel.tsx
  page.tsx            # Main landing page
  globals.css         # Global styles and animations
/docs                 # Documentation
/lib                  # Utility functions (Supabase client)
/public               # Static assets (images, mockups)
/tailwind.config.ts   # Tailwind configuration
```

## 📚 Documentation

- **[Components Guide](./docs/COMPONENTS.md)** - Detailed component documentation
- **[Design System](./docs/DESIGN_SYSTEM.md)** - Colors, gradients, and patterns
- **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)** - Setup and workflow
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment
- **[Supabase Setup](./docs/supabase-profiles-setup.md)** - Database configuration

## 🎨 Key Design Features

- **Gradient Backgrounds** - Navy-to-teal, purple, and blue-purple-pink gradients
- **Wave Dividers** - SVG-based smooth transitions between sections
- **Interactive Components** - Tabs, carousels, step navigators with state management
- **Animations** - Blob animations, fades, orbiting elements
- **Responsive** - Mobile-first design with breakpoints

## 👨‍💻 Development

### Running Locally

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Git Configuration

For pushing large files (like images):
```bash
git config --global http.postBuffer 524288000
```

## 🚀 Deployment

The project is configured for deployment on **Vercel**:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main` branch

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 📝 Recent Updates

- **January 2026** - Added gradient wave dividers between sections
- **January 2026** - Created interactive components (Tools, Journey, Social Proof, Testimonials)
- **January 2026** - Implemented workbook-inspired color scheme
- **January 2026** - Added hero mockup and animated circular flow diagram

## 🤝 Contributing

This is a private project. For questions or collaboration inquiries, contact the repository owner.

## 👨‍💻 Creator

**Developer:** spierre38  
**Project Start:** January 2026  
**Based on:** Tim Collins' LifeAligner Framework

## 📄 License

Private project - All rights reserved
