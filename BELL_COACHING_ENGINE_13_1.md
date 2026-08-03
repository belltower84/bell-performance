# Bell Coaching Engine 13.1

## Canonical coaching state

Every Bell surface now consumes the same hierarchy:

```text
Athlete Identity
  → Current Objective
  → Journey
  → Phase
  → Journey Week + Phase Week
  → Weekly Plan
  → Today's Mission
```

The canonical Journey contract contains:

- planning mode;
- identity and objective;
- Journey name and dates;
- active planning horizon;
- ordered phases;
- current phase and phase week;
- coaching priorities;
- next phase and milestone;
- transition policy;
- source periodization metadata.

## Event Preparation

A competition date determines the active horizon. Bell generates backward-compatible Journey phases and preserves the event countdown. Active plans are limited to 52 weeks so very distant events can be recalculated as the athlete progresses instead of producing an unmanageably large immutable plan.

## Continuous Development

Without an event, Bell still creates a purposeful cycle. The athlete moves through development, assessment, and recovery phases. At the end of the cycle, later Bell releases will use performance and memory data to select the next emphasis.

## Frontend fallback

`js/bell-coaching-engine.js` mirrors the server Journey contract. It derives state from the athlete's existing local settings and training block, persists the result, and powers Mission Control and the Journey timeline while offline.

## Server authority

When Bell Core is connected, `/coaching-state` is authoritative. The cloud Journey is cached locally and rendered through the same Mission Control interface.

## Boundary of 13.1

13.1 establishes the planning contract and baseline phase sequences. It does not yet contain the full discipline-specific prescription, transition, testing, and adaptation rules planned for 13.2.
