"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movePalace = movePalace;
exports.getHourBranch = getHourBranch;
exports.getYearStem = getYearStem;
exports.getYearBranch = getYearBranch;
exports.getYearCanChi = getYearCanChi;
exports.julianDayNumber = julianDayNumber;
exports.getDayStemBranch = getDayStemBranch;
exports.getLifePalace = getLifePalace;
exports.getBodyPalace = getBodyPalace;
exports.findTuViPalace = findTuViPalace;
const constants_1 = require("./constants");
function movePalace(start, ...offsets) {
    const total = offsets.reduce((sum, value) => sum + value, start);
    return ((total - 1) % 12 + 12) % 12 + 1;
}
function getHourBranch(hour, minute = 0, mode = "zi23") {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23)
        throw new Error("Giờ sinh phải từ 0 đến 23.");
    if (!Number.isInteger(minute) || minute < 0 || minute > 59)
        throw new Error("Phút sinh phải từ 0 đến 59.");
    const totalMinutes = hour * 60 + minute;
    if (mode === "zi00")
        return Math.floor(totalMinutes / 120) + 1;
    if (totalMinutes >= 23 * 60 || totalMinutes < 60)
        return 1;
    return Math.floor((totalMinutes - 60) / 120) + 2;
}
function getYearStem(year) {
    return ((year + 6) % 10) + 1;
}
function getYearBranch(year) {
    return ((year + 8) % 12) + 1;
}
function getYearCanChi(year) {
    return `${constants_1.STEMS[getYearStem(year)]} ${constants_1.BRANCHES[getYearBranch(year)]}`;
}
function julianDayNumber(day, month, year) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
function getDayStemBranch(day, month, year) {
    const jd = julianDayNumber(day, month, year);
    const stem = ((jd + 9) % 10) + 1;
    const branch = ((jd + 1) % 12) + 1;
    return { stem, branch, label: `${constants_1.STEMS[stem]} ${constants_1.BRANCHES[branch]}` };
}
function getLifePalace(lunarMonth, hourBranch) {
    return movePalace(3, lunarMonth - 1, -(hourBranch - 1));
}
function getBodyPalace(lunarMonth, hourBranch) {
    return movePalace(3, lunarMonth - 1, hourBranch - 1);
}
function findTuViPalace(bureauNumber, lunarDay) {
    if (![2, 3, 4, 5, 6].includes(bureauNumber))
        throw new Error("Cục phải thuộc 2, 3, 4, 5 hoặc 6.");
    let running = bureauNumber;
    let tigerPalace = 3;
    while (running < lunarDay) {
        running += bureauNumber;
        tigerPalace += 1;
    }
    let difference = running - lunarDay;
    if (difference % 2 === 1)
        difference = -difference;
    return movePalace(tigerPalace, difference);
}
