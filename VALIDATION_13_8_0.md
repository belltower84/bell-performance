# Validation — Bell Performance 13.8.0

- JavaScript syntax checked with Node.
- All HTML script and stylesheet references checked against packaged files.
- Service-worker cache updated to 13.8.0 and includes the session-ledger module.
- ZIP integrity tested after packaging.
- Session-ledger design uses exact durable IDs rather than workout-title matching.

Manual acceptance test still required with the persisted athlete profile that exposed the Engine completion bug:
1. Select and complete Strength.
2. Confirm Strength is complete and Engine remains planned.
3. Select and complete Engine.
4. Confirm both tiles are complete immediately and after refresh.
5. Confirm total required minutes remain equal to the readiness availability.
