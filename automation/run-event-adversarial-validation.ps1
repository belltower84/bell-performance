$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
python -m pip install -r "$PSScriptRoot\requirements.txt"
python "$PSScriptRoot\run_event_adversarial_validation.py" --app-root "$Root" --journeys "$PSScriptRoot\event_validation_journeys.json" --matrix "$PSScriptRoot\event_validation_matrix.json" --adversarial-matrix "$PSScriptRoot\event_adversarial_matrix.json"
$Report = "$PSScriptRoot\event_adversarial_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
