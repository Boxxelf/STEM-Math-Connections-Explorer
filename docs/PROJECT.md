# Calculus Connections Explorer

An interactive web application that visualizes how **Calculus** topics connect to domain-specific courses in **Computer Science** and **Mechanical Engineering**. Users can explore prerequisite relationships, filter by course or topic, and read rationales explaining why each calculus concept matters for their chosen field.

Updated March 20, 2026

---

## Repository

- **GitHub (public):** [https://github.com/Boxxelf/Calculus-Connections-Explorer-Update-0320](https://github.com/Boxxelf/Calculus-Connections-Explorer-Update-0320)

---

## Public View Links

- **Home (pick CS or ME — default):** [https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/](https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/)
- **CS:** [https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/cs.html](https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/cs.html)
- **ME:** [https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/meche/](https://boxxelf.github.io/Calculus-Connections-Explorer-Update-0320/meche/)
- **Legacy `home.html`:** redirects to the site root.

---

## Features

- **Interactive concept map** — Zoom, pan, and explore the calculus topic graph
- **Topic filtering** — Select CS or MechE courses and topics to see connected calculus ideas
- **Ranked calculus list** — View connected calculus topics with connection strength
- **Rationales** — Read explanations of how each calculus concept supports the selected domain topics
- **Full concept map view** — Optional graph-based visualization with zoom and pan

---

## Local Development

### Option 1: Python HTTP Server

```bash
# From the project root
python -m http.server 8000
# Or: python3 -m http.server 8000
```

Then open:
- **Home:** http://localhost:8000/
- **CS:** http://localhost:8000/cs.html
- **ME:** http://localhost:8000/meche/

### Option 2: PowerShell (Windows)

```powershell
.\serve.ps1
# Or with custom port: .\serve.ps1 8888
```

Then open:
- **Home:** http://localhost:8000/
- **CS:** http://localhost:8000/cs.html
- **ME:** http://localhost:8000/meche/

---

## Deploy to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Set the repository name (e.g., `Calculus-Connections-Explorer-Update-0320`)
3. Make it **Public**
4. Do **not** initialize with README, .gitignore, or license

### Step 2: Push the Code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

**Option A — Deploy from branch (simplest):**

1. In your GitHub repository, go to **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. **Branch:** `main`
4. **Folder:** `/ (root)`
5. Click **Save**

**Option B — GitHub Actions:**

1. In **Settings** → **Pages**, select **GitHub Actions** as the source
2. The `.github/workflows/deploy.yml` workflow will run on each push to `main`

After a few minutes, your site will be live at:
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## Project Structure

```
├── docs/                   # Project, deployment, and update notes
│   └── PROJECT.md          # This file
├── resources/              # Reference CSV exports & Mermaid sources (not loaded by the web app)
│   ├── MechE-Calc connections_030626/
│   └── All_Computer_Science_Topics*.mmd
├── index.html              # Home: pick CS or ME
├── cs.html                 # CS–Calculus explorer
├── home.html               # Redirects to ./
├── app.js                  # CS application logic
├── style.css               # Shared styles
├── graph_data.json         # CS graph data
├── meche/
│   ├── index.html          # ME version
│   ├── app-meche.js        # ME application logic
│   └── graph_data_meche.json
├── Calculus topic list-Table 1.csv
├── CS topic lists-Table 1.csv   # CS topics
├── ME topic lists.csv           # ME topics
└── … (utility scripts and additional source CSVs at repo root)
```

---

## Related Documentation

- [UPDATE_NOTES_2026-03-20.md](./UPDATE_NOTES_2026-03-20.md) — March 20, 2026 Mechanical Engineering track (MechE tables & rationales)
- [UPDATE_NOTES0125.md](./UPDATE_NOTES0125.md) — January 2026 update notes
- [UPDATE_NOTES1201.md](./UPDATE_NOTES1201.md) — December 2024 update notes
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Detailed deployment guide
- [GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md) — GitHub Pages configuration options

---

## License

See repository for license information.
