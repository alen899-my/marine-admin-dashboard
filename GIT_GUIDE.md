# ⚓ Parkora Maritime - Git Reference Guide

## 🚀 Fast Deployment (One-Liners)
Use these to sync everything in one go:
- **Live Server:** `git checkout production; git merge master; git push origin production`
- **Demo Server:** `git checkout demo; git merge master; git push origin demo`

---

## 1. Branch Navigation & Management
| Command | What it does |
| :--- | :--- |
| `git branch` | List all local branches |
| `git branch -a` | List ALL branches (Local + GitHub) |
| `git checkout <branch>` | Switch to a specific branch |
| `git checkout -b <name>` | Create a **new** branch and switch to it |

---

## 2. Status & Comparison (Is it up-to-date?)
Always run `git fetch origin` first to get the latest info from GitHub.

| Command | Purpose |
| :--- | :--- |
| `git status` | Check for unsaved changes or if you are behind GitHub |
| `git log production..master --oneline` | **Crucial:** Show commits in `master` not in `production` |
| `git log demo..master --oneline` | Show commits in `master` not in `demo` |
| `git diff --stat production master` | See exactly which files are different |

---

## 3. Manual Sync Steps (Branch by Branch)

### Update PRODUCTION (Live)
1. `git checkout production`
2. `git merge master`
3. `git push origin production`

### Update DEMO
1. `git checkout demo`
2. `git merge master`
3. `git push origin demo`

---

## 4. Saving Your Work (The Daily "3-Step")
Run these on the `master` branch while you are coding.
```powershell
git add .                        # Stage all changes
git commit -m "Describe change"  # Save locally
git push origin master           # Upload to GitHub
```

---

## 💡 Pro-Tips
- **The "Oops" Undo**: If a merge goes wrong: `git merge --abort`
- **Update Master**: Before merging into production, always refresh master: `git checkout master; git pull origin master`
