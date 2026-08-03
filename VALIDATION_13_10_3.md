# Validation 13.10.3

Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-adversarial-validation.ps1
```

Expected result: all clean controls pass with no warnings, and every deliberate mutation fails for only its intended detector. The report is written to `automation\adversarial_reports\latest\index.html` and includes exact diagnostic evidence for every warning.
