const assert = require('node:assert/strict');
const calendar = require('../src/calendar.js');
const engine = require('../src/engine/engine.js');
const core = require('../src/engine/core.js');
const profiles = require('../src/engine/profiles.js');
const time = require('../src/engine/time-correction.js');
const stars = require('../src/engine/stars.js');
const brightness = require('../src/engine/brightness.js');
const fortune = require('../src/engine/fortune.js');

function normalized({ year, month, day, hour, minute, timezone = 'Asia/Ho_Chi_Minh' }) {
  const offset = time.getTimeZoneOffsetMinutes({ year, month, day, hour, minute }, timezone) / 60;
  const lunar = calendar.solarToLunar(day, month, year, offset);
  const profile = profiles.getCalculationProfile();
  const dc = core.getDayStemBranch(day, month, year);
  return {
    solar: { year, month, day },
    originalSolar: { year, month, day },
    lunar,
    originalTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    adjustedTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    timeCorrectionMode: 'civil',
    timeCorrectionMinutes: 0,
    timezoneOffsetMinutes: offset * 60,
    hour,
    minute,
    hourBranch: core.getHourBranch(hour, minute, profile.ziHourMode),
    yearStem: core.getYearStem(lunar.year),
    yearBranch: core.getYearBranch(lunar.year),
    dayStem: dc.stem,
    dayBranch: dc.branch,
    yearCanChi: core.getYearCanChi(lunar.year),
    dayCanChi: dc.label
  };
}

function viewMoment({ viewYear, viewMonth, viewDay, viewHourBranch, timezone, viewLeap = false }) {
  let offset = time.getTimeZoneOffsetMinutes({ year: viewYear, month: 6, day: 15, hour: 12, minute: 0 }, timezone) / 60;
  let solar = calendar.lunarToSolar(viewDay, viewMonth, viewYear, viewLeap, offset);
  offset = time.getTimeZoneOffsetMinutes({ ...solar, hour: 12, minute: 0 }, timezone) / 60;
  solar = calendar.lunarToSolar(viewDay, viewMonth, viewYear, viewLeap, offset);
  const day = core.getDayStemBranch(solar.day, solar.month, solar.year);
  return { viewDay, viewHourBranch, viewSolarDate: solar, viewDayStem: day.stem, viewDayBranch: day.branch, viewDayCanChi: day.label };
}

function findForbiddenKey(value, path = '') {
  if (!value || typeof value !== 'object') return [];
  const findings = [];
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (/source|rule|profile|version|confidence|action|evidence|warning/i.test(key)) findings.push(next);
    findings.push(...findForbiddenKey(child, next));
  }
  return findings;
}

assert.equal(core.movePalace(12, 1), 1);
assert.equal(core.movePalace(1, -1), 12);
assert.equal(core.getHourBranch(23, 30, 'zi23'), 1);
assert.equal(stars.validateMajorStarCatalogue(), true);
assert.equal(brightness.validateBrightnessCatalogue(), true);
assert.deepEqual(stars.FOUR_TRANSFORMATIONS_TABLE[7], ['thai-duong', 'vu-khuc', 'thai-am', 'thien-dong']);

function supportingStarPalace(params, starName) {
  const placed = stars.placeSupportingStars({
    lunarMonth: 1, lunarDay: 1, bureauNumber: 4, lifeCycleMode: 'standard', lifePalace: 1, bodyPalace: 1,
    ...params
  });
  return placed.find((item) => item.name === starName)?.palace;
}
assert.equal(supportingStarPalace({ yearStem: 8, yearBranch: 8, hourBranch: 4, gender: 'female' }, 'Hỏa Tinh'), 1);
assert.equal(supportingStarPalace({ yearStem: 8, yearBranch: 8, hourBranch: 4, gender: 'female' }, 'Linh Tinh'), 8);
assert.equal(supportingStarPalace({ yearStem: 8, yearBranch: 8, hourBranch: 11, gender: 'female' }, 'Hỏa Tinh'), 8);
assert.equal(supportingStarPalace({ yearStem: 4, yearBranch: 4, hourBranch: 1, gender: 'female' }, 'Hỏa Tinh'), 10);
assert.equal(supportingStarPalace({ yearStem: 4, yearBranch: 4, hourBranch: 1, gender: 'female' }, 'Linh Tinh'), 11);
assert.equal(supportingStarPalace({ yearStem: 1, yearBranch: 1, hourBranch: 4, gender: 'male' }, 'Hỏa Tinh'), 6);
assert.equal(supportingStarPalace({ yearStem: 1, yearBranch: 1, hourBranch: 4, gender: 'male' }, 'Linh Tinh'), 8);

assert.equal(fortune.getMinorFortuneStartPalace(3), 5);
assert.equal(fortune.getMinorFortuneStartPalace(7), 5);
assert.equal(fortune.getMinorFortuneStartPalace(11), 5);
assert.equal(fortune.getMinorFortuneStartPalace(9), 11);
assert.equal(fortune.getMinorFortuneStartPalace(1), 11);
assert.equal(fortune.getMinorFortuneStartPalace(5), 11);
assert.equal(fortune.getMinorFortuneStartPalace(6), 8);
assert.equal(fortune.getMinorFortuneStartPalace(10), 8);
assert.equal(fortune.getMinorFortuneStartPalace(2), 8);
assert.equal(fortune.getMinorFortuneStartPalace(12), 2);
assert.equal(fortune.getMinorFortuneStartPalace(4), 2);
assert.equal(fortune.getMinorFortuneStartPalace(8), 2);
assert.equal(fortune.getMinorFortunePalace(1, 1, 'male'), 11);
assert.equal(fortune.getMinorFortunePalace(7, 7, 'female'), 5);
assert.equal(fortune.getAnnualDecadePalace(5, 23, 27, 1), 12);
assert.equal(fortune.getAnnualDecadePalace(10, 34, 38, -1), 3);
assert.equal(fortune.getAnnualDouJunPalace(7, 4, 6), 9);
assert.equal(fortune.getMonthlyFortunePalace(7, 4, 6, 4), 12);
assert.equal(fortune.getMonthStem(3, 4), 10);
assert.equal(fortune.getMonthBranch(4), 6);
assert.equal(fortune.getMonthCanChi(3, 4), 'Quý Tỵ');
assert.equal(fortune.getDailyFortunePalace(12, 15), 2);
assert.equal(fortune.getHourlyFortunePalace(2, 7), 8);
assert.equal(fortune.getHourStem(1, 1), 1);
assert.equal(fortune.getHourStem(2, 7), 9);
assert.equal(fortune.getHourCanChi(2, 7), 'Nhâm Ngọ');
assert.deepEqual(fortune.resolveLeapFortuneMoment(6, 15, true, 'split-half-next'), { month: 6, day: 15, shifted: false });
assert.deepEqual(fortune.resolveLeapFortuneMoment(6, 16, true, 'split-half-next'), { month: 7, day: 1, shifted: true });
assert.deepEqual(fortune.resolveLeapFortuneMoment(6, 24, true, 'repeat-current'), { month: 6, day: 24, shifted: false });

const leapTimezone = 'Asia/Ho_Chi_Minh';
const leapBirth = normalized({ year: 1998, month: 5, day: 14, hour: 9, minute: 30, timezone: leapTimezone });
function leapChart(viewDay, mode = 'split-half-next') {
  const moment = viewMoment({ viewYear: 2025, viewMonth: 6, viewDay, viewHourBranch: 7, timezone: leapTimezone, viewLeap: true });
  return engine.buildTuviChart({
    fullName: 'Leap month test', gender: 'female', calendarType: 'solar', lunarLeap: false, timezone: leapTimezone,
    viewYear: 2025, viewMonth: 6, viewLeap: true, leapFortuneMode: mode,
    timePrecision: 'exact', calculationProfileId: 'VN_TAN_BIEN_1956', ...moment
  }, leapBirth);
}
const leapFirstHalf = leapChart(15);
const leapSecondHalf = leapChart(16);
const leapRepeated = leapChart(16, 'repeat-current');
assert.equal(leapFirstHalf.analysis.effectiveViewMonth, 6);
assert.equal(leapFirstHalf.analysis.effectiveViewDay, 15);
assert.equal(leapSecondHalf.analysis.effectiveViewMonth, 7);
assert.equal(leapSecondHalf.analysis.effectiveViewDay, 1);
assert.equal(leapRepeated.analysis.effectiveViewMonth, 6);
assert.equal(leapRepeated.analysis.effectiveViewDay, 16);
assert.notEqual(leapFirstHalf.analysis.monthlyPalaceId, leapSecondHalf.analysis.monthlyPalaceId);
assert.ok(leapSecondHalf.analysis.monthlyLabel.includes('nhuận'));


const timezones = ['Asia/Ho_Chi_Minh', 'America/New_York', 'Europe/Paris'];
const dates = [[1998, 5, 14, 9, 30], [2003, 9, 21, 8, 0], [2024, 2, 10, 23, 30]];
let charts = 0;
for (const gender of ['male', 'female']) {
  for (const timezone of timezones) {
    for (const date of dates) {
      for (const viewYear of [2026, 2031]) {
        const [year, month, day, hour, minute] = date;
        const input = { fullName: 'Test User', gender, calendarType: 'solar', lunarLeap: false, timezone, viewYear, viewMonth: 4, timePrecision: 'exact', calculationProfileId: 'VN_TAN_BIEN_1956', ...viewMoment({ viewYear, viewMonth: 4, viewDay: 15, viewHourBranch: 7, timezone }) };
        const normalizedInput = normalized({ year, month, day, hour, minute, timezone });
        const chart = engine.buildTuviChart(input, normalizedInput);
        assert.deepEqual(engine.buildTuviChart(input, normalizedInput), chart);
        assert.equal(chart.palaces.length, 12);
        assert.equal(chart.annualStars.length, 13);
        assert.equal(chart.monthlyStars.length, 10);
        assert.equal(chart.dailyStars.length, 10);
        assert.equal(chart.hourlyStars.length, 10);
        assert.ok(chart.palaces.every((palace) => Array.isArray(palace.annualStars) && Array.isArray(palace.monthlyStars) && Array.isArray(palace.dailyStars) && Array.isArray(palace.hourlyStars)));
        assert.ok(chart.analysis.monthlyPalaceId >= 1 && chart.analysis.monthlyPalaceId <= 12);
        assert.equal(chart.analysis.monthCanChi, 'Quý Tỵ');
        const majorStars = chart.palaces.flatMap((palace) => palace.stars).filter((star) => star.group === 'major');
        assert.equal(majorStars.length, 14);
        assert.ok(majorStars.every((star) => star.brightness && star.brightnessCode));
        assert.ok(chart.analysis.activeDecadePalaceId === null || chart.analysis.activeDecadePalaceId >= 1);
        assert.ok(chart.analysis.annualDecadePalaceId === null || chart.analysis.annualDecadePalaceId >= 1);
        assert.ok(chart.analysis.minorFortunePalaceId >= 1 && chart.analysis.minorFortunePalaceId <= 12);
        const topics = new Set(chart.interpretations.map((item) => item.topic));
        for (const topic of ['Tổng quan', '12 cung', 'Đại vận', 'Tiểu vận', `Vận hạn ${viewYear}`, 'Lưu nguyệt tháng 4', 'Lưu nhật ngày 15', 'Lưu thời giờ 7']) assert.ok(topics.has(topic));
        assert.ok(chart.interpretations.length >= 30);
        assert.ok(chart.interpretations.every((item) => Array.isArray(item.paragraphs) && item.paragraphs.length >= 1));
        assert.ok(chart.interpretations.every((item) => !Object.prototype.hasOwnProperty.call(item, 'facts')));
        assert.ok(chart.interpretations.every((item) => item.paragraphs.every((paragraph) => paragraph.length >= 80)));
        const interpretationParagraphs = chart.interpretations.flatMap((item) => item.paragraphs);
        assert.equal(new Set(interpretationParagraphs).size, interpretationParagraphs.length);
        assert.ok(interpretationParagraphs.every((paragraph) => !/^\s*(?:[-*•]|\d+[.)])\s+/u.test(paragraph)));
        const interpretationText = interpretationParagraphs.join(' ');
        for (const phrase of ['Căn cứ lá số', 'Chính tinh:', 'Cát tinh và trợ tinh:', 'Sát tinh và trở lực:']) assert.ok(!interpretationText.includes(phrase));
        assert.doesNotMatch(interpretationText, /chắc chắn sẽ|ắt sẽ|số phận đã định|bắt buộc phải/iu);
        assert.doesNotMatch(interpretationText, /Bộ sao lưu (?:năm|tháng|ngày|giờ) gồm/iu);
        const overviewItems = chart.interpretations.filter((item) => item.topic === 'Tổng quan');
        assert.ok(overviewItems.length >= 4 && overviewItems.length <= 6);
        const timeline = overviewItems.find((item) => item.id === 'overview-timeline');
        assert.ok(timeline && timeline.paragraphs.some((paragraph) => paragraph.includes('tuổi mụ')));
        const validAgeRanges = new Set(chart.palaces.map((palace) => `${palace.decadeStart}-${palace.decadeEnd}`));
        for (const match of timeline.body.matchAll(/(\d+)-(\d+) tuổi/gu)) assert.ok(validAgeRanges.has(`${match[1]}-${match[2]}`));
        const palaceItems = chart.interpretations.filter((item) => item.topic === '12 cung');
        assert.ok(new Set(palaceItems.map((item) => item.paragraphs.length)).size >= 2);
        const openings = palaceItems.map((item) => item.paragraphs[0].toLowerCase().split(/\s+/).slice(0, 3).join(' '));
        for (let index = 2; index < openings.length; index += 1) {
          assert.ok(!(openings[index] === openings[index - 1] && openings[index] === openings[index - 2]));
        }
        assert.equal(chart.interpretations.filter((item) => item.topic === 'Mệnh - Thân').length, 1);
        const annualLength = chart.interpretations.filter((item) => item.topic === `Vận hạn ${viewYear}`).reduce((sum, item) => sum + item.body.length, 0);
        const monthLength = chart.interpretations.filter((item) => item.topic === 'Lưu nguyệt tháng 4').reduce((sum, item) => sum + item.body.length, 0);
        assert.ok(monthLength < annualLength);
        assert.deepEqual(findForbiddenKey(chart), []);
        const text = JSON.stringify(chart).toLowerCase();
        for (const phrase of ['gợi ý thực hành', 'rule trace', 'dataset', 'codex', 'sourceid', 'sourcerule', 'profileversion']) assert.ok(!text.includes(phrase));
        charts += 1;
      }
    }
  }
}
console.log(`Engine tests passed: ${charts} full charts, annual, monthly, daily and hourly fortune formulas`);
