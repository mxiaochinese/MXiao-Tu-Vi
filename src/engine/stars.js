"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOUR_TRANSFORMATIONS_TABLE = void 0;
exports.placeMajorStars = placeMajorStars;
exports.placeLifeCycle = placeLifeCycle;
exports.placeSupportingStars = placeSupportingStars;
exports.placeFourTransformations = placeFourTransformations;
exports.validateMajorStarCatalogue = validateMajorStarCatalogue;
const constants_1 = require("./constants");
const core_1 = require("./core");
const brightness_1 = require("./brightness");
function star(id, name, group, palace) {
    const brightness = (0, brightness_1.getStarBrightness)(id, palace);
    return {
        id,
        name,
        group,
        palace,
        brightness: brightness?.label,
        brightnessCode: brightness?.code
    };
}
function placeMajorStars(bureauNumber, lunarDay) {
    const tuVi = (0, core_1.findTuViPalace)(bureauNumber, lunarDay);
    const thienPhu = (0, core_1.movePalace)(3, 3 - tuVi);
    const placements = [
        ["tu-vi", "Tử Vi", tuVi],
        ["liem-trinh", "Liêm Trinh", (0, core_1.movePalace)(tuVi, 4)],
        ["thien-dong", "Thiên Đồng", (0, core_1.movePalace)(tuVi, 7)],
        ["vu-khuc", "Vũ Khúc", (0, core_1.movePalace)(tuVi, 8)],
        ["thai-duong", "Thái Dương", (0, core_1.movePalace)(tuVi, 9)],
        ["thien-co", "Thiên Cơ", (0, core_1.movePalace)(tuVi, 11)],
        ["thien-phu", "Thiên Phủ", thienPhu],
        ["thai-am", "Thái Âm", (0, core_1.movePalace)(thienPhu, 1)],
        ["tham-lang", "Tham Lang", (0, core_1.movePalace)(thienPhu, 2)],
        ["cu-mon", "Cự Môn", (0, core_1.movePalace)(thienPhu, 3)],
        ["thien-tuong", "Thiên Tướng", (0, core_1.movePalace)(thienPhu, 4)],
        ["thien-luong", "Thiên Lương", (0, core_1.movePalace)(thienPhu, 5)],
        ["that-sat", "Thất Sát", (0, core_1.movePalace)(thienPhu, 6)],
        ["pha-quan", "Phá Quân", (0, core_1.movePalace)(thienPhu, 10)]
    ];
    return placements.map(([id, name, palace]) => star(id, name, "major", palace));
}
function getDirection(yearStem, gender) {
    return ((gender === "male" ? 1 : -1) * constants_1.STEM_YANG_YIN[yearStem]);
}
function getLifeCycleStart(bureauNumber, direction, mode) {
    if (mode === "yin-alternate-start" && direction === -1) {
        const alternate = { 2: 1, 3: 4, 4: 10, 5: 1, 6: 7 };
        return alternate[bureauNumber];
    }
    const standard = { 2: 9, 3: 12, 4: 6, 5: 9, 6: 3 };
    return standard[bureauNumber];
}
function placeLifeCycle(params) {
    const direction = getDirection(params.yearStem, params.gender);
    const start = getLifeCycleStart(params.bureauNumber, direction, params.mode);
    const names = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
    const ruleId = params.mode === "yin-alternate-start" ? "AB-TRANGSINH-001" : "TB-TRANGSINH-001";
    return names.map((name, index) => star(`trang-sinh-${index}`, name, "cycle", (0, core_1.movePalace)(start, index * direction), ruleId));
}
function getKhoiViet(yearStem) {
    if ([1, 5].includes(yearStem))
        return [2, 8];
    if ([2, 6].includes(yearStem))
        return [1, 9];
    if ([7, 8].includes(yearStem))
        return [7, 3];
    if ([3, 4].includes(yearStem))
        return [12, 10];
    return [4, 6];
}
function getStemTableValue(yearStem, values) {
    const value = values[yearStem - 1];
    if (!value)
        throw new Error(`Không tìm thấy bảng Can cho ${yearStem}.`);
    return value;
}
function getHoaLinhStart(yearBranch) {
    if ([3, 7, 11].includes(yearBranch))
        return [2, 4];
    if ([1, 5, 9].includes(yearBranch))
        return [3, 11];
    if ([2, 6, 10].includes(yearBranch))
        return [4, 11];
    return [10, 11];
}
function getGroupStar(yearBranch, mapping) {
    const group = Object.keys(mapping).find((key) => key.split(",").map(Number).includes(yearBranch));
    if (!group)
        throw new Error(`Không tìm thấy nhóm địa chi cho ${yearBranch}.`);
    return mapping[group];
}
function placeSupportingStars(params) {
    const { yearStem, yearBranch, lunarMonth, lunarDay, hourBranch, gender, bureauNumber, lifeCycleMode, lifePalace, bodyPalace } = params;
    const result = [];
    const direction = getDirection(yearStem, gender);
    const locTon = constants_1.STEM_LOC_TON_PALACE[yearStem];
    result.push(star("loc-ton", "Lộc Tồn", "support", locTon));
    result.push(star("kinh-duong", "Kình Dương", "malefic", (0, core_1.movePalace)(locTon, 1)));
    result.push(star("da-la", "Đà La", "malefic", (0, core_1.movePalace)(locTon, -1)));
    const taPhu = (0, core_1.movePalace)(5, lunarMonth - 1);
    const huuBat = (0, core_1.movePalace)(11, -(lunarMonth - 1));
    result.push(star("ta-phu", "Tả Phù", "support", taPhu));
    result.push(star("huu-bat", "Hữu Bật", "support", huuBat));
    const vanKhuc = (0, core_1.movePalace)(5, hourBranch - 1);
    const vanXuong = (0, core_1.movePalace)(11, -(hourBranch - 1));
    result.push(star("van-khuc", "Văn Khúc", "support", vanKhuc));
    result.push(star("van-xuong", "Văn Xương", "support", vanXuong));
    result.push(star("tam-thai", "Tam Thai", "support", (0, core_1.movePalace)(taPhu, lunarDay - 1)));
    result.push(star("bat-toa", "Bát Tọa", "support", (0, core_1.movePalace)(huuBat, -(lunarDay - 1))));
    result.push(star("an-quang", "Ân Quang", "support", (0, core_1.movePalace)(vanXuong, lunarDay - 2)));
    result.push(star("thien-quy", "Thiên Quý", "support", (0, core_1.movePalace)(vanKhuc, -lunarDay + 2)));
    result.push(star("dia-kiep", "Địa Kiếp", "malefic", (0, core_1.movePalace)(12, hourBranch - 1)));
    result.push(star("dia-khong", "Địa Không", "malefic", (0, core_1.movePalace)(12, -(hourBranch - 1))));
    const [hoaStart, linhStart] = getHoaLinhStart(yearBranch);
    result.push(star("hoa-tinh", "Hỏa Tinh", "malefic", (0, core_1.movePalace)(hoaStart, (hourBranch - 1) * direction)));
    result.push(star("linh-tinh", "Linh Tinh", "malefic", (0, core_1.movePalace)(linhStart, -(hourBranch - 1) * direction)));
    const hongLoan = (0, core_1.movePalace)(4, -(yearBranch - 1));
    result.push(star("hong-loan", "Hồng Loan", "support", hongLoan));
    result.push(star("thien-hy", "Thiên Hỷ", "support", (0, core_1.movePalace)(hongLoan, 6)));
    result.push(star("long-tri", "Long Trì", "support", (0, core_1.movePalace)(5, yearBranch - 1)));
    result.push(star("phuong-cac", "Phượng Các", "support", (0, core_1.movePalace)(11, -(yearBranch - 1))));
    result.push(star("thien-khoc", "Thiên Khốc", "malefic", (0, core_1.movePalace)(7, -(yearBranch - 1))));
    result.push(star("thien-hu", "Thiên Hư", "malefic", (0, core_1.movePalace)(7, yearBranch - 1)));
    const [thienKhoi, thienViet] = getKhoiViet(yearStem);
    result.push(star("thien-khoi", "Thiên Khôi", "support", thienKhoi));
    result.push(star("thien-viet", "Thiên Việt", "support", thienViet));
    result.push(star("thien-duc", "Thiên Đức", "support", (0, core_1.movePalace)(10, yearBranch - 1)));
    result.push(star("nguyet-duc", "Nguyệt Đức", "support", (0, core_1.movePalace)(6, yearBranch - 1)));
    result.push(star("thien-hinh", "Thiên Hình", "malefic", (0, core_1.movePalace)(10, lunarMonth - 1)));
    result.push(star("thien-rieu", "Thiên Riêu", "malefic", (0, core_1.movePalace)(2, lunarMonth - 1)));
    result.push(star("thien-y", "Thiên Y", "support", (0, core_1.movePalace)(2, lunarMonth - 1)));
    const thienGiai = (0, core_1.movePalace)(9, lunarMonth - 1);
    const diaGiai = (0, core_1.movePalace)(8, lunarMonth - 1);
    result.push(star("thien-giai", "Thiên Giải", "support", thienGiai));
    result.push(star("dia-giai", "Địa Giải", "support", diaGiai));
    result.push(star("giai-than", "Giải Thần", "support", (0, core_1.movePalace)(11, -(yearBranch - 1))));
    result.push(star("thai-phu", "Thai Phụ", "support", (0, core_1.movePalace)(7, hourBranch - 1)));
    result.push(star("phong-cao", "Phong Cáo", "support", (0, core_1.movePalace)(3, hourBranch - 1)));
    result.push(star("thien-tai", "Thiên Tài", "support", (0, core_1.movePalace)(lifePalace, yearBranch - 1)));
    result.push(star("thien-tho", "Thiên Thọ", "support", (0, core_1.movePalace)(bodyPalace, yearBranch - 1)));
    result.push(star("thien-thuong", "Thiên Thương", "malefic", (0, core_1.movePalace)(lifePalace, 5)));
    result.push(star("thien-su", "Thiên Sứ", "malefic", (0, core_1.movePalace)(lifePalace, 7)));
    result.push(star("thien-quan", "Thiên Quan", "support", getStemTableValue(yearStem, [8, 5, 6, 3, 4, 10, 12, 10, 11, 7])));
    result.push(star("thien-phuc", "Thiên Phúc", "support", getStemTableValue(yearStem, [10, 9, 1, 12, 4, 3, 7, 6, 7, 6])));
    const coThan = getGroupStar(yearBranch, { "1,2,12": 3, "3,4,5": 6, "6,7,8": 9, "9,10,11": 12 });
    const quaTu = getGroupStar(yearBranch, { "1,2,12": 11, "3,4,5": 2, "6,7,8": 5, "9,10,11": 8 });
    result.push(star("co-than", "Cô Thần", "malefic", coThan));
    result.push(star("qua-tu", "Quả Tú", "malefic", quaTu));
    result.push(star("dao-hoa", "Đào Hoa", "support", getGroupStar(yearBranch, {
        "2,6,10": 7,
        "1,5,9": 10,
        "4,8,12": 1,
        "3,7,11": 4
    })));
    result.push(star("thien-ma", "Thiên Mã", "support", getGroupStar(yearBranch, {
        "2,6,10": 12,
        "1,5,9": 3,
        "4,8,12": 6,
        "3,7,11": 9
    })));
    result.push(star("kiep-sat", "Kiếp Sát", "malefic", getGroupStar(yearBranch, {
        "2,6,10": 3,
        "3,7,11": 12,
        "4,8,12": 9,
        "1,5,9": 6
    })));
    result.push(star("pha-toai", "Phá Toái", "malefic", getGroupStar(yearBranch, {
        "1,4,7,10": 6,
        "3,6,9,12": 10,
        "2,5,8,11": 2
    })));
    result.push(star("hoa-cai", "Hoa Cái", "support", getGroupStar(yearBranch, {
        "2,6,10": 2,
        "3,7,11": 11,
        "4,8,12": 8,
        "1,5,9": 5
    })));
    result.push(star("thien-la", "Thiên La", "malefic", 5));
    result.push(star("dia-vong", "Địa Võng", "malefic", 11));
    result.push(star("thien-khong", "Thiên Không", "malefic", (0, core_1.movePalace)(yearBranch, 1)));
    result.push(star("quoc-an", "Quốc Ấn", "support", (0, core_1.movePalace)(locTon, 8)));
    result.push(star("duong-phu", "Đường Phù", "support", (0, core_1.movePalace)(locTon, -7)));
    result.push(star("luu-ha", "Lưu Hà", "malefic", getStemTableValue(yearStem, [10, 11, 8, 5, 6, 7, 9, 4, 12, 3])));
    result.push(star("thien-tru", "Thiên Trù", "support", getStemTableValue(yearStem, [6, 7, 1, 6, 7, 9, 3, 7, 10, 11])));
    result.push(star("luu-nien-van-tinh", "Lưu Niên Văn Tinh", "support", getStemTableValue(yearStem, [6, 7, 9, 10, 9, 10, 12, 1, 3, 4])));
    result.push(star("dau-quan", "Đẩu Quân", "support", (0, core_1.movePalace)(yearBranch, -(lunarMonth - 1), hourBranch - 1)));
    const thaiTueNames = ["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"];
    thaiTueNames.forEach((name, index) => result.push(star(`thai-tue-${index}`, name, "cycle", (0, core_1.movePalace)(yearBranch, index))));
    const locTonCycle = ["Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"];
    locTonCycle.forEach((name, index) => result.push(star(`loc-ton-${index}`, name, "cycle", (0, core_1.movePalace)(locTon, index * direction))));
    result.push(...placeLifeCycle({ yearStem, gender, bureauNumber, mode: lifeCycleMode }));
    return result;
}
exports.FOUR_TRANSFORMATIONS_TABLE = {
    1: ["liem-trinh", "pha-quan", "vu-khuc", "thai-duong"],
    2: ["thien-co", "thien-luong", "tu-vi", "thai-am"],
    3: ["thien-dong", "thien-co", "van-xuong", "liem-trinh"],
    4: ["thai-am", "thien-dong", "thien-co", "cu-mon"],
    5: ["tham-lang", "thai-am", "huu-bat", "thien-co"],
    6: ["vu-khuc", "tham-lang", "thien-luong", "van-khuc"],
    7: ["thai-duong", "vu-khuc", "thai-am", "thien-dong"],
    8: ["cu-mon", "thien-luong", "van-khuc", "van-xuong"],
    9: ["thien-luong", "tu-vi", "ta-phu", "vu-khuc"],
    10: ["pha-quan", "cu-mon", "thai-am", "tham-lang"]
};
function placeFourTransformations(yearStem, allStars) {
    const names = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];
    return exports.FOUR_TRANSFORMATIONS_TABLE[yearStem].map((sourceId, index) => {
        const source = allStars.find((item) => item.id === sourceId);
        if (!source)
            throw new Error(`Không tìm thấy sao nguồn ${sourceId} để an ${names[index]}.`);
        return star(`hoa-${index}`, names[index], "transform", source.palace, "TB-TUHOA-001");
    });
}
function validateMajorStarCatalogue() {
    return constants_1.MAJOR_STARS.length === 14;
}
