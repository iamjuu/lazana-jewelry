#!/bin/bash
# Clean Git History - Remove all commits and start fresh

echo "🧹 Cleaning Git history..."

# 1. Backup current branch
git branch backup-branch

# 2. Create orphan branch (no history)
git checkout --orphan clean-main

# 3. Add all current files
git add .

# 4. Make first clean commit
git commit -m "Initial commit - Clean codebase without secrets"

# 5. Delete old main branch
git branch -D main

# 6. Rename clean branch to main
git branch -m main

# 7. Force push to GitHub
git push -f origin main

echo "✅ Done! Clean history pushed to GitHub"

