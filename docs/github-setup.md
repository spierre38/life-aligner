# Creating GitHub Repository: life-aligner

## Option 1: Create via GitHub Web Interface (Easiest)

1. **Go to GitHub:** [https://github.com/new](https://github.com/new)
2. **Fill in the form:**
   - Repository name: `life-aligner`
   - Description: "Career planning platform with interactive workshops and goal-setting tools"
   - Visibility: **Private** ✅
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. **Click "Create repository"**

After creating, GitHub will show you commands. **Don't run them yet**—I'll handle that below.

---

## Option 2: Create via GitHub CLI (Faster, requires gh CLI)

If you have GitHub CLI installed, I can create it automatically:

```bash
gh repo create life-aligner --private --source=. --remote=origin
```

---

## What to do after creating the repository

Once you've created the repository on GitHub.com, let me know and I'll:
1. Connect your local repo to the remote
2. Make your first commit
3. Push everything to GitHub

The URL will be: `https://github.com/spierre38/life-aligner`
