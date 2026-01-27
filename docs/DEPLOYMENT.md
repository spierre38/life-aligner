# LifeAligner Deployment Guide

This guide covers deploying the LifeAligner application to production using Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment](#vercel-deployment)
3. [Environment Variables](#environment-variables)
4. [Domain Configuration](#domain-configuration)
5. [Monitoring & Logs](#monitoring--logs)
6. [Rollbacks & Previews](#rollbacks--previews)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub repository with latest code
- [x] Vercel account ([sign up free](https://vercel.com/signup))
- [x] Supabase project configured
- [x] All environment variables documented
- [x] Latest code pushed to `main` branch

---

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose `spierre38/life-aligner`
   - Click "Import"

2. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add each variable from your `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     ```
   - Select which environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait 1-3 minutes for build to complete
   - Your site will be live at `https://life-aligner.vercel.app`

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Confirm settings
# - Wait for deployment
```

---

## Environment Variables

### Required Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Analytics (if added later)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Environment Scopes

For each variable, select appropriate scopes:

- **Production** - Live site environment
- **Preview** - PR and branch previews
- **Development** - Local development (optional)

### Updating Environment Variables

1. Go to Project Settings → Environment Variables
2. Edit or add variables
3. **Important:** Redeploy for changes to take effect
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Select "Redeploy"

---

## Domain Configuration

### Using Vercel Domain (Default)

Your project is automatically available at:
```
https://life-aligner.vercel.app
```

### Adding Custom Domain

1. **Purchase Domain** (from Namecheap, GoDaddy, etc.)

2. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Click "Add"
   - Enter your domain: `lifealigner.com`
   - Click "Add"

3. **Configure DNS Records**

   Vercel will provide DNS records to add at your domain registrar:

   **Option A: Using Nameservers (Recommended)**
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

   **Option B: Using A and CNAME Records**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for Propagation**
   - DNS changes can take 24-48 hours
   - Check status in Vercel dashboard
   - Vercel auto-provisions SSL certificate

### SSL/HTTPS

- Automatically provided by Vercel
- Certificates auto-renew
- Forced HTTPS redirect enabled by default

---

## Monitoring & Logs

### Real-time Logs

View deployment and runtime logs:

1. Go to your project in Vercel
2. Click "Deployments" tab
3. Click on specific deployment
4. View "Build Logs" and "Function Logs"

### Analytics (Optional)

Enable Vercel Analytics:
1. Go to Project → Analytics tab
2. Click "Enable Analytics"
3. View page views, performance metrics

### Performance Monitoring

Built-in metrics available:
- **Core Web Vitals** - LCP, FID, CLS
- **Page Load Time**
- **Time to First Byte (TTFB)**

Access: Project → Analytics → Web Vitals

---

## Rollbacks & Previews

### Preview Deployments

Every PR and branch push gets a unique preview URL:
- Format: `https://life-aligner-git-{branch}-{user}.vercel.app`
- Perfect for testing before merging to main
- Automatically deleted when PR is closed

### Rolling Back

If production has issues:

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"
5. Confirm - takes effect immediately

### Deployment Protection

Optional: Enable production protection
1. Project Settings → Git
2. Enable "Deployment Protection"
3. Require approval before production deployments

---

## Continuous Deployment

### Automatic Deployments

By default, Vercel deploys automatically:

- **Push to `main` branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Open Pull Request** → Preview deployment with comment

### Manual Deployments

Disable auto-deploy if needed:
1. Project Settings → Git
2. Toggle "Production Branch" off
3. Manually trigger deploys from dashboard

### Deploy Hooks

Create deploy hooks for external triggers:
1. Project Settings → Git → Deploy Hooks
2. Create hook with name and branch
3. Use generated URL to trigger deploys:
   ```bash
   curl -X POST https://api.vercel.com/v1/integrations/deploy/...
   ```

---

## Build Configuration

### Build Command Customization

If needed, override in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Build Time Optimization

```json
{
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### Output Caching

Vercel automatically caches:
- Node modules
- Next.js build output
- Static assets

No configuration needed.

---

## Troubleshooting

### Build Failures

**Issue:** Build fails in Vercel but works locally

**Solutions:**
1. Check build logs for specific error
2. Ensure all dependencies in `package.json`
3. Verify environment variables are set
4. Test build locally: `npm run build`
5. Check Node version matches (18+)

### Environment Variable Issues

**Issue:** App can't connect to Supabase

**Solutions:**
1. Verify env vars are set in Vercel
2. Check variable names are EXACT match
3. Ensure `NEXT_PUBLIC_` prefix for client-side vars
4. Redeploy after changing env vars

### Domain Not Working

**Issue:** Custom domain shows error

**Solutions:**
1. Verify DNS records are correct
2. Wait 24-48hrs for DNS propagation
3. Check domain status in Vercel dashboard
4. Ensure domain isn't being used elsewhere

### Slow Build Times

**Issue:** Builds taking too long

**Solutions:**
1. Check for large dependencies
2. Review build logs for bottlenecks  
3. Consider build caching
4. Contact Vercel support for hobby plan limits

### 404 on Deployment

**Issue:** Pages show 404 after deployment

**Solutions:**
1. Verify file paths are correct (case-sensitive)
2. Check Next.js routing configuration
3. Ensure all pages are in `app/` directory
4. Review build output for missing files

---

## Performance Optimization

### Image Optimization

Vercel automatically optimizes images:
- Converts to WebP
- Resizes based on device
- Lazy loads images

Use Next.js `<Image>` component for best results.

### Caching Headers

Configure in `next.config.ts`:

```typescript
const nextConfig = {
  headers: async () => [
    {
      source: '/public/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### Bundle Size

Monitor bundle size in build logs:
```
Route (app)                      Size     
┌ ○ /                            50.2 kB
└ ○ /api/test-supabase           0 B
```

Target: Keep page bundles under 200KB

---

## Security

### Security Headers

Vercel applies security headers automatically:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`

### API Rate Limiting

Implement rate limiting for API routes:
```typescript
// app/api/route.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: ...,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### Environment Secrets

Never commit secrets:
- Keep `.env.local` in `.gitignore`
- Use Vercel env vars for sensitive data
- Rotate keys regularly

---

## Next Steps After Deployment

- [ ] Test all features on production URL
- [ ] Verify environment variables loaded
- [ ] Check analytics are tracking
- [ ] Test mobile responsiveness
- [ ] Share preview links with team
- [ ] Set up monitoring/alerts (optional)
- [ ] Configure custom domain (optional)

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)
- Project-specific help: Check logs and GitHub issues

Happy deploying! 🚀
