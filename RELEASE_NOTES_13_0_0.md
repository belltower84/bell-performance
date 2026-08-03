# Bell Performance 13.0.0 — Mission Control

Bell 13 begins the transition from a fixed-program workout app into a journey-based coaching system.

## Included in 13.0.0

- New shared Bell 13 design tokens for surfaces, typography, spacing, cards, actions, and navigation.
- New Mission Control identity card at the top of the dashboard.
- Dashboard now clearly displays:
  - Current Journey
  - Event Preparation or Continuous Development mode
  - Current Phase
  - Week of the current phase
  - Journey progress
  - Journey status
  - Next milestone
- New universal terminology:
  - Journey = long-term objective
  - Phase = current training emphasis
  - Mission = today's prescribed work
- Primary navigation changed to:
  - Mission
  - Training
  - Plan
  - Progress
  - More
- Plan, Training, Progress, and Settings now receive consistent Bell 13 page identity headers.
- Legacy duplicate dashboard content is hidden while preserving its existing data bindings and functions.
- Existing Bell Core, readiness, training, nutrition, workout, history, and meet-prep behavior remains in place.

## Architecture note

13.0.0 displays the current block as the current phase. Bell 13.1 will introduce the Adaptive Journey Planning Engine and true macrocycle/block state, allowing the displayed phase week to represent the active generated block rather than the total legacy plan.
