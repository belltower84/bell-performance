$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".venv")) {
    py -m venv .venv
}

$python = Join-Path $root ".venv\Scripts\python.exe"
& $python -m pip install --disable-pip-version-check -q -r automation\requirements.txt
& $python automation\run_dynamic_52_week_athlete_journeys.py --config automation\full_stack_dynamic_52_week_journeys_13172.json

Write-Host ""
Write-Host "Report: automation\dynamic_52_week_reports\latest\index.html"
