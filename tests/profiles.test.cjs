const assert = require('node:assert/strict');
const profiles = require('../src/engine/profiles.js');
const core = require('../src/engine/core.js');
const stars = require('../src/engine/stars.js');

assert.equal(profiles.CALCULATION_PROFILE_LIST.length, 2);
const tanBien = profiles.getCalculationProfile('VN_TAN_BIEN_1956');
const aoBi = profiles.getCalculationProfile('VN_AO_BI_1972');
assert.equal(tanBien.ziHourMode, 'zi23');
assert.equal(aoBi.ziHourMode, 'zi00');
assert.equal(core.getHourBranch(23, 30, tanBien.ziHourMode), 1);
assert.equal(core.getHourBranch(23, 30, aoBi.ziHourMode), 12);
assert.equal(core.getHourBranch(0, 30, tanBien.ziHourMode), 1);
assert.equal(core.getHourBranch(0, 30, aoBi.ziHourMode), 1);

function lifeCycleMap(mode) {
  return Object.fromEntries(stars.placeSupportingStars({ yearStem: 2, yearBranch: 2, lunarMonth: 1, lunarDay: 1, hourBranch: 1, gender: 'male', bureauNumber: 2, lifeCycleMode: mode, lifePalace: 1, bodyPalace: 1 }).filter((star) => star.id.startsWith('trang-sinh-')).map((star) => [star.id, star.palace]));
}
const tanCycle = lifeCycleMap(tanBien.lifeCycleMode);
const aoCycle = lifeCycleMap(aoBi.lifeCycleMode);
assert.notDeepEqual(tanCycle, aoCycle);
assert.equal(tanCycle['trang-sinh-0'], 9);
assert.equal(aoCycle['trang-sinh-0'], 1);
console.log('Calculation profile tests passed: 2 independent profiles, hour boundary and Tràng Sinh variants');
