# Bell Performance 12.2.6 — Unique Session Generation & Validation

## Corrected weekly exposure generation
- Replaced modulo-based template cloning with unique strength and engine role generation.
- Four-strength hybrid weeks now use distinct upper/lower primary and secondary exposures.
- Three-engine hybrid weeks now use distinct easy, quality, and long-endurance roles.
- Added a hard limit of one long-endurance session per week.
- Existing duplicate sessions are removed before availability placement.

## Scheduling behavior
- Six-day hybrid availability now favors strength on Monday, Tuesday, Wednesday, and Friday.
- Easy engine work may share an upper-strength day.
- Quality engine work remains separated from lower-strength stress where possible.
- Saturday remains the preferred long-endurance day.
- Mobility remains a subordinate recovery component and does not consume a primary exposure.

## Validation
- Backend weekly validation now flags duplicate templates and multiple long-endurance sessions.
- Frontend local-mode generation checks requested versus generated strength and engine counts.
- JavaScript syntax and backend Python compilation were validated before packaging.
