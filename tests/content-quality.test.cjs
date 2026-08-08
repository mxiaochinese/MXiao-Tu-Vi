const assert = require('node:assert/strict');
const calendar = require('../src/calendar.js');
const engine = require('../src/engine/engine.js');
const core = require('../src/engine/core.js');
const profiles = require('../src/engine/profiles.js');
const time = require('../src/engine/time-correction.js');

function normalizedBirth() {
  const year = 2001;
  const month = 10;
  const day = 20;
  const hour = 6;
  const minute = 0;
  const timezone = 'Asia/Ho_Chi_Minh';
  const offset = time.getTimeZoneOffsetMinutes({ year, month, day, hour, minute }, timezone) / 60;
  const lunar = calendar.solarToLunar(day, month, year, offset);
  const profile = profiles.getCalculationProfile('VN_TAN_BIEN_1956');
  const dayCanChi = core.getDayStemBranch(day, month, year);
  return {
    solar: { year, month, day }, originalSolar: { year, month, day }, lunar,
    originalTime: 'Giờ Mão', adjustedTime: '06:00', timeDisplay: 'Giờ Mão',
    timeCorrectionMode: 'civil', timeCorrectionMinutes: 0, timezoneOffsetMinutes: offset * 60,
    hour, minute, hourBranch: 4,
    yearStem: core.getYearStem(lunar.year), yearBranch: core.getYearBranch(lunar.year),
    dayStem: dayCanChi.stem, dayBranch: dayCanChi.branch,
    yearCanChi: core.getYearCanChi(lunar.year), dayCanChi: dayCanChi.label,
    calculationProfileId: profile.id
  };
}

const chart = engine.buildTuviChart({
  fullName: 'Vũ Minh Hiếu', gender: 'male', calendarType: 'solar', lunarLeap: false,
  timezone: 'Asia/Ho_Chi_Minh', viewScope: 'natal_overview', timePrecision: 'branch',
  birthHourBranch: 4, calculationProfileId: 'VN_TAN_BIEN_1956'
}, normalizedBirth());

const paragraphs = chart.interpretations.flatMap((item) => item.paragraphs || []);
const report = paragraphs.join('\n');
const lower = report.toLocaleLowerCase('vi');
const forbidden = [
  'có nền nâng đỡ rõ hơn phần gây sức ép', 'có nền thuận tương đối rõ',
  'trạng thái của bộ chính tinh cho biết', 'đây là phần điều chỉnh của cung',
  'các cung liên hệ tạo thêm nền nâng đỡ', 'không được đọc như một ô độc lập',
  'lớp vận này chỉ tăng hoặc điều chỉnh', 'chuỗi tuổi mô tả sự đổi trọng tâm',
  'nguồn lực được duy trì trong thực tế', 'tứ hóa chỉ làm rõ hướng vận hành',
  'nhịp biểu hiện dễ ngắt', 'trở thành trọng tâm rõ hơn bình thường',
  'có nền thuận'
];
for (const phrase of forbidden) assert.ok(!lower.includes(phrase), `Còn câu khung bị cấm: ${phrase}`);

const mechanicalTerms = ['trục vận hành', 'lớp vận', 'đổi nhịp', 'nhịp biểu hiện', 'kích hoạt đúng trục', 'phần gây sức ép'];
for (const term of mechanicalTerms) assert.ok(!lower.includes(term), `Còn ngôn ngữ cơ học: ${term}`);

function sentenceKey(sentence) {
  return sentence.toLocaleLowerCase('vi').replace(/\d+/g, '#').replace(/[^\p{L}# ]/gu, ' ').replace(/\s+/g, ' ').trim();
}
const longSentences = paragraphs.flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/u))
  .map(sentenceKey).filter((sentence) => sentence.split(' ').length >= 12);
const exactCounts = new Map();
for (const sentence of longSentences) exactCounts.set(sentence, (exactCounts.get(sentence) || 0) + 1);
for (const [sentence, count] of exactCounts) assert.ok(count < 3, `Một câu dài lặp ${count} lần: ${sentence}`);

function shingles(sentence) {
  const words = sentence.split(' ');
  return new Set(words.slice(0, -2).map((_, index) => words.slice(index, index + 3).join(' ')));
}
function similarity(first, second) {
  const a = shingles(first);
  const b = shingles(second);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / Math.max(a.size, b.size);
}
for (let index = 0; index < longSentences.length; index += 1) {
  const close = longSentences.filter((candidate) => similarity(longSentences[index], candidate) >= 0.92);
  assert.ok(close.length < 3, `Câu gần nguyên văn xuất hiện ${close.length} lần: ${longSentences[index]}`);
}

const palaceItems = chart.interpretations.filter((item) => item.topic === '12 cung');
assert.equal(palaceItems.length, 12);
for (const item of palaceItems) assert.ok(item.paragraphs.length >= 2 && item.paragraphs.length <= 4, `${item.title} phải có 2-4 đoạn`);
const openings = palaceItems.map((item) => sentenceKey(item.paragraphs[0]).split(' ').slice(0, 6).join(' '));
const openingCounts = openings.reduce((map, opening) => map.set(opening, (map.get(opening) || 0) + 1), new Map());
assert.ok(Math.max(...openingCounts.values()) < 3, 'Ba cung trở lên đang dùng cùng một cấu trúc mở đoạn');

const currentDecade = chart.interpretations.find((item) => item.title === 'Đại hạn 24-33 tuổi');
const remoteDecade = chart.interpretations.find((item) => item.title === 'Đại hạn 94-103 tuổi');
assert.ok(currentDecade && remoteDecade);
assert.ok(currentDecade.paragraphs.length >= 5, 'Đại hạn hiện tại phải được luận sâu');
assert.ok(currentDecade.paragraphs.length > remoteDecade.paragraphs.length, 'Đại hạn xa phải cô đọng hơn Đại hạn hiện tại');
assert.match(currentDecade.body, /cam kết|hợp tác lâu dài|phân chia vai trò/u);
assert.doesNotMatch(currentDecade.body, /chắc chắn.*hôn nhân|trọng tâm.*hôn nhân/iu);

const timeline = chart.interpretations.find((item) => item.id === 'overview-timeline');
assert.ok(timeline && timeline.paragraphs.length >= 5 && timeline.paragraphs.length <= 7, 'Dòng thời gian phải có 4-6 mốc chọn lọc');

const topics = ['Sự nghiệp', 'Tài chính', 'Tình cảm', 'Gia đình - Quan hệ', 'Sức khỏe - Nhịp sống'];
const topicOpenings = topics.map((topic) => sentenceKey(chart.interpretations.find((item) => item.topic === topic).paragraphs[0]).split(' ').slice(0, 9).join(' '));
assert.equal(new Set(topicOpenings).size, topics.length, 'Các chuyên đề không được dùng cùng một câu mở đầu');

console.log(`Content quality regression passed: ${paragraphs.length} paragraphs for Vũ Minh Hiếu`);
