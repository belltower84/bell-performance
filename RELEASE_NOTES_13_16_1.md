# Bell Performance 13.16.1

## Full-Stack Athlete Journey Replay

This release adds a browser-driven validation harness that exercises the actual Bell application rather than assigning synthetic coaching decisions directly.

Each journey:

1. opens the real app in Chromium;
2. creates an athlete profile through Bell's runtime data model;
3. generates an actual eight-week training block;
4. reads actual strength and engine sessions from the generated plan;
5. creates completion data from the real prescribed template;
6. sends that completion through the actual athlete-response engine;
7. stabilizes the decision through the longitudinal engine;
8. applies the resulting prescription application to the next comparable real plan session;
9. saves the athlete and plan to localStorage;
10. reloads the application halfway through the journey;
11. verifies that history and pending applications survive reload; and
12. continues through the end of the block.

The suite includes eight athlete journeys: steady strength, rapid hybrid, struggling 10K, inconsistent body recomposition, pain interruption, travel interruption, event taper protection, and messy/duplicate input.

This is intentionally separate from the fast 13.16.0 chaos-guard suite. The 13.16.0 suite remains useful for high-volume component testing; 13.16.1 tests fewer journeys more deeply through the actual application runtime.
