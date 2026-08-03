$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
python "$PSScriptRoot\run_athlete_response_validation.py" --app-root "$Root" --scenarios "$PSScriptRoot\athlete_response_scenarios.json"
node "$PSScriptRoot\test-athlete-response-13130.js"
Push-Location "$Root\backend"
try { python -m pytest -q tests/test_athlete_response.py } finally { Pop-Location }
$Report = "$PSScriptRoot\athlete_response_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
