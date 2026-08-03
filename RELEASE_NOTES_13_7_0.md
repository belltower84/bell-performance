# Bell Performance 13.7.0 — Exercise Guide Design System

## Summary
Rebuilds the Training Library around a reusable, professional exercise-guide system designed to scale across the full Bell Performance exercise catalog.

## Major changes
- Replaced individual muscle tiles with a unified front-and-back anatomy map.
- Added distinct primary and secondary muscle highlighting with a consistent Bell muscle taxonomy.
- Added a normalized exercise-guide data model for every catalog movement.
- Added guide maturity levels:
  - Complete Guide
  - Written Guide
  - Basic Reference
- The ten pilot exercises remain Complete Guides.
- Searching the library now searches the full Bell exercise catalog, not only the pilot ten.
- Rebuilt guide cards with stronger hierarchy, consistent spacing, restrained gold accents, and professional responsive behavior.
- Added Common Mistakes & Corrections instead of mistakes alone.
- Added What You Should Feel and Stop or Modify guidance.
- Improved substitutions with a purpose-preservation explanation.
- Preserved workout-player, favorites, similar-lift, and exercise-replacement connections.
- Reserved the media architecture for future front view, side view, and coaching videos.

## Architecture
Every exercise is normalized into the shared guide schema covering classification, purpose, muscles, equipment, instruction, media, substitutions, and guide maturity.
