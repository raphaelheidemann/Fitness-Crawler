// Run: npx tsx scripts/check-xp-revoke.ts
import assert from 'node:assert/strict';
import { applyCrawlerProgressionUpdate, buildDefaultCrawlerState, revokeRewardedActions } from '../src/lib/crawlerEngine';

let state: any = buildDefaultCrawlerState('u1', 'Test');
// prime with another action so the one-off "first blood" bonus is out of the way
state = { ...state, ...applyCrawlerProgressionUpdate({ state, actionKey: 'prime', baseXp: 10, reason: 'x' }).nextState };

const key = 'hab_2026-11-19_h1';
const a = applyCrawlerProgressionUpdate({ state, actionKey: key, baseXp: 10, reason: 'x' });
const gained = a.nextState.xp - state.xp;
assert.ok(gained === 10 || gained === 20);
state = { ...state, ...a.nextState };

// same key again: no XP
assert.equal(applyCrawlerProgressionUpdate({ state, actionKey: key, baseXp: 10, reason: 'x' }).nextState.xp, state.xp);

// uncheck: exactly the same XP goes back, key forgotten
const before = state.xp;
const r = revokeRewardedActions(state, [{ key, baseXp: 10 }]);
assert.equal(r.xp, before - gained);
assert.ok(!r.rewardedActionKeys.includes(key));

// check/uncheck 5 times never inflates XP
let s2: any = { ...state, ...r };
const start = s2.xp;
for (let i = 0; i < 5; i++) {
  s2 = { ...s2, ...applyCrawlerProgressionUpdate({ state: s2, actionKey: key, baseXp: 10, reason: 'x' }).nextState };
  assert.equal(s2.xp, start + gained);
  s2 = { ...s2, ...revokeRewardedActions(s2, [{ key, baseXp: 10 }]) };
  assert.equal(s2.xp, start);
}
console.log('xp revoke OK');
