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

const VIEW_SCOPES = new Set(["natal_overview", "yearly", "single_month", "all_months"]);

function monthlyPart(params) {
    const { month, isLeap, sampleDay, viewYear, viewYearStem, viewYearBranch, normalized, profile, stars } = params;
    const leapFortune = (0, fortune_1.resolveLeapFortuneMoment)(month, sampleDay, isLeap, profile.leapFortuneMode);
    const effectiveYearStem = isLeap && leapFortune.shifted && month === 12
        ? (0, core_1.getYearStem)(viewYear + 1)
        : viewYearStem;
    const palaceId = (0, fortune_1.getMonthlyFortunePalace)(viewYearBranch, normalized.lunar.month, normalized.hourBranch, leapFortune.month);
    const monthStem = (0, fortune_1.getMonthStem)(effectiveYearStem, leapFortune.month);
    return {
        phase: isLeap && profile.leapFortuneMode === "split-half-next"
            ? (sampleDay <= 15 ? "Nửa đầu tháng" : "Nửa sau tháng")
            : "Cả tháng",
        effectiveMonth: leapFortune.month,
        palaceId,
        monthStem,
        monthBranch: (0, fortune_1.getMonthBranch)(leapFortune.month),
        monthCanChi: (0, fortune_1.getMonthCanChi)(effectiveYearStem, leapFortune.month),
        stars: (0, fortune_1.placeMonthlyMovingStars)(monthStem, palaceId, stars)
    };
}

function buildMonthlyFortunes(params) {
    const { input, viewScope, viewYearStem, viewYearBranch, normalized, profile, stars } = params;
    if (!viewYearStem || !["single_month", "all_months"].includes(viewScope))
        return [];
    const selections = [];
    if (viewScope === "single_month") {
        selections.push({ month: input.viewMonth, isLeap: Boolean(input.viewLeap) });
    }
    else {
        for (let month = 1; month <= 12; month += 1) {
            selections.push({ month, isLeap: false });
            if (input.viewLeapMonth === month)
                selections.push({ month, isLeap: true });
        }
    }
    return selections.map(({ month, isLeap }) => {
        const sampleDays = isLeap && profile.leapFortuneMode === "split-half-next" ? [1, 16] : [1];
        return {
            month,
            isLeap,
            label: `Tháng ${month}${isLeap ? " nhuận" : ""}`,
            parts: sampleDays.map((sampleDay) => monthlyPart({
                month,
                isLeap,
                sampleDay,
                viewYear: input.viewYear,
                viewYearStem,
                viewYearBranch,
                normalized,
                profile,
                stars
            }))
        };
    });
}

function buildTuviChart(input, normalized) {
    const profile = (0, profiles_1.getCalculationProfile)(input.calculationProfileId);
    const explicitScope = input.viewScope !== undefined && input.viewScope !== null;
    const viewScope = explicitScope ? input.viewScope : "legacy";
    if (explicitScope && !VIEW_SCOPES.has(viewScope))
        throw new Error("Phạm vi luận giải không hợp lệ.");
    const hasYear = !explicitScope || viewScope !== "natal_overview";
    const hasSingleMonth = !explicitScope || viewScope === "single_month";
    if (hasYear && (!Number.isInteger(input.viewYear) || input.viewYear < 1900 || input.viewYear > 2199))
        throw new Error("Năm muốn xem phải nằm trong khoảng 1900 đến 2199.");
    if (explicitScope && hasSingleMonth && (!Number.isInteger(input.viewMonth) || input.viewMonth < 1 || input.viewMonth > 12))
        throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    if (explicitScope && input.viewLeap && input.viewLeapMonth !== input.viewMonth)
        throw new Error("Tháng được chọn không phải tháng nhuận của năm âm lịch này.");
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
    const viewYearStem = hasYear ? (0, core_1.getYearStem)(input.viewYear) : null;
    const viewYearBranch = hasYear ? (0, core_1.getYearBranch)(input.viewYear) : null;
    const annualStars = hasYear ? (0, fortune_1.placeAnnualMovingStars)(viewYearStem, viewYearBranch, stars) : [];
    let monthlyFortunes = [];
    let monthlyStars = [];
    let monthlyPalaceId = null;
    let monthStem = null;
    let monthBranch = null;
    let monthCanChi = null;
    let leapFortune = null;
    if (explicitScope) {
        monthlyFortunes = buildMonthlyFortunes({ input, viewScope, viewYearStem, viewYearBranch, normalized, profile, stars });
        if (viewScope === "single_month" && monthlyFortunes.length) {
            const selected = monthlyFortunes[0];
            monthlyStars = selected.parts.flatMap((part) => part.stars);
            monthlyPalaceId = selected.parts.length === 1 ? selected.parts[0].palaceId : null;
            monthStem = selected.parts[0].monthStem;
            monthBranch = selected.parts[0].monthBranch;
            monthCanChi = selected.parts.map((part) => part.monthCanChi).filter((value, index, list) => list.indexOf(value) === index).join(" / ");
        }
    }
    else {
        leapFortune = (0, fortune_1.resolveLeapFortuneMoment)(input.viewMonth, input.viewDay, Boolean(input.viewLeap), input.leapFortuneMode || profile.leapFortuneMode);
        const effectiveYearStem = input.viewLeap && leapFortune.shifted && input.viewMonth === 12 ? (0, core_1.getYearStem)(input.viewYear + 1) : viewYearStem;
        monthlyPalaceId = (0, fortune_1.getMonthlyFortunePalace)(viewYearBranch, normalized.lunar.month, normalized.hourBranch, leapFortune.month);
        monthStem = (0, fortune_1.getMonthStem)(effectiveYearStem, leapFortune.month);
        monthBranch = (0, fortune_1.getMonthBranch)(leapFortune.month);
        monthCanChi = (0, fortune_1.getMonthCanChi)(effectiveYearStem, leapFortune.month);
        monthlyStars = (0, fortune_1.placeMonthlyMovingStars)(monthStem, monthlyPalaceId, stars);
    }
    const hasLegacyDayHour = !explicitScope;
    const dailyPalaceId = hasLegacyDayHour ? (0, fortune_1.getDailyFortunePalace)(monthlyPalaceId, leapFortune.day) : null;
    const dailyStars = hasLegacyDayHour ? (0, fortune_1.placeDailyMovingStars)(input.viewDayStem, dailyPalaceId, stars) : [];
    const hourlyPalaceId = hasLegacyDayHour ? (0, fortune_1.getHourlyFortunePalace)(dailyPalaceId, input.viewHourBranch) : null;
    const viewHourStem = hasLegacyDayHour ? (0, fortune_1.getHourStem)(input.viewDayStem, input.viewHourBranch) : null;
    const hourlyStars = hasLegacyDayHour ? (0, fortune_1.placeHourlyMovingStars)(viewHourStem, hourlyPalaceId, stars) : [];
    const palaces = buildPalaces({ normalized, input, lifePalace, bodyPalace, bureauNumber: bureau.number, stars, annualStars, monthlyStars, dailyStars, hourlyStars });
    const nominalAge = hasYear ? input.viewYear - normalized.lunar.year + 1 : null;
    const activeDecade = palaces.find((palace) => nominalAge >= palace.decadeStart && nominalAge <= palace.decadeEnd) || null;
    const fortuneDirection = (0, fortune_1.getFortuneDirection)(normalized.yearStem, input.gender);
    const annualDecadePalaceId = activeDecade
        ? (0, fortune_1.getAnnualDecadePalace)(activeDecade.id, activeDecade.decadeStart, nominalAge, fortuneDirection)
        : null;
    const minorFortunePalaceId = hasYear ? (0, fortune_1.getMinorFortunePalace)(normalized.yearBranch, viewYearBranch, input.gender) : null;
    const annualDecadePalace = annualDecadePalaceId ? palaces.find((palace) => palace.id === annualDecadePalaceId) : null;
    const minorFortunePalace = minorFortunePalaceId ? palaces.find((palace) => palace.id === minorFortunePalaceId) : null;
    const yearBranchPalace = viewYearBranch ? palaces.find((palace) => palace.id === viewYearBranch) : null;
    const monthlyPalace = monthlyPalaceId ? palaces.find((palace) => palace.id === monthlyPalaceId) : null;
    const dailyPalace = dailyPalaceId ? palaces.find((palace) => palace.id === dailyPalaceId) : null;
    const hourlyPalace = hourlyPalaceId ? palaces.find((palace) => palace.id === hourlyPalaceId) : null;
    const lifeStars = palaces.find((palace) => palace.id === lifePalace)?.stars || [];
    const analysis = {
        nominalAge,
        birthElement,
        viewScope: explicitScope ? viewScope : null,
        viewYearCanChi: hasYear ? (0, core_1.getYearCanChi)(input.viewYear) : null,
        viewYearStem,
        viewYearBranch,
        viewMonth: input.viewMonth,
        monthStem,
        monthBranch,
        monthCanChi,
        viewLeap: Boolean(input.viewLeap),
        leapFortuneMode: input.leapFortuneMode || profile.leapFortuneMode,
        effectiveViewMonth: leapFortune?.month || null,
        effectiveViewDay: leapFortune?.day || null,
        monthlyPalaceId,
        monthlyFortunes,
        monthlyLabel: monthlyFortunes.length === 1
            ? `${monthlyFortunes[0].label} âm lịch: ${monthlyFortunes[0].parts.map((part) => `${part.phase.toLowerCase()} tại cung ${palaces.find((palace) => palace.id === part.palaceId).name} ở ${palaces.find((palace) => palace.id === part.palaceId).branch}`).join(", ")}`
            : (monthlyPalace ? `Tháng ${input.viewMonth}${input.viewLeap ? " nhuận" : ""} âm lịch tại cung ${monthlyPalace.name} ở ${monthlyPalace.branch}` : null),
        viewDay: hasLegacyDayHour ? input.viewDay : null,
        viewDayStem: hasLegacyDayHour ? input.viewDayStem : null,
        viewDayBranch: hasLegacyDayHour ? input.viewDayBranch : null,
        viewDayCanChi: hasLegacyDayHour ? input.viewDayCanChi : null,
        viewSolarDate: hasLegacyDayHour ? input.viewSolarDate : null,
        dailyPalaceId,
        dailyLabel: dailyPalace ? `Ngày ${input.viewDay} âm lịch tại cung ${dailyPalace.name} ở ${dailyPalace.branch}` : null,
        viewHourBranch: hasLegacyDayHour ? input.viewHourBranch : null,
        viewHourStem,
        viewHourCanChi: hasLegacyDayHour ? (0, fortune_1.getHourCanChi)(input.viewDayStem, input.viewHourBranch) : null,
        hourlyPalaceId,
        hourlyLabel: hourlyPalace ? `Giờ ${constants_1.BRANCHES[input.viewHourBranch]} tại cung ${hourlyPalace.name} ở ${hourlyPalace.branch}` : null,
        activeDecadePalaceId: activeDecade?.id || null,
        activeDecadeLabel: activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : (hasYear ? "Ngoài dải đại vận" : null),
        annualDecadePalaceId,
        annualDecadeLabel: annualDecadePalace ? `${annualDecadePalace.name} tại ${annualDecadePalace.branch}` : null,
        minorFortunePalaceId,
        minorFortuneLabel: minorFortunePalace ? `${minorFortunePalace.name} tại ${minorFortunePalace.branch}` : null,
        yearBranchPalaceId: viewYearBranch,
        yearBranchPalaceLabel: yearBranchPalace ? `${yearBranchPalace.name} tại ${yearBranchPalace.branch}` : null,
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
        ...(explicitScope ? { viewScope } : {}),
        ...(hasYear ? { viewYear: input.viewYear } : {}),
        ...(hasSingleMonth ? { viewMonth: input.viewMonth, viewLeap: Boolean(input.viewLeap) } : {}),
        ...(explicitScope && viewScope === "all_months" ? { viewLeapMonth: input.viewLeapMonth || null } : {}),
        ...(!explicitScope ? {
            viewMonth: input.viewMonth,
            viewLeap: Boolean(input.viewLeap),
            leapFortuneMode: input.leapFortuneMode || profile.leapFortuneMode,
            viewDay: input.viewDay,
            viewHourBranch: input.viewHourBranch
        } : {}),
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
        monthlyFortunes,
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
            viewScope: explicitScope ? viewScope : "legacy",
            monthlyFortunes,
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
            viewYear: hasYear ? input.viewYear : null,
            viewYearCanChi: analysis.viewYearCanChi,
            viewMonth: input.viewMonth,
            viewLeap: Boolean(input.viewLeap),
            monthCanChi: analysis.monthCanChi,
            viewDay: hasLegacyDayHour ? input.viewDay : null,
            viewDayCanChi: hasLegacyDayHour ? input.viewDayCanChi : null,
            viewHourBranch: hasLegacyDayHour ? input.viewHourBranch : null,
            viewHourCanChi: analysis.viewHourCanChi
        })
    };
}
