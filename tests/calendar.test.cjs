const assert = require('node:assert/strict');
const calendar = require('../src/calendar.js');

const newYears = [
  [5, 2, 2000],
  [14, 2, 2010],
  [25, 1, 2020],
  [12, 2, 2021],
  [1, 2, 2022],
  [22, 1, 2023],
  [10, 2, 2024],
  [29, 1, 2025],
  [17, 2, 2026]
];
for (const [day, month, year] of newYears) {
  assert.deepEqual(calendar.solarToLunar(day, month, year, 7), { year, month: 1, day: 1, leap: false }, `Lunar new year ${year}`);
  assert.deepEqual(calendar.lunarToSolar(1, 1, year, false, 7), { year, month, day }, `Inverse lunar new year ${year}`);
}

assert.deepEqual(calendar.solarToLunar(14, 5, 1998, 7), { year: 1998, month: 4, day: 19, leap: false });
assert.deepEqual(calendar.solarToLunar(22, 3, 2023, 7), { year: 2023, month: 2, day: 1, leap: true });
assert.deepEqual(calendar.lunarToSolar(1, 2, 2023, true, 7), { year: 2023, month: 3, day: 22 });

assert.deepEqual(calendar.solarToLunar(22, 3, 1947, 8), { year: 1947, month: 2, day: 30, leap: false });
assert.deepEqual(calendar.solarToLunar(22, 1, 1871, 0), { year: 1870, month: 12, day: 2, leap: true });
assert.deepEqual(calendar.lunarToSolar(2, 12, 1870, true, 0), { year: 1871, month: 1, day: 22 });

let checked = 0;
for (const timeZone of [-8, -5, 0, 5.5, 7, 8, 9.5, 12]) {
  for (let year = 1800; year <= 2199; year += 1) {
    for (const month of [1, 2, 3, 6, 9, 12]) {
      for (const day of [1, 8, 15, 22, 28]) {
        const lunar = calendar.solarToLunar(day, month, year, timeZone);
        const solar = calendar.lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.leap, timeZone);
        assert.deepEqual(solar, { year, month, day }, `Round trip ${year}-${month}-${day} UTC${timeZone}`);
        checked += 1;
      }
    }
  }
}
console.log(`Calendar tests passed: ${newYears.length * 2 + 6 + checked}`);
