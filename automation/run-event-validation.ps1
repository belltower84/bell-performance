$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
python -m pip install -r "$PSScriptRoot\requirements.txt"
python "$PSScriptRoot\run_event_validation.py" --app-root "$Root" --journeys "$PSScriptRoot\event_validation_journeys.json" --matrix "$PSScriptRoot\event_validation_matrix.json"
$Report = "$PSScriptRoot\event_validation_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
