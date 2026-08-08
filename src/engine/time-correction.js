"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTimeZone = isValidTimeZone;
exports.getTimeZoneOffsetMinutes = getTimeZoneOffsetMinutes;
exports.getEquationOfTimeMinutes = getEquationOfTimeMinutes;
exports.correctBirthDateTime = correctBirthDateTime;
function partsFromFormatter(date, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    });
    const values = Object.fromEntries(formatter.formatToParts(date)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]));
    return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute
    };
}
function isValidTimeZone(timeZone) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
        return true;
    }
    catch {
        return false;
    }
}
function getTimeZoneOffsetMinutes(parts, timeZone) {
    if (!isValidTimeZone(timeZone))
        throw new Error(`Múi giờ IANA không hợp lệ: ${timeZone}.`);
    let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    for (let iteration = 0; iteration < 2; iteration += 1) {
        const observed = partsFromFormatter(new Date(guess), timeZone);
        const observedUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute);
        const desiredUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
        guess += desiredUtc - observedUtc;
    }
    return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - guess) / 60000);
}
function dayOfYear(year, month, day) {
    const start = Date.UTC(year, 0, 0);
    const current = Date.UTC(year, month - 1, day);
    return Math.floor((current - start) / 86400000);
}
function getEquationOfTimeMinutes(year, month, day) {
    const n = dayOfYear(year, month, day);
    const b = (2 * Math.PI * (n - 81)) / 364;
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}
function correctBirthDateTime(parts, location, mode) {
    const timezoneOffsetMinutes = getTimeZoneOffsetMinutes(parts, location.timezone);
    const standardMeridian = (timezoneOffsetMinutes / 60) * 15;
    const longitudeCorrectionMinutes = (location.longitude - standardMeridian) * 4;
    const equationOfTimeMinutes = getEquationOfTimeMinutes(parts.year, parts.month, parts.day);
    const correctionMinutes = mode === "true-solar"
        ? longitudeCorrectionMinutes + equationOfTimeMinutes
        : 0;
    const corrected = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) + correctionMinutes * 60000);
    return {
        year: corrected.getUTCFullYear(),
        month: corrected.getUTCMonth() + 1,
        day: corrected.getUTCDate(),
        hour: corrected.getUTCHours(),
        minute: corrected.getUTCMinutes(),
        correctionMinutes,
        timezoneOffsetMinutes,
        longitudeCorrectionMinutes,
        equationOfTimeMinutes
    };
}
