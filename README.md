# Bell Performance 13.22.10 — GitHub Actions Deployment

Deployment-only release based on the clean 13.22.9 runtime baseline. No training logic or UI features were intentionally changed.

## Local

```powershell
cd "C:\path\to\bell132210_work"
py -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. In GitHub set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Pushes to `main` will then stage the static Bell site and deploy it with GitHub's Pages actions.
