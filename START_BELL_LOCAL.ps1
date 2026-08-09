Set-Location $PSScriptRoot
Write-Host "Bell Performance 13.22.10 GitHub Actions Deployment"
Write-Host "Serving this exact folder at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop the server."
py -m http.server 8000
