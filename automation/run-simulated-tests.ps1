$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $PSScriptRoot "run_tests.py"
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

Write-Host "Bell Performance automated athlete testing" -ForegroundColor Yellow
Write-Host "App root: $Root"

Invoke-Python -m pip install -r $Requirements

# The runner uses an installed Chrome or Edge browser when available. If neither is
# found, install Playwright Chromium automatically.
try {
    Invoke-Python $Runner --app-root $Root --profiles (Join-Path $PSScriptRoot "profiles.json")
} catch {
    Write-Host "The first run could not find a compatible browser. Installing Playwright Chromium..." -ForegroundColor Yellow
    Invoke-Python -m playwright install chromium
    Invoke-Python $Runner --app-root $Root --profiles (Join-Path $PSScriptRoot "profiles.json")
}

$Latest = Join-Path $PSScriptRoot "reports\latest\index.html"
if (Test-Path $Latest) {
    Start-Process $Latest
    Write-Host "Report opened: $Latest" -ForegroundColor Green
}
