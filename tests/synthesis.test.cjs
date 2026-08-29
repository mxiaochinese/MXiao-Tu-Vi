"use strict";

const assert = require("node:assert/strict");
const Astronomy = require("astronomy-engine");
const fs = require("node:fs");
const path = require("node:path");

const calendar = require("../src/calendar");
const astrology = require("../src/astrology/engine");
const core = require("../src/engine/core");
const tuvi = require("../src/engine/engine");
const numerology = require("../src/numerology/engine");
const numerologyNarrative = require("../src/numerology/synthesis");
const profiles = require("../src/engine/profiles");
const synthesis = require("../src/synthesis/browser");
const time = require("../src/engine/time-correction");

function normalizedTuviBirth() {
  const year = 2001; const month = 10; const day = 20; const hour = 6; const minute = 0;
  const timezone = "Asia/Ho_Chi_Minh";
  const offset = time.getTimeZoneOffsetMinutes({ year, month, day, hour, minute }, timezone) / 60;
  const lunar = calendar.solarToLunar(day, month, year, offset);
  const profile = profiles.getCalculationProfile("VN_TAN_BIEN_1956");
  const dayCanChi = core.getDayStemBranch(day, month, year);
  return {
    solar: { year, month, day }, originalSolar: { year, month, day }, lunar,
    originalTime: "Giờ Mão", adjustedTime: "06:00", timeDisplay: "Giờ Mão",
    timeCorrectionMode: "civil", timeCorrectionMinutes: 0, timezoneOffsetMinutes: offset * 60,
    hour, minute, hourBranch: 4,
    yearStem: core.getYearStem(lunar.year), yearBranch: core.getYearBranch(lunar.year),
    dayStem: dayCanChi.stem, dayBranch: dayCanChi.branch,
    yearCanChi: core.getYearCanChi(lunar.year), dayCanChi: dayCanChi.label,
    calculationProfileId: profile.id
  };
}

function sampleInputs() {
  const tuviChart = tuvi.buildTuviChart({
    fullName: "Vũ Minh Hiếu", gender: "male", calendarType: "solar", lunarLeap: false,
    timezone: "Asia/Ho_Chi_Minh", viewScope: "natal_overview", timePrecision: "branch",
    birthHourBranch: 4, calculationProfileId: "VN_TAN_BIEN_1956"
  }, normalizedTuviBirth());

  const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "astrology", "interpretation-corpus-v1.6.json"), "utf8"));
  const rules = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "astrology", "synthesis-rules-v1.6.json"), "utf8"));
  const style = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "astrology", "writer-style-v1.7.json"), "utf8"));
  const astroEngine = astrology.createAstrologyEngine(Astronomy, corpus, rules, style);
  const astroChart = astroEngine.buildNatalChart({
    fullName: "Nguyễn Minh An", birthDate: "1998-05-14", birthTime: "09:30", timeAccuracy: "exact",
    location: { label: "TP. Hồ Chí Minh, Việt Nam", latitude: 10.8231, longitude: 106.6297, timezone: "Asia/Ho_Chi_Minh" },
    houseSystem: "placidus"
  });

  const numberProfile = numerology.calculateProfile({
    birthName: "Trần Minh Anh", day: 15, month: 10, year: 1998, targetYear: 2026, birthStructureConfirmed: true
  });
  const numberNarrative = numerologyNarrative.buildNarrative(numberProfile);

  return [
    synthesis.tuviInput(tuviChart),
    synthesis.astrologyInput(astroChart),
    synthesis.numerologyInput(numberProfile, numberNarrative)
  ];
}

const inputs = sampleInputs();
assert.deepEqual(inputs.map((input) => input.system), ["tu_vi", "astrology", "numerology"]);
for (const input of inputs) {
  assert.equal(input.subject.displayName, undefined);
  assert.equal(input.scope, "overview");
  assert.ok(input.evidence.length >= 3 && input.evidence.length <= 48);
  assert.equal(new Set(input.evidence.map((item) => item.id)).size, input.evidence.length);
  assert.ok(input.evidence.every((item) => item.system === input.system));
  assert.ok(input.evidence.every((item) => item.fact && item.interpretation && item.confidence));
  const serialized = JSON.stringify(input);
  assert.ok(!serialized.includes("Vũ Minh Hiếu"));
  assert.ok(!serialized.includes("Nguyễn Minh An"));
  assert.ok(!serialized.includes("Trần Minh Anh"));
  assert.ok(!serialized.includes("1998-05-14"));
  assert.ok(!serialized.includes("2001-10-20"));
}

const allowedId = inputs[0].evidence[0].id;
const validProfile = {
  version: "1.0",
  oneSentencePortrait: "Một chân dung đủ dài để vượt qua kiểm tra tối thiểu.",
  coreIdentity: { summary: "Tóm tắt bản sắc đã được nối từ evidence hợp lệ.", evidenceIds: [allowedId] },
  dominantStrengths: [], coreTensions: [], behavioralPatterns: [], keyClaims: []
};
assert.equal(synthesis.validProfile(validProfile, [allowedId]), true);
validProfile.coreIdentity.evidenceIds = ["unknown.evidence"];
assert.equal(synthesis.validProfile(validProfile, [allowedId]), false);

assert.equal(synthesis.PROMPT_VERSION, "wp-1.0");
console.log(`Whole-person synthesis contracts passed for ${inputs.length} systems.`);

module.exports = { sampleInputs };
