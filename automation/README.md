# Bell Performance Automated Testing

This package contains two separate test suites.

## 1. Functional simulated-athlete tests

Runs the original four-profile functional suite and checks onboarding, session controls, completion state, time budgets, recovery behavior, and core navigation.

```powershell
.\automation\run-simulated-tests.ps1
```

Report:

```text
automation\reports\latest\index.html
```

## 2. Twelve-month journey simulations

Advances four athletes through 52 weeks each, including powerlifting-meet preparation, physique-show preparation, running events, post-event recovery, missed days, reduced availability, readiness changes, and mission transitions.

```powershell
.\automation\run-year-simulations.ps1
```

Report:

```text
automation\journey_reports\latest\index.html
```

See `12_MONTH_SIMULATION_README.md` for the full scenario definitions and interpretation guidance.


## 4. Adversarial scientific validation

Generates clean discipline controls, injects deliberately flawed programs, and verifies that the evidence validator fails each bad program for the correct reason.

```powershell
.\automation\run-adversarial-validation.ps1
```

Report:

```text
automation\adversarial_reports\latest\index.html
```


## 5. Discipline-wide adversarial validation

Runs seven clean 52-week discipline controls and 21 deliberate corruptions. Powerlifting event rules use an explicit meet fixture, and mutations are compared against their clean baseline.

```powershell
.\automation\run-discipline-adversarial-validation.ps1
```

Report:

```text
automation\discipline_adversarial_reports\latest\index.html
```

Acceptance: **28/28 cases passed**.

## Event Routing & Clean-Control Calibration (13.12.1)

Run the browser-driven clean-control suite:

```powershell
.\automation\run-event-validation.ps1
```

This executes 16 clean 52-week event controls at the 90% target-compliance condition and writes the summary to `automation/event_validation_reports/latest/index.html`. The suite verifies canonical event routing, preservation of event-critical sessions, context-aware rehearsal evidence, running-event identity and dose differentiation, taper, recovery, time feasibility, and scope-aware custom events.

Configuration-only smoke test:

```powershell
python .\automation\run_event_validation.py --app-root . --config-only
```

Targeted calibration tests:

```powershell
node .\automation\test-event-routing-13121.js
node .\automation\test-running-specificity-13121.js
python .\automation\test_event_validator_13121.py
```

Acceptance: **16/16 clean event journeys pass**, with undefined custom events explicitly reported as `SCOPE_LIMITED`.


## Event-Type Adversarial Validation (13.12.3)

Run the browser-driven negative-control suite:

```powershell
.\automation\run-event-adversarial-validation.ps1
```

The runner builds the 16 clean 52-week event controls once, applies 80 in-memory corruptions, and writes the differential report to `automation/event_adversarial_reports/latest/index.html`. Each mutation must introduce only its expected warning, preserve every non-target invariant, and pass mutation verification. Invalid compound corruptions are reported as `CONTROL_MUTATION_INVALID`.

Configuration-only smoke test:

```powershell
python .\automation\run_event_adversarial_validation.py --app-root . --config-only
```

Local synthetic calibration:

```powershell
python .\automation\test_event_adversarial_validator_13123.py
```

Acceptance: **96/96 cases passed**.


## Athlete Response & Adaptive Progression (13.13.0)

Run the structured-response suite:

```powershell
.\automation\run-athlete-response-validation.ps1
```

The runner evaluates 30 deterministic session- and exercise-level scenarios, checks progression caps and guardrails, runs the JavaScript parity suite, and executes the Bell Core athlete-response tests.

Report:

```text
automation\athlete_response_reports\latest\index.html
```

Acceptance: **30/30 response cases passed**.

## Longitudinal Adaptive Coaching (13.14.0)

Run the multi-week stability suite:

```powershell
.\automation\run-longitudinal-adaptation-validation.ps1
```

The runner evaluates 18 deterministic athlete trajectories across 192 completed exposures. It validates progression cooldowns, protective re-entry, regression consolidation, deload spacing, phase protection, strength/engine independence, event-specificity preservation, and cumulative dose ceilings. The Node test must match the locked Python trajectory fixture on every exposure.

Report:

```text
automation\longitudinal_adaptation_reports\latest\index.html
```

Acceptance: **18/18 trajectories and 192/192 exposure decisions passed**.
## Closed-Loop Prescription Application (13.15.0)

Run the browser/Bell Core parity suite:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-closed-loop-prescription-validation.ps1
```

The runner evaluates 20 deterministic application contracts. It verifies next-comparable-session routing, strength/engine isolation, load and duration rewriting, exercise-level hold/regress/protect behavior, safety replacement, completed-target skipping, role preservation, and exact idempotency in JavaScript and Python.

Report:

```text
automation\prescription_application_reports\latest\index.html
```

Acceptance: **20/20 closed-loop prescription cases passed with JavaScript/Python parity**.


## Real-World Athlete Simulation & Chaos Testing (13.16.0)

Run `run-real-world-chaos-validation.ps1`. The suite executes 120 deterministic multi-week journeys across 12 athlete archetypes and verifies malformed-input normalization, duplicate rejection, evidence gating, phase protection, cumulative dose ceilings, channel isolation, event-role preservation, and prescription idempotency.

## 13.16.1 full-stack athlete journey replay

Run:

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
```

This is the deep browser-driven counterpart to the fast 13.16.0 chaos suite. It generates real plans, completes real plan sessions, invokes the actual response/longitudinal/prescription pipeline, reloads localStorage mid-journey, and continues the same athlete block.


## 13.16.2 full-stack journey session discovery repair

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
```

The runner classifies real sessions with Bell's production `scheduleTypeForMission()` logic and fails preflight when a generated week contains no executable strength or engine sessions.

## 13.16.3 journey channel fidelity and application persistence repair

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
```

The suite requires discipline-correct session channels and verifies application IDs and target metadata survive browser reload.


## 13.16.4 positive response calibration and strength evidence repair

Runs every executable session in each generated multi-week plan, captures prescribed-versus-completed strength evidence, verifies positive responders can earn progression, and preserves all protective and persistence checks.

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
```


## 13.16.5 completion identity and evidence precedence repair

Separates session completion from broader adherence and keys duplicate detection to the scheduled plan occurrence. The same session resubmitted is rejected, while the same workout template in a later week remains valid new evidence.

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
```


## 13.16.6 positive decision promotion and comparable exposure repair

Structured completion evidence now satisfies the confidence gate when the workout contains real set-level or engine-duration evidence. The suite verifies recognized repeated success promotes to `progress`, rapid repeated success promotes to `accelerate`, scheduled completion identity remains distinct from recurring progression identity, and protective guards remain unchanged.

```powershell
node .\automation\test-positive-decision-promotion-13166.js
.\automation\run-full-stack-athlete-journeys.ps1
```

## Dynamic 52-week athlete journeys — 13.17.1

```powershell
.\automation\run-dynamic-52-week-athlete-journeys.ps1
```

This executes six Chromium journeys for 52 weeks each. Profiles change goals or conditioning tracks, sustain and clear injuries, reload at quarterly checkpoints, and continue using the real plan, response, longitudinal, and closed-loop prescription engines.


## Dynamic 52-week athlete journeys — 13.17.2

Run `run-dynamic-52-week-athlete-journeys.ps1`. Active-injury checks now use protective status semantics: `safety_hold`, `protect`, `hold`, `regress`, `deload`, and `rebuild` are protective; `progress` and `accelerate` are forbidden while the simulated injury is active.
