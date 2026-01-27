# LifeAligner Design System

This document outlines the design system used throughout the LifeAligner application, including colors, gradients, typography, animations, and patterns.

## Color Palette

### Workbook-Inspired Gradients

The color scheme is inspired by Tim Collins' LifeAligner workbook, using rich gradients that create visual depth and guide users through the journey.

#### Primary Gradients

**1. Navy to Teal (Contentment)**
```css
background: linear-gradient(to right, #0a1f44, #1e4d7b, #3b8b9f);
```
- Used in: "What is Contentment" section
- Hex codes: `#0a1f44` → `#1e4d7b` → `#3b8b9f`
- Represents: Deep understanding, clarity, growth

**2. Purple Gradient (Process)**
```css
background: linear-gradient(to right, #a78bca, #8b5fbf, #5d2a8f);
```
- Used in: "Contentment is a Process" section
- Hex codes: `#a78bca` → `#8b5fbf` → `#5d2a8f`
- Represents: Transformation, journey, purpose

**3. Blue-Purple-Pink (CTA)**
```css
background: linear-gradient(to bottom right, #2563eb, #9333ea, #ec4899);
```
- Used in: Call-to-action section
- Hex codes: `#2563eb` (blue-600) → `#9333ea` (purple-600) → `#ec4899` (pink-600)
- Represents: Energy, action, achievement

### Component-Specific Colors

**Tools Section**
- LifeFrame: Teal gradient (`from-teal-600 to-blue-600`)
- Roadmap: Purple gradient (`from-purple-600 to-pink-600`)

**Value, Purpose, Interests Cards**
- Blue: `from-blue-700 to-blue-800`
- Purple: `from-purple-700 to-purple-800`
- Pink: `from-pink-700 to-pink-800`

**Testimonial Backgrounds**
- Slide 1: `from-blue-50 to-purple-50`
- Slide 2: `from-purple-50 to-pink-50`
- Slide 3: `from-teal-50 to-blue-50`

### Neutral Colors

```css
Gray scale (Tailwind):
- gray-50: #f9fafb (backgrounds)
- gray-300: #d1d5db (borders)
- gray-600: #4b5563 (secondary text)
- gray-700: #374151 (body text)
- gray-900: #111827 (headings)
```

---

## Wave Dividers

Wave dividers create smooth, organic transitions between sections, reinforcing the journey metaphor.

### Implementation

```tsx
<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
  <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <defs>
      <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#0a1f44', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#1e4d7b', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3b8b9f', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
      fill="url(#waveGradient1)"></path>
  </svg>
</div>
```

### Wave Gradient Mapping

| From Section | To Section | Gradient Colors |
|-------------|------------|-----------------|
| Hero | Contentment | Navy-teal gradient |
| Contentment | Process | Purple gradient |
| Process | Tools | White (clean transition) |
| Social Proof | Testimonials | White |
| Testimonials | CTA | Blue-purple-pink |

### Key Properties
- **Height:** `h-24` (96px)
- **Rotation:** `rotate-180` (flips wave)
- **Z-index:** `z-20` (layers above content)
- **SVG viewBox:** `0 0 1200 120`
- **Preserve Aspect Ratio:** `none` (stretches to fit)

---

## Typography

### Font Family

Primary font: System font stack (native performance)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...
```

### Heading Scale

```css
Hero Title: text-6xl md:text-7xl (60px/72px)
Section Headers: text-4xl md:text-5xl (36px/48px)
Component Titles: text-3xl (30px)
Card Headers: text-2xl (24px)
Body Large: text-xl (20px)
Body: text-base (16px)
Small: text-sm (14px)
```

### Font Weights

```css
Bold: font-bold (700) - Headings
Semibold: font-semibold (600) - Sub-headings
Normal: font-normal (400) - Body text
```

### Text Colors

```css
Headings: text-gray-900 or text-white (on dark backgrounds)
Body: text-gray-700 or text-gray-600
Muted: text-gray-500
On gradients: text-white or gradient text (bg-clip-text)
```

### Gradient Text

```tsx
<h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
  Your Path to Contentment
</h1>
```

---

## Spacing & Layout

### Container Widths

```css
max-w-7xl: 1280px (hero sections)
max-w-6xl: 1152px (content sections)
max-w-4xl: 896px (testimonials, focused content)
max-w-3xl: 768px (videos, narrow content)
max-w-2xl: 672px (quotes, centered text)
```

### Padding Scale

```css
Section vertical: py-20 (80px)
Section horizontal: px-4 (16px)
Cards: p-8 or p-12 (32px/48px)
Buttons: px-8 py-4 (32px/16px)
```

### Gap/Spacing

```css
gap-2: 8px (tight spacing)
gap-4: 16px (normal spacing)
gap-6: 24px (comfortable spacing)
gap-8: 32px (section spacing)
gap-12: 48px (large spacing)
```

---

## Animations

### Custom Animations

Defined in `globals.css`:

**1. Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}
```

**2. Blob Animation**
```css
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(-20px, -10px) scale(1.05); }
}
.animate-blob {
  animation: blob 7s infinite;
}
```

**3. Spin (Orbiting Steps)**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Animation Delays

```css
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
```

### Transition Classes

```css
transition: All properties (200ms)
transition-transform: Transform only
transition-colors: Colors only
duration-300: 300ms
duration-500: 500ms
ease-out: Easing function
```

---

## Interactive States

### Hover Effects

```tsx
// Scale grow
hover:scale-105

// Shadow increase
hover:shadow-xl

// Color change
hover:bg-gray-50
hover:border-purple-600

// Combined
className="transform hover:scale-105 transition duration-300"
```

### Active States

```tsx
// Active tab
{isActive && "border-b-4 border-teal-600 text-teal-600"}

// Selected step
{isCompleted && "bg-gradient-to-r from-teal-600 to-blue-600"}
```

---

## Shadows

```css
shadow-sm: Subtle elevation
shadow-md: Card elevation
shadow-lg: Modal/dropdown
shadow-xl: Hero elements
shadow-2xl: Maximum depth
```

## Border Radius

```css
rounded-sm: 2px
rounded: 4px
rounded-md: 6px
rounded-lg: 8px
rounded-xl: 12px
rounded-2xl: 16px
rounded-3xl: 24px
rounded-full: 9999px (circles)
```

---

## Blur Effects

### Frosted Glass

```tsx
<div className="bg-white/10 backdrop-blur-sm">
  Glassmorphism content
</div>
```

### Background Blurs

```tsx
// Blob backgrounds
className="filter blur-xl opacity-20"

// Decorative elements
className="blur-2xl opacity-50"
```

---

## Responsive Breakpoints

```css
sm: 640px   (Small devices)
md: 768px   (Tablets)
lg: 1024px  (Desktops)
xl: 1280px  (Large desktops)
2xl: 1536px (Extra large)
```

### Mobile-First Approach

```tsx
// Stack on mobile, 2 columns on md+
<div className="grid md:grid-cols-2 gap-12">

// Center on mobile, left-align on lg+
<div className="text-center lg:text-left">

// Hide on mobile, show on md+
<div className="hidden md:block">
```

---

## Icons & Graphics

### Icon Sources
- **Emoji:** Used for step icons (📌, ❤️, 🎯, ⭐, ✅)
- **SVG:** Custom graphics (arrows, play button, stars)
- **Tailwind Icons:** Built with SVG paths

### SVG Best Practices
- Use `currentColor` for fill/stroke to inherit text color
- Keep viewBox consistent (usually `0 0 24 24` or `0 0 20 20`)
- Add `aria-label` for accessibility

---

## Accessibility

### Color Contrast
- Ensure 4.5:1 contrast ratio for body text
- Ensure 3:1 contrast ratio for large text
- Use white text on dark gradients
- Use dark text on light backgrounds

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-purple-600
```

### Semantic HTML
- Use `<section>` for major sections
- Use `<button>` for interactive elements
- Use `<nav>` for navigation
- Add `aria-label` to icon buttons

---

## Design Principles

1. **Visual Hierarchy** - Size, color, and spacing guide the eye
2. **Consistency** - Reuse  patterns across all components
3. **Smooth Transitions** - Everything animates smoothly
4. **Mobile-First** - Design for smallest screen, enhance up
5. **Progressive Enhancement** - Core content accessible, animations enhance
6. **Purpose-Driven** - Every design choice supports the journey narrative
