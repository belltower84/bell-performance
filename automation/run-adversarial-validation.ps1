$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Python = Get-Command py -ErrorAction SilentlyContinue
if ($Python) { $Cmd = "py" } else { $Cmd = "python" }
& $Cmd -m pip install -r "$PSScriptRoot\requirements.txt"
& $Cmd "$PSScriptRoot\run_adversarial_validation.py" --app-root $Root --journeys "$PSScriptRoot\year_journeys.json"
$Code = $LASTEXITCODE
$Report = "$PSScriptRoot\adversarial_reports\latest\index.html"
if (Test-Path $Report) { Start-Process $Report }
exit $Code
