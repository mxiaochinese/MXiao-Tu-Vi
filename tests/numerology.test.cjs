"use strict";

const assert = require("node:assert/strict");
const E = require("../src/numerology/engine");
const S = require("../src/numerology/synthesis");

function nameOptions(input) {
  return { yOverrides: input.y_overrides, unitGroups: input.unit_groups, givenUnitIndex: input.given_unit_index, locale: input.locale || "vi", structureConfirmed: input.structure_confirmed };
}

const dateCases = [
  [{ day: 15, month: 10, year: 1998 }, { life: 7, sum: 16, units: [1, 6, 9] }],
  [{ day: 12, month: 8, year: 1990 }, { life: 3, units: [8, 3, 1] }],
  [{ day: 22, month: 11, year: 1983 }, { life: 9, units: [11, 22, 3] }],
  [{ day: 29, month: 11, year: 1984 }, { life: 8, units: [11, 11, 22] }]
];
for (const [input, expected] of dateCases) {
  const result = E.calculateDateNumbers(input.day, input.month, input.year);
  assert.equal(result.life_path.value, expected.life);
  if (expected.sum) assert.equal(result.life_path.sum, expected.sum);
  assert.deepEqual([result.life_path.units.month.value, result.life_path.units.day.value, result.life_path.units.year.value], expected.units);
}

const cruise = E.calculateNameNumbers("Thomas Cruise Mapother", { locale: "en" });
assert.equal(cruise.expression.reduced, 4);
assert.deepEqual(cruise.expression_parts.map((item) => item.reduced), [22, 3, 6]);
const hancock = E.calculateNameNumbers("Thomas John Hancock", { locale: "en" });
assert.equal(hancock.soul_urge.reduced, 2);
assert.equal(hancock.balance.value, 2);
assert.equal(E.calculateDateNumbers(28, 11, 1990).attitude.value, 3);
const pinnacle = E.calculateDateNumbers(15, 5, 1949);
assert.deepEqual(pinnacle.pinnacles.map((item) => item.value), [11, 11, 22, 1]);
assert.equal(pinnacle.pinnacles[0].age_end, 29);
assert.deepEqual(E.calculateDateNumbers(3, 7, 1962).challenges, [4, 6, 2, 2]);
assert.equal(E.calculateDateNumbers(15, 5, 1949, 2026).forecast.personal_year.value, 3);
assert.deepEqual(E.calculateDateNumbers(1, 1, 2000).challenges, [0, 1, 1, 1]);
assert.throws(() => E.calculateDateNumbers(31, 2, 2026), /Ngày sinh/);

const sample = E.calculateProfile({ birthName: "Trần Minh Anh", day: 15, month: 10, year: 1998, targetYear: 2026, birthStructureConfirmed: true });
assert.deepEqual({ life: sample.date.life_path.value, expression: sample.birth_name.expression.reduced, soul: sample.birth_name.soul_urge.reduced, personality: sample.birth_name.personality.reduced, maturity: sample.maturity, personalYear: sample.date.forecast.personal_year.value, arrows: sample.date.birth_chart.filled_arrows, rational: sample.rational_thought, status: sample.status }, { life: 7, expression: 3, soul: 11, personality: 1, maturity: 1, personalYear: 8, arrows: ["1-5-9"], rational: 2, status: "final" });

assert.equal(E.normalizeName("Đỗ Đức Anh"), "DO DUC ANH");
const yDraft = E.calculateNameNumbers("Nguyễn Mỹ Linh");
assert.equal(yDraft.status, "provisional");
assert.equal(yDraft.y_review.length, 2);
assert.equal(E.calculateNameNumbers("Nguyễn Mỹ Linh", { yOverrides: { "0:3": "vowel" } }).status, "provisional");
assert.equal(E.calculateNameNumbers("Nguyễn Mỹ Linh", { yOverrides: { "0:3": "vowel", "1:1": "vowel" }, structureConfirmed: true }).status, "final");
assert.deepEqual(E.calculateNameNumbers("Nguyễn Minh Anh").calculation_units, ["NGUYEN", "MINH", "ANH"]);
assert.deepEqual(E.calculateNameNumbers("Nguyễn Minh Anh", { unitGroups: [[0], [1, 2]] }).calculation_units, ["NGUYEN", "MINH ANH"]);
const hyphenated = E.calculateNameNumbers("Mary-Jane Yates");
assert.deepEqual(hyphenated.calculation_units, ["MARYJANE", "YATES"]);
assert.equal(hyphenated.y_review.length, 2);
assert.throws(() => E.calculateNameNumbers("---"), /chữ cái Latin/);
assert.throws(() => E.calculateNameNumbers("John Smith Jr"), /danh xưng/);
assert.throws(() => E.calculateNameNumbers("Dr John Smith"), /danh xưng/);
assert.throws(() => E.calculateNameNumbers("张伟"), /chữ cái Latin/);
const noYDraft = E.calculateNameNumbers("Trần Minh Anh");
assert.equal(noYDraft.y_status, "final");
assert.equal(noYDraft.name_structure_review.status, "provisional");
assert.equal(noYDraft.given_unit, "ANH");
const english = E.calculateNameNumbers("Thomas Cruise Mapother", { locale: "en" });
assert.equal(english.status, "final");
assert.equal(english.given_unit, "THOMAS");
const merged = E.calculateNameNumbers("Trần Minh Anh", { unitGroups: [[0], [1, 2]], givenUnitIndex: 1, structureConfirmed: true });
assert.equal(merged.given_unit, "MINH ANH");
assert.equal(merged.cornerstone, "M");
assert.equal(merged.capstone, "H");
assert.equal(merged.balance.value, 6);
const currentDraft = E.calculateProfile({ birthName: "Trần Minh Anh", day: 15, month: 10, year: 1998, birthStructureConfirmed: true, currentName: "Minh Anh" });
assert.equal(currentDraft.status, "provisional");
assert.equal(currentDraft.birth_name.status, "final");
assert.equal(currentDraft.current_name.status, "provisional");

const nameCases = [
  ["Nguyễn Thúy Hằng","NGUYEN THUY HANG"],["Nguyễn Mỹ Linh","NGUYEN MY LINH"],["Yến Nhi","YEN NHI"],["Phạm Quỳnh Anh","PHAM QUYNH ANH"],["Trần Minh Anh","TRAN MINH ANH"],["Đỗ Đức Anh","DO DUC ANH"],["Lê Hoàng Phương","LE HOANG PHUONG"],["Vũ Khánh Vy","VU KHANH VY"],["Nguyễn Hải Yến","NGUYEN HAI YEN"],["Bùi Thùy Dương","BUI THUY DUONG"],
  ["Đặng Huy Hoàng","DANG HUY HOANG"],["Phan Mỹ Duyên","PHAN MY DUYEN"],["Trương Gia Huy","TRUONG GIA HUY"],["Lý Minh Khang","LY MINH KHANG"],["Đinh Y Nhung","DINH Y NHUNG"],["Hoàng Uyên Nhi","HOANG UYEN NHI"],["Cao Thị Thu Hương","CAO THI THU HUONG"],["Ngô Quỳnh Trang","NGO QUYNH TRANG"],["Đào Khánh Linh","DAO KHANH LINH"],["Tạ Đức Minh","TA DUC MINH"],
  ["Võ Thúy Nga","VO THUY NGA"],["Hồ Yên Chi","HO YEN CHI"],["Mai Phương Uyên","MAI PHUONG UYEN"],["Lương Nhật Huy","LUONG NHAT HUY"],["Dương Mỹ Anh","DUONG MY ANH"],["Nguyễn Quỳnh Như","NGUYEN QUYNH NHU"],["Trần Thùy My","TRAN THUY MY"],["Lê Yến Vy","LE YEN VY"],["Phạm Gia Huy","PHAM GIA HUY"],["Hoàng Thúy Uyên","HOANG THUY UYEN"],
  ["Vũ Quang Huy","VU QUANG HUY"],["Đỗ Mỹ Dung","DO MY DUNG"],["Bùi Ngọc Yến","BUI NGOC YEN"],["Dương Khánh Huyền","DUONG KHANH HUYEN"],["Lý Thùy Linh","LY THUY LINH"],["Nguyễn Diệu My","NGUYEN DIEU MY"],["Phan Yến Ly","PHAN YEN LY"],["Trương Thúy Quỳnh","TRUONG THUY QUYNH"],["Hồ Gia Mỹ","HO GIA MY"],["Đặng Uyên Phương","DANG UYEN PHUONG"],
  ["Tô Yến Nhi","TO YEN NHI"],["Trịnh Huyền My","TRINH HUYEN MY"],["Hà Quỳnh Chi","HA QUYNH CHI"],["Chu Đức Huy","CHU DUC HUY"],["Cao Mỹ Uyên","CAO MY UYEN"],["Nguyễn Đức Long","NGUYEN DUC LONG"],["Trần Ngọc Anh","TRAN NGOC ANH"],["Phạm Hoàng Nam","PHAM HOANG NAM"],["Lê Thu Hà","LE THU HA"],["Vũ Minh Khoa","VU MINH KHOA"]
];
assert.equal(nameCases.length, 50);
for (const [original, normalized] of nameCases) assert.equal(E.normalizeName(original), normalized);
assert.equal(nameCases.filter(([name]) => E.yReviewItems(name).length).length, 40);

let validDateCount = 0;
for (let year = 1900; year <= 2099; year += 1) {
  for (let month = 1; month <= 12; month += 1) {
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= days; day += 1) {
      const date = E.calculateDateNumbers(day, month, year);
      assert.ok([1,2,3,4,5,6,7,8,9,11,22,33].includes(date.life_path.value));
      validDateCount += 1;
    }
  }
}
assert.equal(validDateCount, 73049);

const narrative = S.buildNarrative(sample);
assert.equal(narrative.sections.length, 10);
assert.ok(narrative.wordCount >= 4500 && narrative.wordCount <= 7000, `Unexpected narrative length: ${narrative.wordCount}`);
const narrativeText = narrative.sections.flatMap((section) => section.paragraphs).join("\n");
assert.doesNotMatch(narrativeText, /không\s+chỉ|không\s+đơn\s+thuần|không\s+phải[^.]{0,100}\bmà\b/iu);
assert.doesNotMatch(narrativeText, /source_id|rule id|dataset|json|engine|placement|topology/iu);
assert.doesNotMatch(narrativeText, /(?:^|\s)AI(?:\s|$)/u);
for (const section of narrative.sections) for (const paragraph of section.paragraphs) assert.ok(paragraph.trim().split(/\s+/).length >= 45, `Fragmented paragraph in ${section.id}`);

console.log(`Numerology validation passed: 33 locked behaviors, ${validDateCount} dates, ${nameCases.length} Vietnamese names, ${narrative.wordCount} words.`);
