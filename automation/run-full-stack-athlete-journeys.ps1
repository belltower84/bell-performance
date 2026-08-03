$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $PSScriptRoot "run_full_stack_athlete_journeys.py"
$Config = Join-Path $PSScriptRoot "full_stack_journeys_13167.json"

function Invoke-Python {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    if (Get-Command py -ErrorAction SilentlyContinue) { & py @Arguments }
    elseif (Get-Command python -ErrorAction SilentlyContinue) { & python @Arguments }
    else { throw "Python 3.10 or newer was not found." }
}

Write-Host "Bell 13.16.7 taper window fidelity and pending application revalidation" -ForegroundColor Yellow
Invoke-Python -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
try {
    Invoke-Python $Runner --app-root $Root --config $Config
} catch {
    Write-Host "Installing Playwright Chromium and retrying..." -ForegroundColor Yellow
    Invoke-Python -m playwright install chromium
    Invoke-Python $Runner --app-root $Root --config $Config
}
$Report = Join-Path $PSScriptRoot "full_stack_journey_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report; Write-Host "Report: $Report" -ForegroundColor Green }
