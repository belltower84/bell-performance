# Bell Performance 13.5.1 Validation

Automated checks:
- JavaScript syntax validation for the commercial Home module and service worker.
- HTML parsing and local asset-reference validation.
- Manifest JSON parsing.
- Service-worker resource existence validation: 62 references checked, no missing files.
- Python backend compilation.
- Backend test suite: 28 tests passed.
- ZIP integrity validation.

Manual checks recommended on bell-core-live:
- Dashboard card alignment at desktop widths with the fixed sidebar.
- Dashboard stacking at tablet and mobile widths.
- Start Training, View Session, and Modify button sizing in Guided and Advanced modes.
- Weekly day selection for training, two-session, completed, and recovery days.
- Weekly day keyboard navigation.
- Desktop sidebar order and support-section divider.
- Mobile bottom navigation order.
- PWA refresh after the new service worker activates.
