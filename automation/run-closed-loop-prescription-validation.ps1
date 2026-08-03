$ErrorActionPreference = "Stop"
$Report = Join-Path $PSScriptRoot "prescription_application_reports\latest"
New-Item -ItemType Directory -Force -Path $Report | Out-Null
node "$PSScriptRoot\test-prescription-application-13150.js"
python "$PSScriptRoot\run_closed_loop_prescription_validation.py"
Write-Host "Closed-loop prescription report: $Report\index.html"
