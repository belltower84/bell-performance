$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
python -m pip install -r "$PSScriptRoot\requirements.txt"
python "$PSScriptRoot\run_discipline_adversarial_validation.py" --app-root "$Root" --journeys "$PSScriptRoot\discipline_validation_journeys.json"
$Report = "$PSScriptRoot\discipline_adversarial_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
