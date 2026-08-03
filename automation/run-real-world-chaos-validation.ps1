$ErrorActionPreference = "Stop"
python "$PSScriptRoot\run_real_world_chaos_validation.py"
Write-Host "Report: $PSScriptRoot\real_world_chaos_reports\latest\index.html"
