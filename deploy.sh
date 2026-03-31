#!/bin/bash
# Deployment script for Calculus Concept Map

echo "=== Calculus Concept Map Deployment Script ==="
echo ""

# Check if remote is already configured
if git remote get-url origin &>/dev/null; then
    echo "Remote repository already configured:"
    git remote -v
    echo ""
    read -p "Do you want to push to existing remote? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing to remote..."
        git push -u origin main
        echo "Done! Check GitHub Pages settings in your repository."
    fi
else
    echo "No remote repository configured."
    echo ""
    echo "To deploy to GitHub:"
    echo "1. Create a new repository on GitHub: https://github.com/new"
    echo "2. Make it PUBLIC (required for free GitHub Pages)"
    echo "3. Do NOT initialize with README"
    echo "4. Copy the repository URL"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " repo_url
    
    if [ -n "$repo_url" ]; then
        echo "Adding remote repository..."
        git remote add origin "$repo_url"
        echo "Pushing to GitHub..."
        git push -u origin main
        echo ""
        echo "=== Next Steps ==="
        echo "1. Go to your repository on GitHub"
        echo "2. Settings → Pages"
        echo "3. Source: Branch 'main', Folder '/ (root)'"
        echo "4. Save"
        echo "5. Your site will be available at: https://YOUR_USERNAME.github.io/REPO_NAME/"
    else
        echo "No URL provided. Exiting."
    fi
fi
