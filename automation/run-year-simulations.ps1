$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $PSScriptRoot "run_year_simulations.py"
$Journeys = Join-Path $PSScriptRoot "year_journeys.json"
$Requirements = Join-Path $PSScriptRoot "requirements.txt"

function Invoke-Python {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py @Arguments
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python @Arguments
    } else {
        throw "Python was not found. Install Python 3.10 or newer, then run this script again."
    }
}

Write-Host "Bell Performance 12-month athlete journey simulations" -ForegroundColor Yellow
Write-Host "App root: $Root"
Write-Host "This run advances four athletes through 52 weeks each and may take several minutes."

Invoke-Python -m pip install -r $Requirements
Invoke-Python $Runner --app-root $Root --journeys $Journeys

$Latest = Join-Path $PSScriptRoot "journey_reports\latest\index.html"
if (Test-Path $Latest) {
    Start-Process $Latest
    Write-Host "Journey report opened: $Latest" -ForegroundColor Green
} else {
    Write-Host "The report was not created. Review the error shown above." -ForegroundColor Red
}
