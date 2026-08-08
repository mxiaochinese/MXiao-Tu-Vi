"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFortuneDirection = getFortuneDirection;
exports.getAnnualDecadePalace = getAnnualDecadePalace;
exports.getMinorFortuneStartPalace = getMinorFortuneStartPalace;
exports.getMinorFortunePalace = getMinorFortunePalace;
exports.placeAnnualMovingStars = placeAnnualMovingStars;
exports.getAnnualDouJunPalace = getAnnualDouJunPalace;
exports.getMonthlyFortunePalace = getMonthlyFortunePalace;
exports.resolveLeapFortuneMoment = resolveLeapFortuneMoment;
exports.getDailyFortunePalace = getDailyFortunePalace;
exports.getHourlyFortunePalace = getHourlyFortunePalace;
exports.getMonthStem = getMonthStem;
exports.getMonthBranch = getMonthBranch;
exports.getMonthCanChi = getMonthCanChi;
exports.getHourStem = getHourStem;
exports.getHourCanChi = getHourCanChi;
exports.placeMonthlyMovingStars = placeMonthlyMovingStars;
exports.placeDailyMovingStars = placeDailyMovingStars;
exports.placeHourlyMovingStars = placeHourlyMovingStars;
exports.getElementRelation = getElementRelation;
const constants_1 = require("./constants");
const core_1 = require("./core");
const stars_1 = require("./stars");

function getFortuneDirection(yearStem, gender) {
    return (gender === "male" ? 1 : -1) * constants_1.STEM_YANG_YIN[yearStem];
}

function getAnnualDecadePalace(rootPalace, decadeStartAge, nominalAge, direction) {
    const yearIndex = nominalAge - decadeStartAge;
    if (yearIndex < 0 || yearIndex > 9)
        return null;
    if (yearIndex === 0)
        return rootPalace;
    const opposite = (0, core_1.movePalace)(rootPalace, 6);
    if (yearIndex === 1)
        return opposite;
    if (yearIndex === 2)
        return (0, core_1.movePalace)(opposite, -direction);
    return (0, core_1.movePalace)(opposite, (yearIndex - 3) * direction);
}

function getMinorFortuneStartPalace(birthYearBranch) {
    if ([3, 7, 11].includes(birthYearBranch))
        return 5;
    if ([9, 1, 5].includes(birthYearBranch))
        return 11;
    if ([6, 10, 2].includes(birthYearBranch))
        return 8;
    if ([12, 4, 8].includes(birthYearBranch))
        return 2;
    throw new Error("Không xác định được cung khởi tiểu hạn.");
}

function getMinorFortunePalace(birthYearBranch, viewYearBranch, gender) {
    const start = getMinorFortuneStartPalace(birthYearBranch);
    const branchOffset = ((viewYearBranch - birthYearBranch) % 12 + 12) % 12;
    const direction = gender === "male" ? 1 : -1;
    return (0, core_1.movePalace)(start, branchOffset * direction);
}

function movingStar(id, name, group, palace) {
    return { id, name, group, palace };
}

function getGroupStar(yearBranch, mapping) {
    const key = Object.keys(mapping).find((item) => item.split(",").map(Number).includes(yearBranch));
    if (!key)
        throw new Error("Không xác định được sao lưu theo nhóm Địa Chi.");
    return mapping[key];
}

function getKhoiViet(stem) {
    if ([1, 5].includes(stem))
        return [2, 8];
    if ([2, 6].includes(stem))
        return [1, 9];
    if ([7, 8].includes(stem))
        return [7, 3];
    if ([3, 4].includes(stem))
        return [12, 10];
    return [4, 6];
}

function placeAnnualMovingStars(viewYearStem, viewYearBranch, natalStars) {
    const locTon = constants_1.STEM_LOC_TON_PALACE[viewYearStem];
    const annual = [
        movingStar("luu-thai-tue", "Lưu Thái Tuế", "annual-cycle", viewYearBranch),
        movingStar("luu-tang-mon", "Lưu Tang Môn", "annual-malefic", (0, core_1.movePalace)(viewYearBranch, 2)),
        movingStar("luu-bach-ho", "Lưu Bạch Hổ", "annual-malefic", (0, core_1.movePalace)(viewYearBranch, 8)),
        movingStar("luu-thien-khoc", "Lưu Thiên Khốc", "annual-malefic", (0, core_1.movePalace)(7, -(viewYearBranch - 1))),
        movingStar("luu-thien-hu", "Lưu Thiên Hư", "annual-malefic", (0, core_1.movePalace)(7, viewYearBranch - 1)),
        movingStar("luu-loc-ton", "Lưu Lộc Tồn", "annual-support", locTon),
        movingStar("luu-kinh-duong", "Lưu Kình Dương", "annual-malefic", (0, core_1.movePalace)(locTon, 1)),
        movingStar("luu-da-la", "Lưu Đà La", "annual-malefic", (0, core_1.movePalace)(locTon, -1)),
        movingStar("luu-thien-ma", "Lưu Thiên Mã", "annual-support", getGroupStar(viewYearBranch, {
            "2,6,10": 12,
            "1,5,9": 3,
            "4,8,12": 6,
            "3,7,11": 9
        }))
    ];
    const names = ["Lưu Hóa Lộc", "Lưu Hóa Quyền", "Lưu Hóa Khoa", "Lưu Hóa Kỵ"];
    const sourceIds = stars_1.FOUR_TRANSFORMATIONS_TABLE[viewYearStem];
    sourceIds.forEach((sourceId, index) => {
        const source = natalStars.find((item) => item.id === sourceId);
        if (source)
            annual.push(movingStar(`luu-hoa-${index}`, names[index], index === 3 ? "annual-malefic" : "annual-support", source.palace));
    });
    return annual;
}

function getAnnualDouJunPalace(viewYearBranch, birthLunarMonth, birthHourBranch) {
    if (!Number.isInteger(birthLunarMonth) || birthLunarMonth < 1 || birthLunarMonth > 12)
        throw new Error("Tháng sinh âm lịch phải từ 1 đến 12.");
    if (!Number.isInteger(birthHourBranch) || birthHourBranch < 1 || birthHourBranch > 12)
        throw new Error("Giờ sinh theo Địa Chi phải từ 1 đến 12.");
    return (0, core_1.movePalace)(viewYearBranch, -(birthLunarMonth - 1), birthHourBranch - 1);
}

function resolveLeapFortuneMoment(viewMonth, viewDay, isLeapMonth, mode = "split-half-next") {
    if (!Number.isInteger(viewMonth) || viewMonth < 1 || viewMonth > 12)
        throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    if (!Number.isInteger(viewDay) || viewDay < 1 || viewDay > 30)
        throw new Error("Ngày âm lịch muốn xem phải từ 1 đến 30.");
    if (!isLeapMonth || mode === "repeat-current")
        return { month: viewMonth, day: viewDay, shifted: false };
    if (mode !== "split-half-next")
        throw new Error("Cách tính tháng nhuận không hợp lệ.");
    if (viewDay <= 15)
        return { month: viewMonth, day: viewDay, shifted: false };
    return { month: viewMonth === 12 ? 1 : viewMonth + 1, day: viewDay - 15, shifted: true };
}

function getMonthlyFortunePalace(viewYearBranch, birthLunarMonth, birthHourBranch, viewMonth) {
    if (!Number.isInteger(viewMonth) || viewMonth < 1 || viewMonth > 12)
        throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    return (0, core_1.movePalace)(getAnnualDouJunPalace(viewYearBranch, birthLunarMonth, birthHourBranch), viewMonth - 1);
}

function getDailyFortunePalace(monthlyPalaceId, viewDay) {
    if (!Number.isInteger(viewDay) || viewDay < 1 || viewDay > 30)
        throw new Error("Ngày âm lịch muốn xem phải từ 1 đến 30.");
    return (0, core_1.movePalace)(monthlyPalaceId, viewDay - 1);
}

function getHourlyFortunePalace(dailyPalaceId, viewHourBranch) {
    if (!Number.isInteger(viewHourBranch) || viewHourBranch < 1 || viewHourBranch > 12)
        throw new Error("Khung giờ muốn xem phải từ 1 đến 12.");
    return (0, core_1.movePalace)(dailyPalaceId, viewHourBranch - 1);
}

function getMonthStem(viewYearStem, viewMonth) {
    if (!Number.isInteger(viewMonth) || viewMonth < 1 || viewMonth > 12)
        throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    const firstMonthStem = { 1: 3, 6: 3, 2: 5, 7: 5, 3: 7, 8: 7, 4: 9, 9: 9, 5: 1, 10: 1 }[viewYearStem];
    if (!firstMonthStem)
        throw new Error("Không xác định được Thiên Can tháng.");
    return ((firstMonthStem + viewMonth - 2) % 10) + 1;
}

function getMonthBranch(viewMonth) {
    if (!Number.isInteger(viewMonth) || viewMonth < 1 || viewMonth > 12)
        throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    return (0, core_1.movePalace)(3, viewMonth - 1);
}

function getMonthCanChi(viewYearStem, viewMonth) {
    return `${constants_1.STEMS[getMonthStem(viewYearStem, viewMonth)]} ${constants_1.BRANCHES[getMonthBranch(viewMonth)]}`;
}

function getHourStem(dayStem, hourBranch) {
    if (!Number.isInteger(dayStem) || dayStem < 1 || dayStem > 10)
        throw new Error("Thiên Can ngày không hợp lệ.");
    if (!Number.isInteger(hourBranch) || hourBranch < 1 || hourBranch > 12)
        throw new Error("Giờ theo Địa Chi không hợp lệ.");
    const firstHourStem = { 1: 1, 6: 1, 2: 3, 7: 3, 3: 5, 8: 5, 4: 7, 9: 7, 5: 9, 10: 9 }[dayStem];
    return ((firstHourStem + hourBranch - 2) % 10) + 1;
}

function getHourCanChi(dayStem, hourBranch) {
    return `${constants_1.STEMS[getHourStem(dayStem, hourBranch)]} ${constants_1.BRANCHES[hourBranch]}`;
}

function placeStemMovingStars(stem, focusPalaceId, natalStars, config) {
    const locTon = constants_1.STEM_LOC_TON_PALACE[stem];
    const [khoi, viet] = getKhoiViet(stem);
    const list = [
        movingStar(`${config.id}-menh`, config.focusName, `${config.group}-cycle`, focusPalaceId),
        movingStar(`${config.id}-loc-ton`, `${config.label} Lộc Tồn`, `${config.group}-support`, locTon),
        movingStar(`${config.id}-kinh-duong`, `${config.label} Kình Dương`, `${config.group}-malefic`, (0, core_1.movePalace)(locTon, 1)),
        movingStar(`${config.id}-da-la`, `${config.label} Đà La`, `${config.group}-malefic`, (0, core_1.movePalace)(locTon, -1)),
        movingStar(`${config.id}-thien-khoi`, `${config.label} Thiên Khôi`, `${config.group}-support`, khoi),
        movingStar(`${config.id}-thien-viet`, `${config.label} Thiên Việt`, `${config.group}-support`, viet)
    ];
    const names = [`${config.label} Hóa Lộc`, `${config.label} Hóa Quyền`, `${config.label} Hóa Khoa`, `${config.label} Hóa Kỵ`];
    const sourceIds = stars_1.FOUR_TRANSFORMATIONS_TABLE[stem];
    sourceIds.forEach((sourceId, index) => {
        const source = natalStars.find((item) => item.id === sourceId);
        if (source)
            list.push(movingStar(`${config.id}-hoa-${index}`, names[index], index === 3 ? `${config.group}-malefic` : `${config.group}-support`, source.palace));
    });
    return list;
}

function placeMonthlyMovingStars(monthStem, monthlyPalaceId, natalStars) {
    return placeStemMovingStars(monthStem, monthlyPalaceId, natalStars, {
        id: "nguyet",
        label: "Nguyệt",
        focusName: "Lưu Nguyệt",
        group: "monthly"
    });
}

function placeDailyMovingStars(dayStem, dailyPalaceId, natalStars) {
    return placeStemMovingStars(dayStem, dailyPalaceId, natalStars, {
        id: "nhat",
        label: "Nhật",
        focusName: "Lưu Nhật",
        group: "daily"
    });
}

function placeHourlyMovingStars(hourStem, hourlyPalaceId, natalStars) {
    return placeStemMovingStars(hourStem, hourlyPalaceId, natalStars, {
        id: "thoi",
        label: "Thời",
        focusName: "Lưu Thời",
        group: "hourly"
    });
}

const GENERATES = { "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc" };
const CONTROLS = { "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc" };

function getElementRelation(source, target) {
    if (source === target)
        return { code: "same", label: "đồng hành", description: `${source} và ${target} đồng hành` };
    if (GENERATES[source] === target)
        return { code: "source-generates-target", label: "sinh xuất", description: `${source} sinh ${target}` };
    if (GENERATES[target] === source)
        return { code: "target-generates-source", label: "được sinh", description: `${target} sinh ${source}` };
    if (CONTROLS[source] === target)
        return { code: "source-controls-target", label: "khắc xuất", description: `${source} khắc ${target}` };
    if (CONTROLS[target] === source)
        return { code: "target-controls-source", label: "bị khắc", description: `${target} khắc ${source}` };
    return { code: "neutral", label: "trung tính", description: `${source} và ${target}` };
}
