"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTuanPalaces = getTuanPalaces;
exports.getTrietPalaces = getTrietPalaces;
exports.buildTuviChart = buildTuviChart;
const constants_1 = require("./constants");
const core_1 = require("./core");
const fortune_1 = require("./fortune");
const interpreter_1 = require("./interpreter");
const nayin_1 = require("./nayin");
const profiles_1 = require("./profiles");
const stars_1 = require("./stars");

function getTuanPalaces(yearStem, yearBranch) {
    const end = (0, core_1.movePalace)(yearBranch, 10 - yearStem);
    const first = (0, core_1.movePalace)(end, 1);
    return [first, (0, core_1.movePalace)(first, 1)];
}

function getTrietPalaces(yearStem) {
    if ([1, 6].includes(yearStem))
        return [9, 10];
    if ([2, 7].includes(yearStem))
        return [7, 8];
    if ([3, 8].includes(yearStem))
        return [5, 6];
    if ([4, 9].includes(yearStem))
        return [3, 4];
    return [1, 2];
}

function buildPalaces(params) {
    const { normalized, input, lifePalace, bodyPalace, bureauNumber, stars, annualStars, monthlyStars, dailyStars, hourlyStars } = params;
    const direction = (0, fortune_1.getFortuneDirection)(normalized.yearStem, input.gender);
    const [tuanA, tuanB] = getTuanPalaces(normalized.yearStem, normalized.yearBranch);
    const [trietA, trietB] = getTrietPalaces(normalized.yearStem);
    return Array.from({ length: 12 }, (_, index) => {
        const id = index + 1;
        const palaceOffset = ((id - lifePalace) % 12 + 12) % 12;
        const name = constants_1.PALACE_NAMES[palaceOffset];
        const decadeOffset = direction === 1 ? palaceOffset : (12 - palaceOffset) % 12;
        const decadeStart = bureauNumber + decadeOffset * 10;
        return {
            id,
            branch: constants_1.BRANCHES[id],
            element: constants_1.BRANCH_ELEMENTS[id],
            name,
            isBody: id === bodyPalace,
            stars: stars.filter((item) => item.palace === id),
            annualStars: annualStars.filter((item) => item.palace === id),
            monthlyStars: monthlyStars.filter((item) => item.palace === id),
            dailyStars: dailyStars.filter((item) => item.palace === id),
            hourlyStars: hourlyStars.filter((item) => item.palace === id),
            decadeStart,
            decadeEnd: decadeStart + 9,
            hasTuan: id === tuanA || id === tuanB,
            hasTriet: id === trietA || id === trietB
        };
    });
}

function countGroups(stars, prefix) {
    return {
        supportive: stars.filter((item) => item.group === `${prefix}-support`).length,
        challenging: stars.filter((item) => item.group === `${prefix}-malefic`).length,
        cycle: stars.filter((item) => item.group === `${prefix}-cycle`).length
    };
}

function buildTuviChart(input, normalized) {
    const profile = (0, profiles_1.getCalculationProfile)(input.calculationProfileId);
    const lifePalace = (0, core_1.getLifePalace)(normalized.lunar.month, normalized.hourBranch);
    const bodyPalace = (0, core_1.getBodyPalace)(normalized.lunar.month, normalized.hourBranch);
    const bureau = (0, nayin_1.getBureau)(lifePalace, normalized.yearStem);
    const birthElement = (0, nayin_1.getNayinElement)(normalized.yearStem, normalized.yearBranch);
    const major = (0, stars_1.placeMajorStars)(bureau.number, normalized.lunar.day);
    const support = (0, stars_1.placeSupportingStars)({
        yearStem: normalized.yearStem,
        yearBranch: normalized.yearBranch,
        lunarMonth: normalized.lunar.month,
        lunarDay: normalized.lunar.day,
        hourBranch: normalized.hourBranch,
        gender: input.gender,
        bureauNumber: bureau.number,
        lifeCycleMode: profile.lifeCycleMode,
        lifePalace,
        bodyPalace
    });
    const transforms = (0, stars_1.placeFourTransformations)(normalized.yearStem, [...major, ...support]);
    const stars = [...major, ...support, ...transforms];
    const viewYearStem = (0, core_1.getYearStem)(input.viewYear);
    const viewYearBranch = (0, core_1.getYearBranch)(input.viewYear);
    const annualStars = (0, fortune_1.placeAnnualMovingStars)(viewYearStem, viewYearBranch, stars);
    const leapFortune = (0, fortune_1.resolveLeapFortuneMoment)(input.viewMonth, input.viewDay, Boolean(input.viewLeap), input.leapFortuneMode || profile.leapFortuneMode);
    const effectiveYearStem = input.viewLeap && leapFortune.shifted && input.viewMonth === 12 ? (0, core_1.getYearStem)(input.viewYear + 1) : viewYearStem;
    const monthlyPalaceId = (0, fortune_1.getMonthlyFortunePalace)(viewYearBranch, normalized.lunar.month, normalized.hourBranch, leapFortune.month);
    const monthStem = (0, fortune_1.getMonthStem)(effectiveYearStem, leapFortune.month);
    const monthBranch = (0, fortune_1.getMonthBranch)(leapFortune.month);
    const monthlyStars = (0, fortune_1.placeMonthlyMovingStars)(monthStem, monthlyPalaceId, stars);
    const dailyPalaceId = (0, fortune_1.getDailyFortunePalace)(monthlyPalaceId, leapFortune.day);
    const dailyStars = (0, fortune_1.placeDailyMovingStars)(input.viewDayStem, dailyPalaceId, stars);
    const hourlyPalaceId = (0, fortune_1.getHourlyFortunePalace)(dailyPalaceId, input.viewHourBranch);
    const viewHourStem = (0, fortune_1.getHourStem)(input.viewDayStem, input.viewHourBranch);
    const hourlyStars = (0, fortune_1.placeHourlyMovingStars)(viewHourStem, hourlyPalaceId, stars);
    const palaces = buildPalaces({ normalized, input, lifePalace, bodyPalace, bureauNumber: bureau.number, stars, annualStars, monthlyStars, dailyStars, hourlyStars });
    const nominalAge = input.viewYear - normalized.lunar.year + 1;
    const activeDecade = palaces.find((palace) => nominalAge >= palace.decadeStart && nominalAge <= palace.decadeEnd) || null;
    const fortuneDirection = (0, fortune_1.getFortuneDirection)(normalized.yearStem, input.gender);
    const annualDecadePalaceId = activeDecade
        ? (0, fortune_1.getAnnualDecadePalace)(activeDecade.id, activeDecade.decadeStart, nominalAge, fortuneDirection)
        : null;
    const minorFortunePalaceId = (0, fortune_1.getMinorFortunePalace)(normalized.yearBranch, viewYearBranch, input.gender);
    const annualDecadePalace = annualDecadePalaceId ? palaces.find((palace) => palace.id === annualDecadePalaceId) : null;
    const minorFortunePalace = palaces.find((palace) => palace.id === minorFortunePalaceId);
    const yearBranchPalace = palaces.find((palace) => palace.id === viewYearBranch);
    const monthlyPalace = palaces.find((palace) => palace.id === monthlyPalaceId);
    const dailyPalace = palaces.find((palace) => palace.id === dailyPalaceId);
    const hourlyPalace = palaces.find((palace) => palace.id === hourlyPalaceId);
    const lifeStars = palaces.find((palace) => palace.id === lifePalace)?.stars || [];
    const analysis = {
        nominalAge,
        birthElement,
        viewYearCanChi: (0, core_1.getYearCanChi)(input.viewYear),
        viewYearStem,
        viewYearBranch,
        viewMonth: input.viewMonth,
        monthStem,
        monthBranch,
        monthCanChi: (0, fortune_1.getMonthCanChi)(effectiveYearStem, leapFortune.month),
        viewLeap: Boolean(input.viewLeap),
        leapFortuneMode: input.leapFortuneMode || profile.leapFortuneMode,
        effectiveViewMonth: leapFortune.month,
        effectiveViewDay: leapFortune.day,
        monthlyPalaceId,
        monthlyLabel: `Tháng ${input.viewMonth}${input.viewLeap ? " nhuận" : ""} âm lịch tại cung ${monthlyPalace.name} ở ${monthlyPalace.branch}`,
        viewDay: input.viewDay,
        viewDayStem: input.viewDayStem,
        viewDayBranch: input.viewDayBranch,
        viewDayCanChi: input.viewDayCanChi,
        viewSolarDate: input.viewSolarDate,
        dailyPalaceId,
        dailyLabel: `Ngày ${input.viewDay} âm lịch tại cung ${dailyPalace.name} ở ${dailyPalace.branch}`,
        viewHourBranch: input.viewHourBranch,
        viewHourStem,
        viewHourCanChi: (0, fortune_1.getHourCanChi)(input.viewDayStem, input.viewHourBranch),
        hourlyPalaceId,
        hourlyLabel: `Giờ ${constants_1.BRANCHES[input.viewHourBranch]} tại cung ${hourlyPalace.name} ở ${hourlyPalace.branch}`,
        activeDecadePalaceId: activeDecade?.id || null,
        activeDecadeLabel: activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "Ngoài dải đại vận",
        annualDecadePalaceId,
        annualDecadeLabel: annualDecadePalace ? `${annualDecadePalace.name} tại ${annualDecadePalace.branch}` : "Chưa xác định",
        minorFortunePalaceId,
        minorFortuneLabel: `${minorFortunePalace.name} tại ${minorFortunePalace.branch}`,
        yearBranchPalaceId: viewYearBranch,
        yearBranchPalaceLabel: `${yearBranchPalace.name} tại ${yearBranchPalace.branch}`,
        supportiveCountAtLife: lifeStars.filter((item) => item.group === "support" || item.group === "transform").length,
        maleficCountAtLife: lifeStars.filter((item) => item.group === "malefic").length,
        annualStarCounts: countGroups(annualStars, "annual"),
        monthlyStarCounts: countGroups(monthlyStars, "monthly"),
        dailyStarCounts: countGroups(dailyStars, "daily"),
        hourlyStarCounts: countGroups(hourlyStars, "hourly"),
        annualFocusPalaceIds: Array.from(new Set([activeDecade?.id, annualDecadePalaceId, minorFortunePalaceId, viewYearBranch, monthlyPalaceId, dailyPalaceId, hourlyPalaceId].filter(Boolean)))
    };
    const publicInput = {
        fullName: input.fullName,
        gender: input.gender,
        calendarType: input.calendarType,
        lunarLeap: input.lunarLeap,
        timezone: input.timezone,
        viewYear: input.viewYear,
        viewMonth: input.viewMonth,
        viewLeap: Boolean(input.viewLeap),
        leapFortuneMode: input.leapFortuneMode || profile.leapFortuneMode,
        viewDay: input.viewDay,
        viewHourBranch: input.viewHourBranch,
        timePrecision: input.timePrecision || "exact",
        birthHourBranch: normalized.hourBranch,
        calculationMethod: profile.name
    };
    return {
        input: publicInput,
        normalized,
        lifePalace,
        bodyPalace,
        bureau,
        birthElement,
        palaces,
        annualStars,
        monthlyStars,
        dailyStars,
        hourlyStars,
        analysis,
        interpretations: (0, interpreter_1.buildInterpretations)({
            palaces,
            stars,
            annualStars,
            monthlyStars,
            dailyStars,
            hourlyStars,
            lifePalace,
            bodyPalace,
            nominalAge,
            birthElement,
            bureauElement: bureau.element,
            bureauLabel: bureau.label,
            activeDecadePalaceId: activeDecade?.id || null,
            annualDecadePalaceId,
            minorFortunePalaceId,
            yearBranchPalaceId: viewYearBranch,
            monthlyPalaceId,
            dailyPalaceId,
            hourlyPalaceId,
            viewYear: input.viewYear,
            viewYearCanChi: analysis.viewYearCanChi,
            viewMonth: input.viewMonth,
            viewLeap: Boolean(input.viewLeap),
            monthCanChi: analysis.monthCanChi,
            viewDay: input.viewDay,
            viewDayCanChi: input.viewDayCanChi,
            viewHourBranch: input.viewHourBranch,
            viewHourCanChi: analysis.viewHourCanChi
        })
    };
}
