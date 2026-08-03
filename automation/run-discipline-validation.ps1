$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
python "$PSScriptRoot\run_year_simulations.py" --app-root "$Root" --journeys "$PSScriptRoot\discipline_validation_journeys.json"
