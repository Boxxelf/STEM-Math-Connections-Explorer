# Deployment Guide

## Git Repository Setup

The repository has been initialized and the initial commit has been created.

### To push to GitHub:

1. **Create a new repository on GitHub** (if you don't have one):
   - Go to https://github.com/new
   - Repository name: `Calculus-Concept-Map` (or your preferred name)
   - Make it **Public** (required for GitHub Pages free tier)
   - Do NOT initialize with README, .gitignore, or license if you will replace them with this project’s files (full notes live in `docs/PROJECT.md`; a root `README.md` is optional for GitHub’s landing page)

2. **Add the remote and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Calculus-Concept-Map.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username.

## GitHub Pages Setup

### Option 1: Automatic GitHub Pages (Recommended)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Your site will be available at: `https://YOUR_USERNAME.github.io/Calculus-Concept-Map/`

### Option 2: Using GitHub Actions (Alternative)

If you prefer using GitHub Actions for deployment, you can create a workflow file.

## Current Status

- Git repository: Initialized
- Initial commit: Created with all files
- Remote repository: Not configured yet
- GitHub Pages: Not enabled yet

## Next Steps

1. Create GitHub repository (if needed)
2. Add remote and push code
3. Enable GitHub Pages in repository settings
4. Share the public URL with others

