# LifeAligner Development Guide

This guide covers the development workflow, setup instructions, and best practices for working on the LifeAligner project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Git Workflow](#git-workflow)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **Git** v2.30.0 or higher ([Download](https://git-scm.com/))
- **Code Editor** - VS Code recommended with extensions:
  - ESLint
  - Tailwind CSS IntelliSense
  - Prettier

### Accounts Needed
- **GitHub** account (for version control)
- **Supabase** account (for database and auth)
- **Vercel** account (for deployment - optional for local dev)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/spierre38/life-aligner.git
cd life-aligner
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase client

### 3. Configure Git for Large Files

**Important:** Configure git to handle large file uploads:

```bash
git config --global http.postBuffer 524288000
```

This prevents HTTP 400 errors when pushing images and large assets.

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Other API keys as needed
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### Running the Application

```bash
# Development mode (with hot reloading)
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run linter
npm run lint
```

### Project Structure

```
life-aligner/
├── app/                    # Next.js App Router
│   ├── components/         # React components
│   │   ├── Interactive5StepJourney.tsx
│   │   ├── InteractiveToolsSection.tsx
│   │   ├── RealSocialProof.tsx
│   │   └── WorkingTestimonialCarousel.tsx
│   ├── page.tsx           # Main landing page
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── docs/                  # Documentation
├── lib/                   # Utilities
│   └── supabase.ts        # Supabase client
├── public/                # Static assets
│   ├── lifeAligner-mockup.png
│   └── path-background.png
├── tailwind.config.ts     # Tailwind configuration
├── next.config.ts         # Next.js configuration
└── package.json           # Dependencies
```

### Adding a New Component

1. **Create the component file:**
   ```bash
   touch app/components/MyNewComponent.tsx
   ```

2. **Component template:**
   ```tsx
   'use client';
   
   import { useState } from 'react';
   
   export function MyNewComponent() {
     const [state, setState] = useState('');
     
     return (
       <section className="py-20">
         <div className="max-w-6xl mx-auto px-4">
           {/* Component content */}
         </div>
       </section>
     );
   }
   ```

3. **Import in page:**
   ```tsx
   import { MyNewComponent } from './components/MyNewComponent';
   
   <MyNewComponent />
   ```

### Styling with T tailwind CSS

```tsx
// Mobile-first responsive design
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

// Hover effects
<button className="hover:scale-105 transition duration-300">

// Gradients
<div className="bg-gradient-to-r from-blue-600 to-purple-600">

// Custom animations
<div className="animate-fade-in">
```

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete styling guide.

---

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- Feature branches - `feature/component-name`
- Hotfix branches - `hotfix/issue-description`

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Add new interactive feature"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create a Pull Request on GitHub**

### Commit Message Format

Use descriptive commit messages:

```bash
# Bad
git commit -m "update"

# Good
git commit -m "Add gradient wave dividers between sections"

# Even better (with description)
git commit -m "Add gradient wave dividers between sections

- Convert section dividers to wavy SVG paths
- Apply gradient fills matching section colors
- Ensure consistent workbook-inspired aesthetic"
```

### Keeping Your Branch Updated

```bash
# Update main branch
git checkout main
git pull origin main

# Merge into your feature branch
git checkout feature/my-feature
git merge main
```

---

## Troubleshooting

### Common Issues

#### 1. Git Push Fails with HTTP 400

**Problem:** Pushing large files fails with `error: RPC failed; HTTP 400`

**Solution:**
```bash
git config --global http.postBuffer 524288000
```

#### 2. Module Not Found Error

**Problem:** `Module not found: Can't resolve 'xyz'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Port 3000 Already in Use

**Problem:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### 4. Environment Variables Not Loading

**Problem:** Supabase connection fails

**Solution:**
- Ensure `.env.local` exists in root directory
- Restart dev server after adding env vars
- Verify env var names start with `NEXT_PUBLIC_` for client-side access

#### 5. Tailwind Classes Not Applying

**Problem:** Styles don't show up

**Solution:**
- Check `tailwind.config.ts` includes correct content paths
- Restart dev server
- Clear `.next` cache: `rm -rf .next`

### Getting Help

1. Check existing documentation in `/docs`
2. Review component code for examples
3. Check Next.js docs: https://nextjs.org/docs
4. Check Tailwind docs: https://tailwindcss.com/docs

---

## Best Practices

### Code Style

1. **Use TypeScript** - Type all props and state
   ```tsx
   interface MyComponentProps {
     title: string;
     count?: number;
   }
   ```

2. **Component Composition** - Break large components into smaller pieces
   ```tsx
   // Instead of one 500-line component
   <InteractiveToolsSection>
     <TabNavigation />
     <ToolContent />
   </InteractiveToolsSection>
   ```

3. **Naming Conventions**
   - Components: PascalCase (`MyComponent.tsx`)
   - Functions: camelCase (`handleClick`)
   - Constants: UPPER_SNAKE_CASE (`MAX_ITEMS`)

4. **File Organization**
   - One component per file
   - Co-locate related components
   - Keep component files under 300 lines

### Performance

1. **Use Server Components by default** - Only add `'use client'` when needed
   ```tsx
   // Only add if component uses:
   // - useState/useEffect
   // - Browser APIs
   // - Event handlers
   'use client';
   ```

2. **Optimize Images**
   - Use Next.js `<Image>` component
   - Provide width/height
   - Use appropriate formats (WebP, PNG)

3. **Lazy Load When Appropriate**
   ```tsx
   import dynamic from 'next/dynamic';
   
   const HeavyComponent = dynamic(() => import('./HeavyComponent'));
   ```

### Accessibility

1. **Semantic HTML**
   ```tsx
   <section> for major sections
   <nav> for navigation
   <button> for interactive elements (not <div>)
   ```

2. **ARIA Labels**
   ```tsx
   <button aria-label="Next testimonial">
   ```

3. **Keyboard Navigation**
   - Ensure all interactive elements are focusable
   - Test with Tab key navigation

### State Management

1. **Keep State Local** - Use `useState` in components when possible
2. **Lift State When Needed** - Share state between closely related components
3. **Consider Context** - For truly global state (user, theme)

### Testing Checklist

Before committing:
- [ ] Code runs without errors
- [ ] UI looks correct on mobile and desktop
- [ ] All interactive elements work
- [ ] No console errors/warnings
- [ ] Accessibility: keyboard navigation works
- [ ] Performance: no unnecessary re-renders

---

## Useful Commands

### Package Management
```bash
npm install package-name      # Add dependency
npm install -D package-name   # Add dev dependency
npm uninstall package-name    # Remove dependency
npm update                    # Update all packages
```

### Cleanup
```bash
rm -rf .next                  # Clear Next.js cache
rm -rf node_modules           # Remove dependencies
npm install                   # Reinstall dependencies
```

### Git Aliases (Optional)

Add to `~/.gitconfig`:
```bash
[alias]
  st = status
  co = checkout
  br = branch
  cm = commit -m
  ps = push
  pl = pull
```

---

## Next Steps

- Read [COMPONENTS.md](./COMPONENTS.md) for component documentation
- Review [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for styling guidelines
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

Happy coding! 🚀
