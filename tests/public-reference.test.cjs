const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calendar = require('../src/calendar.js');
const engine = require('../src/engine/engine.js');
const core = require('../src/engine/core.js');
const profiles = require('../src/engine/profiles.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/public-tuvi-cases.json'), 'utf8'));

function normalizedFromCase(testCase) {
  const { lunar, hourBranch } = testCase.input;
  const solar = calendar.lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.leap, 7);
  const day = core.getDayStemBranch(solar.day, solar.month, solar.year);
  return {
    solar,
    originalSolar: solar,
    lunar,
    originalTime: `${String((hourBranch * 2 + 21) % 24).padStart(2, '0')}:00`,
    adjustedTime: `${String((hourBranch * 2 + 21) % 24).padStart(2, '0')}:00`,
    timeCorrectionMode: 'civil',
    timeCorrectionMinutes: 0,
    timezoneOffsetMinutes: 420,
    hour: (hourBranch * 2 + 21) % 24,
    minute: 0,
    hourBranch,
    yearStem: core.getYearStem(lunar.year),
    yearBranch: core.getYearBranch(lunar.year),
    dayStem: day.stem,
    dayBranch: day.branch,
    yearCanChi: core.getYearCanChi(lunar.year),
    dayCanChi: day.label
  };
}

function build(testCase) {
  const normalized = normalizedFromCase(testCase);
  return engine.buildTuviChart({
    fullName: 'Public reference',
    gender: testCase.input.gender,
    calendarType: 'lunar',
    lunarLeap: testCase.input.lunar.leap,
    timezone: testCase.input.timezone,
    viewYear: 2026,
    viewMonth: 4,
    viewDay: 15,
    viewHourBranch: 7,
    timePrecision: 'branch',
    calculationProfileId: profiles.DEFAULT_PROFILE_ID,
    viewDayStem: 1,
    viewDayBranch: 1,
    viewDayCanChi: 'Giáp Tý',
    viewSolarDate: { year: 2026, month: 5, day: 31 }
  }, normalized);
}

function sortedNames(stars) {
  return stars.map((star) => star.name).sort((a, b) => a.localeCompare(b, 'vi'));
}

assert.equal(new Set(cases.map((item) => item.id)).size, cases.length, 'Duplicate public chart id');
assert.equal(new Set(cases.map((item) => item.url)).size, cases.length, 'Duplicate public chart URL');
const coveredBureaus = new Set(cases.map((item) => `${item.expected.bureau.element}-${item.expected.bureau.number}`));
assert.deepEqual([...coveredBureaus].sort(), ['Hỏa-6', 'Kim-4', 'Mộc-3', 'Thổ-5', 'Thủy-2']);
assert.deepEqual([...new Set(cases.map((item) => item.input.gender))].sort(), ['female', 'male']);
assert.deepEqual([...new Set(cases.map((item) => item.input.hourBranch))].sort((a, b) => a - b), Array.from({ length: 12 }, (_, index) => index + 1));
const coveredMajorStars = new Set(cases.flatMap((item) => item.expected.palaces.flatMap((palace) => palace.majorStars)));
assert.equal(coveredMajorStars.size, 14);

const failures = [];
let metadataAssertions = 0;
let palaceAssertions = 0;
for (const testCase of cases) {
  const chart = build(testCase);
  try {
    assert.deepEqual(chart.normalized.solar, testCase.expected.solar);
    metadataAssertions += 1;
    assert.equal(chart.bureau.element, testCase.expected.bureau.element);
    assert.equal(chart.bureau.number, testCase.expected.bureau.number);
    metadataAssertions += 2;
    for (const expectedPalace of testCase.expected.palaces) {
      const palace = chart.palaces.find((item) => item.id === expectedPalace.branch);
      assert.ok(palace, `Missing branch ${expectedPalace.branch}`);
      assert.equal(palace.name, expectedPalace.name);
      const actual = sortedNames(palace.stars.filter((star) => star.group === 'major'));
      const expected = [...expectedPalace.majorStars].sort((a, b) => a.localeCompare(b, 'vi'));
      assert.deepEqual(actual, expected);
      palaceAssertions += 2;
    }
  } catch (error) {
    failures.push({ id: testCase.id, url: testCase.url, message: error.message, chart: { solar: chart.normalized.solar, bureau: chart.bureau, lifePalace: chart.lifePalace, bodyPalace: chart.bodyPalace } });
  }
}

if (failures.length) {
  console.error(JSON.stringify({ cases: cases.length, failures }, null, 2));
  process.exit(1);
}
console.log(`Public reference tests passed: ${cases.length} charts, ${metadataAssertions} metadata assertions, ${palaceAssertions} palace and major-star assertions, all 5 bureaus, 12 birth-hour branches and 14 major stars covered`);
