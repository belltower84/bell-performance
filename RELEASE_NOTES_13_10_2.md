# Bell Performance 13.10.2 — Adversarial Scientific Validation

Adds a negative-control validation suite for Bell's evidence benchmark.

The suite first generates clean 90%-compliance controls for powerlifting, physique, endurance, and beginner programming. It then injects known programming faults and verifies that the validator identifies the correct problem without flagging clean controls.

Adversarial cases include:

- Missing competition-lift specificity
- Missing taper
- Corrupted post-event recovery
- Extreme weekly muscle volume
- Push/pull imbalance
- Three demanding running sessions in one week
- An oversized long run
- A major endurance-load spike
- Repeated maximal work for beginners
- Missing beginner movement foundation

Run:

```powershell
.\automation\run-adversarial-validation.ps1
```

Report:

```text
automation\adversarial_reports\latest\index.html
```
