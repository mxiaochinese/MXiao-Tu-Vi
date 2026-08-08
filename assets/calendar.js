(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MXiaoCalendar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PI = Math.PI;
  const floor = Math.floor;

  function jdFromDate(day, month, year) {
    const a = floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    let jd = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045;
    if (jd < 2299161) jd = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - 32083;
    return jd;
  }

  function jdToDate(jd) {
    let a;
    let b;
    let c;
    if (jd > 2299160) {
      a = jd + 32044;
      b = floor((4 * a + 3) / 146097);
      c = a - floor((b * 146097) / 4);
    } else {
      b = 0;
      c = jd + 32082;
    }
    const d = floor((4 * c + 3) / 1461);
    const e = c - floor((1461 * d) / 4);
    const m = floor((5 * e + 2) / 153);
    const day = e - floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * floor(m / 10);
    const year = b * 100 + d - 4800 + floor(m / 10);
    return { year, month, day };
  }

  function newMoon(k) {
    const t = k / 1236.85;
    const t2 = t * t;
    const t3 = t2 * t;
    const dr = PI / 180;
    let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
    jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
    const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
    const mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
    const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
    let c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * m * dr);
    c1 = c1 - 0.4068 * Math.sin(mpr * dr) + 0.0161 * Math.sin(2 * mpr * dr);
    c1 -= 0.0004 * Math.sin(3 * mpr * dr);
    c1 += 0.0104 * Math.sin(2 * f * dr) - 0.0051 * Math.sin((m + mpr) * dr);
    c1 = c1 - 0.0074 * Math.sin((m - mpr) * dr) + 0.0004 * Math.sin((2 * f + m) * dr);
    c1 = c1 - 0.0004 * Math.sin((2 * f - m) * dr) - 0.0006 * Math.sin((2 * f + mpr) * dr);
    c1 += 0.0010 * Math.sin((2 * f - mpr) * dr) + 0.0005 * Math.sin((2 * mpr + m) * dr);
    let deltaT;
    if (t < -11) {
      deltaT = 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3;
    } else {
      deltaT = -0.000278 + 0.000265 * t + 0.000262 * t2;
    }
    return jd1 + c1 - deltaT;
  }

  function sunLongitude(jdn) {
    const t = (jdn - 2451545.0) / 36525;
    const t2 = t * t;
    const dr = PI / 180;
    const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
    const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
    let dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
    dl += (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.000290 * Math.sin(3 * dr * m);
    let l = (l0 + dl) * dr;
    l -= PI * 2 * floor(l / (PI * 2));
    return l;
  }

  function getNewMoonDay(k, timeZoneHours) {
    return floor(newMoon(k) + 0.5 + timeZoneHours / 24);
  }

  function getSunLongitude(dayNumber, timeZoneHours) {
    return floor((sunLongitude(dayNumber - 0.5 - timeZoneHours / 24) / PI) * 6);
  }

  function getLunarMonth11(year, timeZoneHours) {
    const off = jdFromDate(31, 12, year) - 2415021;
    const k = floor(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZoneHours);
    const sunLong = getSunLongitude(nm, timeZoneHours);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZoneHours);
    return nm;
  }

  function getLeapMonthOffset(a11, timeZoneHours) {
    const k = floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZoneHours), timeZoneHours);
    do {
      last = arc;
      i += 1;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZoneHours), timeZoneHours);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function validateSolar(day, month, year) {
    if (!Number.isInteger(year) || year < 1800 || year > 2199) throw new Error("Năm phải nằm trong khoảng 1800 đến 2199.");
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Tháng không hợp lệ.");
    const max = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (!Number.isInteger(day) || day < 1 || day > max) throw new Error("Ngày không hợp lệ.");
  }

  function solarToLunar(day, month, year, timeZoneHours) {
    validateSolar(day, month, year);
    const dayNumber = jdFromDate(day, month, year);
    const k = floor((dayNumber - 2415021.076998695) / 29.530588853);
    let moonIndex = k + 1;
    let monthStart = getNewMoonDay(moonIndex, timeZoneHours);
    while (monthStart > dayNumber) {
      moonIndex -= 1;
      monthStart = getNewMoonDay(moonIndex, timeZoneHours);
    }
    while (getNewMoonDay(moonIndex + 1, timeZoneHours) <= dayNumber) {
      moonIndex += 1;
      monthStart = getNewMoonDay(moonIndex, timeZoneHours);
    }
    let a11 = getLunarMonth11(year, timeZoneHours);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = year;
      a11 = getLunarMonth11(year - 1, timeZoneHours);
    } else {
      lunarYear = year + 1;
      b11 = getLunarMonth11(year + 1, timeZoneHours);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = floor((monthStart - a11) / 29);
    let lunarLeap = false;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZoneHours);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) lunarLeap = true;
      }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { year: lunarYear, month: lunarMonth, day: lunarDay, leap: lunarLeap };
  }

  function lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap, timeZoneHours) {
    if (!Number.isInteger(lunarYear) || lunarYear < 1799 || lunarYear > 2199) throw new Error("Năm âm lịch phải nằm trong khoảng 1799 đến 2199.");
    if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("Tháng âm lịch không hợp lệ.");
    if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("Ngày âm lịch không hợp lệ.");
    let a11;
    let b11;
    if (lunarMonth < 11) {
      a11 = getLunarMonth11(lunarYear - 1, timeZoneHours);
      b11 = getLunarMonth11(lunarYear, timeZoneHours);
    } else {
      a11 = getLunarMonth11(lunarYear, timeZoneHours);
      b11 = getLunarMonth11(lunarYear + 1, timeZoneHours);
    }
    const k = floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let off = lunarMonth - 11;
    if (off < 0) off += 12;
    if (b11 - a11 > 365) {
      const leapOff = getLeapMonthOffset(a11, timeZoneHours);
      let leapMonth = leapOff - 2;
      if (leapMonth <= 0) leapMonth += 12;
      if (lunarLeap && lunarMonth !== leapMonth) throw new Error("Tháng được chọn không phải tháng nhuận của năm âm lịch này.");
      if (lunarLeap || off >= leapOff) off += 1;
    } else if (lunarLeap) {
      throw new Error("Năm âm lịch này không có tháng nhuận đã chọn.");
    }
    const monthStart = getNewMoonDay(k + off, timeZoneHours);
    const nextMonthStart = getNewMoonDay(k + off + 1, timeZoneHours);
    if (lunarDay > nextMonthStart - monthStart) throw new Error("Ngày âm lịch không tồn tại trong tháng đã chọn.");
    return jdToDate(monthStart + lunarDay - 1);
  }

  return {
    jdFromDate,
    jdToDate,
    solarToLunar,
    lunarToSolar,
    getLunarMonth11,
    getLeapMonthOffset
  };
});
