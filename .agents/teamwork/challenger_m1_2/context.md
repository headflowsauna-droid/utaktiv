# Context for Challenger M1_2 (Economy, Idempotence & Family Pot Stress Testing)

## Role
Empirical Challenger 2 for Milestone 1.

## Scope
Write and execute an adversarial stress test harness verifying:
1. Strict trail coin limit (max 15 coins per day, excess discarded).
2. Strict adventure bonus limit (max 30 kr per day, duplicates blocked).
3. Max total hike payout (max 45 kr per day, combined cap enforced).
4. Idempotency key uniqueness across concurrent and rapid repeated calls.
