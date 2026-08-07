BELL PERFORMANCE 13.22.10 — GITHUB ACTIONS DEPLOYMENT

LOCAL TEST
1. Extract the full project ZIP.
2. Run START_BELL_LOCAL.bat or: py -m http.server 8000
3. Open http://localhost:8000/

GITHUB PAGES
1. Copy the project contents into the repository root and push to main.
2. In GitHub: Settings > Pages > Build and deployment.
3. Set Source to GitHub Actions.
4. The workflow .github/workflows/deploy-pages.yml will run automatically.
5. You can also run it manually from Actions > Deploy Bell Performance > Run workflow.
6. Verify /version.json?build=132210 reports 13.22.10.

This release intentionally makes no training logic or UI feature changes.
