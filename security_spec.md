# Security Specification & Payload-First TDD

## 1. Core Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}` and its subcollections (`workouts`, `workoutPlans`, `mealLogs`, `recipes`, `measurements`, `hydrationLogs`, `habits`, `habitLogs`, `crawlerState`) belongs exclusively to `{userId}` (`request.auth.uid == userId && incoming().ownerId == request.auth.uid`). Unauthenticated or cross-user reads, lists, creates, updates, and deletes are forbidden.
2. **Email Verification Mandate**: Standard authenticated writes require `request.auth.token.email_verified == true`.
3. **Parent Gate Integrity**: Subcollection creates, updates, and deletes verify that the parent `/users/{userId}` profile exists via `exists()` (or are created atomically in a batch using `existsAfter()`).
4. **Immutable Ownership & Creation Time**: `ownerId` and `createdAt` can never change on update. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
5. **Strict Field Allowlisting & Boundary Guards**: Every entity uses `keys().hasAll(...) && keys().hasOnly(...)` in its validation helper, plus `affectedKeys().hasOnly(...)` in action-based update branches, strict string `.size()` limits, ID regex validation (`^[a-zA-Z0-9_\\-]+$`), numeric range guards (`weeklyGoal` 1..7, `level` 1..8, `xp` 0..1000000, `streakFreezes` 0..5), and bounded array size checks (`<= 20`, `<= 25`, `<= 30`, `<= 40`, `<= 60`, `<= 120`).
6. **PII Isolation & Guild Atomicity**: Private user settings, workouts, meals, and measurements remain strictly under `/users/{userId}` with owner-only access. Social profiles live in `/publicCrawlers/{crawlerId}` (non-PII RPG stats only, opt-in via `isPublic`), and `/guilds/{guildId}/members/{memberId}` enforces `role == 'member'` unless `getAfter(guild).ownerId == request.auth.uid`, plus atomic `memberCount` updates via `existsAfter()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Profile Read/Write**: `request.auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User Subcollection Access**: User B attempts `get` or `list` on `/users/userA/measurements` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Profile Create**: Adding `"isAdmin": true` to `/users/{uid}` -> `PERMISSION_DENIED` (`hasOnly` rejects).
4. **Owner Spoofing on Workout Create**: Setting `ownerId: "victimUid"` inside `/users/attackerUid/workouts/w1` -> `PERMISSION_DENIED`.
5. **Unverified Email Write**: Signed in user with `email_verified: false` creating a recipe -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Creating workout at `/users/{uid}/workouts/${"a".repeat(200)}` or with `$` characters -> `PERMISSION_DENIED` (`isValidId` rejects).
7. **Timestamp Forgery**: Providing a past `createdAt` or `updatedAt` instead of `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation**: Updating `createdAt` or `ownerId` on an existing `MealLog` -> `PERMISSION_DENIED`.
9. **Out-of-Bounds Week / Day**: Creating `WorkoutDay` with `weekNumber: 99` or `dayIndex: 10` -> `PERMISSION_DENIED`.
10. **Array Exhaustion Attack**: Creating a `Recipe` with 500 `ingredients` items -> `PERMISSION_DENIED` (`size() <= 40`).
11. **Value Poisoning on Allowed Update Key**: Updating `MealLog.consumed` to a 50KB string instead of `bool` -> `PERMISSION_DENIED` (`isValidMealLog` rejects).
12. **Guild Role Escalation / Member Count Tampering**: Joining a guild with `role: 'leader'` when not the guild owner, or incrementing `memberCount` by `+10` without atomically creating a `/members/{uid}` document -> `PERMISSION_DENIED`.
