# LifeAligner Components Documentation

This document provides detailed information about all React components in the LifeAligner application.

## Table of Contents

1. [InteractiveToolsSection](#interactivetoolssection)
2. [Interactive5StepJourney](#interactive5stepjourney)
3. [RealSocialProof](#realsocialproof)
4. [WorkingTestimonialCarousel](#workingtestimonialcarousel)
5. [OrbitingSteps](#orbitingsteps)

---

## InteractiveToolsSection

**Location:** `/app/components/InteractiveToolsSection.tsx`

### Purpose
A tabbed interface showcasing the two primary tools: LifeFrame and Roadmap. Users can switch between tabs to preview each tool with detailed descriptions and visual mockups.

### Features
- Tab-based navigation with smooth transitions
- Animated content switching
- Gradient backgrounds matching tool themes
- Responsive layout for mobile and desktop
- Visual mockups for each tool

### Usage

```tsx
import { InteractiveToolsSection } from './components/InteractiveToolsSection';

<InteractiveToolsSection />
```

### State Management
- Uses `useState` to track active tab ('lifeframe' | 'roadmap')
- Tab switching triggers smooth content transitions

### Styling
- **LifeFrame** - Teal gradient background (`from-teal-600 to-blue-600`)
- **Roadmap** - Purple gradient background (`from-purple-600 to-pink-600`)

---

## Interactive5StepJourney

**Location:** `/app/components/Interactive5StepJourney.tsx`

### Purpose
An interactive step-by-step navigator that guides users through the LifeAligner 5-step process. Shows detailed information for each step with examples and time estimates.

### Features
- 5 clickable step circles with connection lines
- Active step visualization with gradient and scale
- Completed step indicators (checkmarks)
- Detailed step info card showing:
  - Icon (📌, ❤️, 🎯, ⭐, ✅)
  - Category (LifeFrame or Roadmap)
  - Time estimate (15-60 minutes)
  - Description
  - Real-world example
- Previous/Next navigation buttons
- Visual progress bar
- Final CTA button on step 5

### Usage

```tsx
import { Interactive5StepJourney } from './components/Interactive5StepJourney';

<Interactive5StepJourney />
```

### State Management
- Uses `useState` to track current step (0-4)
- Button states update based on step position
- Completed steps tracked for visual feedback

### Steps Structure

```typescript
const steps = [
  {
    number: 1,
    title: "Define Your Values",
    category: "LifeFrame",
    time: "15-30 minutes",
    icon: "📌",
    description: "...",
    example: "..."
  },
  // ... 4 more steps
]
```

---

## RealSocialProof

**Location:** `/app/components/RealSocialProof.tsx`

### Purpose
Builds credibility by showcasing Tim Collins' TEDx talk and real-world statistics about the LifeAligner framework.

### Features
- **TEDx Video Section**
  - Video placeholder with play button
  - TEDx Endicott College branding
  - Duration indicator (11:31)
  - Hover animation on play button

- **Credibility Stats** (3 cards)
  - 40+ Years of Real-World Testing
  - $2B+ Company Built Using Framework
  - Always Free to Use

- Gradient wave divider transition to next section

### Usage

```tsx
import { RealSocialProof } from './components/RealSocialProof';

<RealSocialProof />
```

### Styling
- Section background: `bg-gradient-to-br from-blue-50 to-purple-50`
- Stats cards: White background with gradient text
- Bottom wave divider: White fill for transition

---

## WorkingTestimonialCarousel

**Location:** `/app/components/WorkingTestimonialCarousel.tsx`

### Purpose
An auto-playing carousel showcasing user testimonials with manual navigation controls.

### Features
- Auto-play functionality (5-second intervals)
- Manual navigation:
  - Previous/Next arrow buttons
  - Clickable indicator dots
- Smooth slide transitions (500ms)
- Path-themed background pattern
- 5-star rating display
- User avatars with gradient backgrounds

### Usage

```tsx
import { WorkingTestimonialCarousel } from './components/WorkingTestimonialCarousel';

<WorkingTestimonialCarousel />
```

### State Management

```typescript
const [current, setCurrent] = useState(0);
const [isAutoPlaying, setIsAutoPlaying] = useState(true);
```

- Auto-play pauses when user manually navigates
- `useEffect` manages auto-play interval
- Wraps around: after last slide, returns to first

### Testimonials Structure

```typescript
const testimonials = [
  {
    initial: 'S',
    name: 'Sarah Chen',
    role: 'Graduate Student, Stanford',
    text: '...',
    gradient: 'from-blue-500 to-purple-500',
    bgGradient: 'from-blue-50 to-purple-50'
  },
  // ... more testimonials
]
```

### Styling
- Background pattern: `/path-background.png` at 30% opacity
- Each testimonial has unique gradient theme
- Wave divider: Blue-purple-pink gradient

---

## OrbitingSteps

**Location:** `/app/page.tsx` (inline component)

### Purpose
An animated circular flow diagram visualizing the continuous process of contentment.

### Features
- 5 orbiting step indicators
- Continuous rotation animation
- Smooth transitions between steps
- Responsive sizing

### Usage

```tsx
<OrbitingSteps />
```

### Animation
- Uses CSS `@keyframes spin` animation
- Rotates 360° over 20 seconds
- Steps positioned using trigonometry

### Steps
1. **Interests** (Teal)
2. **Values** (Blue)
3. **Purpose** (indigo
4. **Roadmap** (Purple)
5. **Happiness & Fulfillment** (Pink)

---

## Common Patterns

### Gradient Usage
All components use consistent gradient themes:
- **Teal/Blue** - Tools, Interests
- **Purple** - Process, Values
- **Pink** - Goals, Purpose
- **Navy** - Contentment definition

### Wave Dividers
Components include SVG wave dividers for smooth section transitions:

```tsx
<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
  <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <defs>
      <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#color1', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#color2', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#color3', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M321.39,56.44c58-10.79..." fill="url(#waveGradient)"></path>
  </svg>
</div>
```

### Responsive Design
All components use Tailwind responsive prefixes:
- `md:` - Medium screens and up (768px+)
- `lg:` - Large screens and up (1024px+)
- `grid md:grid-cols-2` - Single column mobile, two columns desktop

### Animations
Common animation classes used:
- `animate-fade-in` - Fade in on load
- `animate-blob` - Soft floating animation
- `hover:scale-105` - Subtle grow on hover
- `transition-transform duration-300` - Smooth interactions

---

## Best Practices

1. **Component Organization** - Each interactive section is its own component
2. **State Management** - Use `useState` for local state, keep it simple
3. **TypeScript** - All components use proper typing
4. **Accessibility** - Include `aria-label` for interactive elements
5. **Performance** - Use `useEffect` cleanup for intervals/timers
6. **Responsive** - Mobile-first approach with breakpoints
