PROTECTIVE = {"safety_hold", "protect", "hold", "regress", "deload", "rebuild"}
UPWARD = {"progress", "accelerate"}

def active_injury_passes(statuses):
    return bool(statuses) and all(s in PROTECTIVE for s in statuses) and not any(s in UPWARD for s in statuses)

def main():
    cases = [
        (['safety_hold'] * 7, True, 'safety_hold accepted'),
        (['protect'] * 6, True, 'protect accepted'),
        (['hold','regress','deload','rebuild'], True, 'mixed protective accepted'),
        (['safety_hold','progress'], False, 'progress rejected'),
        (['protect','accelerate'], False, 'accelerate rejected'),
        (['observe'], False, 'observe not sufficient during active injury'),
        ([], False, 'empty week rejected'),
    ]
    passed=0
    for statuses, expected, name in cases:
        actual=active_injury_passes(statuses)
        if actual != expected:
            raise AssertionError(f'{name}: expected {expected}, got {actual}')
        passed += 1
    print(f'PASS: {passed}/{len(cases)} protective status semantic checks.')

if __name__ == '__main__':
    main()
