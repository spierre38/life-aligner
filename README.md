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

### Authentication & User Management
- **Supabase Auth** - Email/password authentication with secure session management
- **Profile System** - Automatic user profile creation and management
- **Protected Routes** - Auth-gated access to dashboard and worksheets

### Dashboard
- **Progress Tracking** - Visual progress indicators for all 5 workbook steps
- **Navigation Cards** - Clickable cards for Values, Interests, and upcoming worksheets
- **AuthNavbar** - Fixed navigation with workbook dropdown menu and sign out

### Admin Access
- **Admin Dashboard** - Exclusive panel for administrators to manage users and view system-wide stats
- **Restricted View** - Administrators are restricted to the admin dashboard and cannot access regular user dashboard features to ensure separation of concerns and data integrity. This is enforced via middleware and authentication checks.

### Interactive Worksheets

#### Values Worksheet (Step 1/5)
- **Selection Phase** - Choose from 20 core values with hover descriptions
- **Prioritization Phase** - Drag-and-drop reordering with priority numbers
- **Data Persistence** - Saves to Supabase with name, description, and priority
- **Video Placeholder** - Introduction video with skip functionality

#### Interests Worksheet (Step 2/5)
- **Dual Tabs** - "Existing Interests" vs "Interests to Explore"
- **8 Categories** - Arts & Crafts, Performing, Food & Drink, Games, Nature, Technical, Physical Activities, Historical
- **Search Functionality** - Filter 100+ interests by keyword
- **Collapsible Categories** - Color-coded sections with selection counters
- **Data Persistence** - Saves both existing and exploring interests separately

### Landing Page Components
- **Hero Section** - Animated background with mockup showcase
- **Tim Collins Story** - Biography section with large photo and credentials
- **What is Contentment** - Navy-to-teal gradient section explaining the framework
- **5-Step Process** - Animated circular flow diagram with orbiting steps
- **Interactive Tools** - Tab-based LifeFrame and Roadmap previews
- **Interactive Journey** - Step-by-step navigator with examples and time estimates
- **Social Proof** - TEDx video embed and credibility stats (40+ years, $2B+ company)
- **Testimonial Carousel** - Auto-playing with manual navigation
- **Decorative Illustrations** - Peaceful meditation, values thinking, journey path, achievement symbols
- **Gradient Wave Dividers** - Smooth transitions between all sections

### Design System
- Workbook-inspired color gradients (blue-purple, pink-orange)
- Dark text contrast (text-gray-800) for accessibility
- Smooth wave section transitions
- Micro-animations and hover effects
- Mobile-responsive layouts
- Fixed navigation with dropdown menus

## 📝 Recent Updates

- **January 27, 2026** - Added Values and Interests interactive worksheets with data persistence
- **January 27, 2026** - Created AuthNavbar component with workbook dropdown menu
- **January 27, 2026** - Implemented VideoPlaceholder component for worksheet introductions
- **January 27, 2026** - Built dashboard with progress tracking and clickable worksheet cards
- **January 27, 2026** - Added authentication system (login/signup) with Supabase
- **January 27, 2026** - Improved text contrast across all pages for better readability
- **January 27, 2026** - Added Tim Collins story section with biography
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
