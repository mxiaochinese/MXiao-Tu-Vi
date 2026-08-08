const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calendar = require('../src/calendar.js');
const engine = require('../src/engine/engine.js');
const core = require('../src/engine/core.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/public-tuvi-deep-cases.json'), 'utf8'));

function build(testCase) {
  const { lunar, hourBranch } = testCase.input;
  const solar = calendar.lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.leap, 7);
  const day = core.getDayStemBranch(solar.day, solar.month, solar.year);
  const normalized = {
    solar, originalSolar: solar, lunar,
    originalTime: '09:00', adjustedTime: '09:00', timeDisplay: '09:00',
    timeCorrectionMode: 'civil', timeCorrectionMinutes: 0, timezoneOffsetMinutes: 420,
    hour: 9, minute: 0, hourBranch,
    yearStem: core.getYearStem(lunar.year), yearBranch: core.getYearBranch(lunar.year),
    dayStem: day.stem, dayBranch: day.branch, yearCanChi: core.getYearCanChi(lunar.year), dayCanChi: day.label
  };
  return engine.buildTuviChart({
    fullName: 'Public deep reference', gender: testCase.input.gender, calendarType: 'lunar', lunarLeap: lunar.leap,
    timezone: testCase.input.timezone, viewYear: 2026, viewMonth: 4, viewLeap: false, leapFortuneMode: 'split-half-next',
    viewDay: 15, viewHourBranch: 7, timePrecision: 'branch', calculationProfileId: 'VN_TAN_BIEN_1956',
    viewDayStem: 1, viewDayBranch: 1, viewDayCanChi: 'Giáp Tý', viewSolarDate: { year: 2026, month: 5, day: 31 }
  }, normalized);
}

function names(palace, group = null) {
  return palace.stars.filter((star) => !group || star.group === group).map((star) => star.name);
}

let palaceChecks = 0;
let selectedStarChecks = 0;
let blockerChecks = 0;
let variantChecks = 0;
for (const testCase of cases) {
  const chart = build(testCase);
  for (const expected of testCase.palaces) {
    const palace = chart.palaces.find((item) => item.id === expected.branch);
    assert.equal(palace.name, expected.name, `${testCase.id} branch ${expected.branch} palace`);
    assert.deepEqual(names(palace, 'major').sort((a,b)=>a.localeCompare(b,'vi')), [...expected.majorStars].sort((a,b)=>a.localeCompare(b,'vi')), `${testCase.id} branch ${expected.branch} major stars`);
    palaceChecks += 2;
  }
  for (const expected of testCase.selectedStars) {
    const palace = chart.palaces.find((item) => item.id === expected.branch);
    const actual = new Set(names(palace));
    for (const star of expected.names) {
      assert.ok(actual.has(star), `${testCase.id} branch ${expected.branch} missing ${star}`);
      selectedStarChecks += 1;
    }
  }
  if (Array.isArray(testCase.tuan)) {
    assert.deepEqual(chart.palaces.filter((item) => item.hasTuan).map((item) => item.id), testCase.tuan, `${testCase.id} Tuần`);
    blockerChecks += 1;
  }
  if (Array.isArray(testCase.triet)) {
    assert.deepEqual(chart.palaces.filter((item) => item.hasTriet).map((item) => item.id), testCase.triet, `${testCase.id} Triệt`);
    blockerChecks += 1;
  }
  for (const difference of testCase.variantDifferences || []) {
    const placements = chart.palaces.filter((item) => names(item).includes(difference.star)).map((item) => item.id);
    assert.deepEqual(placements, [difference.profileBranch], `${testCase.id} ${difference.star} profile variant`);
    assert.notEqual(difference.sourceBranch, difference.profileBranch, `${testCase.id} variant must record a real difference`);
    variantChecks += 1;
  }
}
console.log(`Deep public reference tests passed: ${cases.length} charts, ${palaceChecks / 2} complete palaces, ${selectedStarChecks} selected minor and transformation stars, ${blockerChecks} Tuần/Triệt checks, ${variantChecks} documented profile variants`);
