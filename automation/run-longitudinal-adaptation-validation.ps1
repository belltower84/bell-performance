$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
node "$PSScriptRoot\test-longitudinal-progression-13140.js"
python "$PSScriptRoot\run_longitudinal_adaptation_validation.py" --app-root "$Root"
$Report = Join-Path $PSScriptRoot "longitudinal_adaptation_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
