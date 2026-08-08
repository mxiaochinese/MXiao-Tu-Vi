(function(global){
"use strict";
const factories=Object.create(null);
const cache=Object.create(null);
function define(id,factory){factories[id]=factory;}
function resolve(from,request){if(!request.startsWith('.')) return request; const parts=(from.split('/').slice(0,-1).concat(request.split('/'))); const out=[]; for(const p of parts){if(!p||p==='.') continue; if(p==='..') out.pop(); else out.push(p);} return out.join('/').replace(/\.js$/,'');}
function load(id){if(cache[id]) return cache[id].exports; const factory=factories[id]; if(!factory) throw new Error('Không tìm thấy module '+id); const module={exports:{}}; cache[id]=module; factory((request)=>load(resolve(id,request)),module,module.exports); return module.exports;}
define("tuvi/constants",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEM_LOC_TON_PALACE = exports.STEM_YANG_YIN = exports.MAJOR_STARS = exports.PALACE_NAMES = exports.BRANCH_ELEMENTS = exports.BRANCHES = exports.STEMS = void 0;
exports.STEMS = ["", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
exports.BRANCHES = ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
exports.BRANCH_ELEMENTS = ["", "Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];
exports.PALACE_NAMES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
exports.MAJOR_STARS = [
    ["tu-vi", "Tử Vi"], ["liem-trinh", "Liêm Trinh"], ["thien-dong", "Thiên Đồng"],
    ["vu-khuc", "Vũ Khúc"], ["thai-duong", "Thái Dương"], ["thien-co", "Thiên Cơ"],
    ["thien-phu", "Thiên Phủ"], ["thai-am", "Thái Âm"], ["tham-lang", "Tham Lang"],
    ["cu-mon", "Cự Môn"], ["thien-tuong", "Thiên Tướng"], ["thien-luong", "Thiên Lương"],
    ["that-sat", "Thất Sát"], ["pha-quan", "Phá Quân"]
];
exports.STEM_YANG_YIN = [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
exports.STEM_LOC_TON_PALACE = [0, 3, 4, 6, 7, 6, 7, 9, 10, 12, 1];

});
define("tuvi/profiles",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALCULATION_PROFILE_LIST = exports.CALCULATION_PROFILES = void 0;
exports.getCalculationProfile = getCalculationProfile;
exports.CALCULATION_PROFILES = {
    VN_TAN_BIEN_1956: {
        id: "VN_TAN_BIEN_1956",
        name: "Tân Biên - giờ Tý từ 23:00",
        ziHourMode: "zi23",
        lifeCycleMode: "same-start-reverse",
        leapFortuneMode: "split-half-next"
    },
    VN_AO_BI_1972: {
        id: "VN_AO_BI_1972",
        name: "Áo Bí - giờ Tý từ 00:00",
        ziHourMode: "zi00",
        lifeCycleMode: "yin-alternate-start",
        leapFortuneMode: "split-half-next"
    }
};
exports.CALCULATION_PROFILE_LIST = Object.values(exports.CALCULATION_PROFILES);
function getCalculationProfile(id = "VN_TAN_BIEN_1956") {
    const profile = exports.CALCULATION_PROFILES[id];
    if (!profile) throw new Error("Không tìm thấy phương pháp lập lá số.");
    return profile;
}

});
define("tuvi/time-correction",function(require,module,exports){
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

});
define("tuvi/core",function(require,module,exports){
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

});
define("tuvi/nayin",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.sexagenaryIndex = sexagenaryIndex;
exports.getNayinElement = getNayinElement;
exports.getBureau = getBureau;
const ELEMENT_BY_PAIR = {
    0: "Kim", 1: "Hỏa", 2: "Mộc", 3: "Thổ", 4: "Kim",
    5: "Hỏa", 6: "Thủy", 7: "Thổ", 8: "Kim", 9: "Mộc",
    10: "Thủy", 11: "Thổ", 12: "Hỏa", 13: "Mộc", 14: "Thủy",
    15: "Kim", 16: "Hỏa", 17: "Mộc", 18: "Thổ", 19: "Kim",
    20: "Hỏa", 21: "Thủy", 22: "Thổ", 23: "Kim", 24: "Mộc",
    25: "Thủy", 26: "Thổ", 27: "Hỏa", 28: "Mộc", 29: "Thủy"
};
const BUREAU = {
    Kim: { number: 4, label: "Kim tứ Cục" },
    Mộc: { number: 3, label: "Mộc tam Cục" },
    Thủy: { number: 2, label: "Thủy nhị Cục" },
    Hỏa: { number: 6, label: "Hỏa lục Cục" },
    Thổ: { number: 5, label: "Thổ ngũ Cục" }
};
function sexagenaryIndex(stem, branch) {
    for (let index = 0; index < 60; index += 1) {
        if ((index % 10) + 1 === stem && (index % 12) + 1 === branch)
            return index;
    }
    throw new Error("Can và Chi không tạo thành tổ hợp hợp lệ trong lục thập hoa giáp.");
}
function getNayinElement(stem, branch) {
    const index = sexagenaryIndex(stem, branch);
    return ELEMENT_BY_PAIR[Math.floor(index / 2)];
}
function getBureau(lifePalace, yearStem) {
    let firstMonthStem = (yearStem * 2 + 1) % 10;
    if (firstMonthStem === 0)
        firstMonthStem = 10;
    const branchOffsetFromTiger = ((lifePalace - 3) % 12 + 12) % 12;
    const lifeMonthStem = ((firstMonthStem - 1 + branchOffsetFromTiger) % 10) + 1;
    const element = getNayinElement(lifeMonthStem, lifePalace);
    return { element, ...BUREAU[element] };
}

});
define("tuvi/brightness",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStarBrightness = getStarBrightness;
exports.validateBrightnessCatalogue = validateBrightnessCatalogue;

const LABELS = {
  miao: "Miếu",
  wang: "Vượng",
  de: "Đắc",
  li: "Lợi",
  ping: "Bình",
  bu: "Bất",
  xian: "Hãm"
};

const TABLE = {
  "tu-vi": ["wang", "wang", "de", "wang", "miao", "miao", "wang", "wang", "de", "wang", "ping", "miao"],
  "thien-co": ["de", "wang", "li", "ping", "miao", "xian", "de", "wang", "li", "ping", "miao", "xian"],
  "thai-duong": ["wang", "miao", "wang", "wang", "wang", "de", "de", "xian", "bu", "xian", "xian", "bu"],
  "vu-khuc": ["de", "li", "miao", "ping", "wang", "miao", "de", "li", "miao", "ping", "wang", "miao"],
  "thien-dong": ["li", "ping", "ping", "miao", "xian", "bu", "wang", "ping", "ping", "miao", "wang", "bu"],
  "liem-trinh": ["miao", "ping", "li", "xian", "ping", "li", "miao", "ping", "li", "xian", "ping", "li"],
  "thien-phu": ["miao", "de", "miao", "de", "wang", "miao", "de", "wang", "miao", "de", "miao", "miao"],
  "thai-am": ["wang", "xian", "xian", "xian", "bu", "bu", "li", "bu", "wang", "miao", "miao", "miao"],
  "tham-lang": ["ping", "li", "miao", "xian", "wang", "miao", "ping", "li", "miao", "xian", "wang", "miao"],
  "cu-mon": ["miao", "miao", "xian", "wang", "wang", "bu", "miao", "miao", "xian", "wang", "wang", "bu"],
  "thien-tuong": ["miao", "xian", "de", "de", "miao", "de", "miao", "xian", "de", "de", "miao", "miao"],
  "thien-luong": ["miao", "miao", "miao", "xian", "miao", "wang", "xian", "de", "miao", "xian", "miao", "wang"],
  "that-sat": ["miao", "wang", "miao", "ping", "wang", "miao", "miao", "miao", "miao", "ping", "wang", "miao"],
  "pha-quan": ["de", "xian", "wang", "ping", "miao", "wang", "de", "xian", "wang", "ping", "miao", "wang"],
  "van-xuong": ["xian", "li", "de", "miao", "xian", "li", "de", "miao", "xian", "li", "de", "miao"],
  "van-khuc": ["ping", "wang", "de", "miao", "xian", "wang", "de", "miao", "xian", "wang", "de", "miao"],
  "hoa-tinh": ["miao", "li", "xian", "de", "miao", "li", "xian", "de", "miao", "li", "xian", "de"],
  "linh-tinh": ["miao", "li", "xian", "de", "miao", "li", "xian", "de", "miao", "li", "xian", "de"],
  "kinh-duong": ["", "xian", "miao", "", "xian", "miao", "", "xian", "miao", "", "xian", "miao"],
  "da-la": ["xian", "", "miao", "xian", "", "miao", "xian", "", "miao", "xian", "", "miao"]
};

function branchToBrightnessIndex(palace) {
  if (!Number.isInteger(palace) || palace < 1 || palace > 12) return -1;
  return (palace - 3 + 12) % 12;
}

function getStarBrightness(starId, palace) {
  const row = TABLE[starId];
  if (!row) return null;
  const index = branchToBrightnessIndex(palace);
  if (index < 0) return null;
  const code = row[index];
  if (!code) return null;
  return {
    code,
    label: LABELS[code]
  };
}

function validateBrightnessCatalogue() {
  const majorIds = ["tu-vi", "thien-co", "thai-duong", "vu-khuc", "thien-dong", "liem-trinh", "thien-phu", "thai-am", "tham-lang", "cu-mon", "thien-tuong", "thien-luong", "that-sat", "pha-quan"];
  return majorIds.every((id) => Array.isArray(TABLE[id]) && TABLE[id].length === 12)
    && Object.values(TABLE).every((row) => row.length === 12);
}

});
define("tuvi/stars",function(require,module,exports){
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

});
define("tuvi/fortune",function(require,module,exports){
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

});
define("tuvi/patterns",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationIds = getRelationIds;
exports.detectCoreConfigurations = detectCoreConfigurations;
exports.detectAdjacentFormations = detectAdjacentFormations;
exports.analyzeActivationNetwork = analyzeActivationNetwork;
exports.buildConfigurationParagraphs = buildConfigurationParagraphs;
exports.buildAdjacentParagraphs = buildAdjacentParagraphs;
exports.buildActivationParagraph = buildActivationParagraph;

const TRIADS = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];

const CONFIGURATIONS = [
    {
        id: "tu-phu-vu-tuong",
        name: "Tử Phủ Vũ Tướng",
        required: ["tu-vi", "thien-phu", "vu-khuc", "thien-tuong"],
        emphasis: "khả năng tổ chức, quản trị nguồn lực, duy trì trật tự và đảm nhận trách nhiệm trong một cấu trúc lớn"
    },
    {
        id: "sat-pha-tham",
        name: "Sát Phá Tham",
        required: ["that-sat", "pha-quan", "tham-lang"],
        emphasis: "khả năng thích ứng với biến động, tái cấu trúc, cạnh tranh và mở một chu kỳ mới khi khuôn cũ không còn phù hợp"
    },
    {
        id: "co-nguyet-dong-luong",
        name: "Cơ Nguyệt Đồng Lương",
        required: ["thien-co", "thai-am", "thien-dong", "thien-luong"],
        emphasis: "tư duy quan sát, điều phối, tích lũy kinh nghiệm và xử lý tình huống theo hướng mềm, có độ lùi"
    },
    {
        id: "cu-nhat",
        name: "Cự Nhật",
        required: ["cu-mon", "thai-duong"],
        emphasis: "năng lực diễn đạt, phản biện, công khai quan điểm và chịu trách nhiệm trước cộng đồng"
    },
    {
        id: "nhat-nguyet",
        name: "Nhật Nguyệt",
        required: ["thai-duong", "thai-am"],
        emphasis: "sự đan xen giữa hướng ngoại và chiều sâu nội tâm, giữa nhu cầu tạo ảnh hưởng và khả năng quan sát kín đáo"
    }
];

const ADJACENT_FORMATIONS = [
    { id: "ta-huu", name: "Tả Hữu giáp", pair: ["ta-phu", "huu-bat"], tone: "support", effect: "khả năng nhận trợ lực từ hai phía, phối hợp nhân sự và tổ chức công việc theo nhóm" },
    { id: "xuong-khuc", name: "Xương Khúc giáp", pair: ["van-xuong", "van-khuc"], tone: "support", effect: "năng lực học hỏi, diễn đạt, xử lý thông tin và hoàn thiện kỹ năng bằng cả tư duy hệ thống lẫn cảm thụ" },
    { id: "khoi-viet", name: "Khôi Việt giáp", pair: ["thien-khoi", "thien-viet"], tone: "support", effect: "khả năng gặp người dẫn dắt, tiếp cận nguồn lực tốt hoặc được nhìn nhận ở thời điểm phù hợp" },
    { id: "nhat-nguyet-giap", name: "Nhật Nguyệt giáp", pair: ["thai-duong", "thai-am"], tone: "mixed", effect: "sự tác động đồng thời của trách nhiệm hướng ngoại và nhu cầu ổn định nội tâm" },
    { id: "kinh-da", name: "Kình Đà giáp", pair: ["kinh-duong", "da-la"], tone: "challenge", effect: "sức ép vừa trực diện vừa kéo dài, khiến quá trình phát triển phải xử lý cả va chạm trước mắt lẫn độ trễ âm ỉ" },
    { id: "khong-kiep", name: "Không Kiếp giáp", pair: ["dia-khong", "dia-kiep"], tone: "challenge", effect: "độ biến động cao, nguy cơ thay đổi đột ngột và khoảng cách lớn giữa kế hoạch ban đầu với tình thế thực tế" },
    { id: "hoa-linh", name: "Hỏa Linh giáp", pair: ["hoa-tinh", "linh-tinh"], tone: "challenge", effect: "nhịp phản ứng mạnh, căng thẳng dễ bùng phát hoặc tích tụ rồi chuyển trạng thái nhanh" }
];

function movePalace(start, offset) {
    return ((start - 1 + offset) % 12 + 12) % 12 + 1;
}

function getPalace(palaces, id) {
    return palaces.find((item) => item.id === id);
}

function starIdsInPalaces(palaces, ids) {
    return new Set(ids.flatMap((id) => (getPalace(palaces, id)?.stars || []).map((star) => star.id)));
}

function getRelationIds(targetId) {
    const triad = TRIADS.find((group) => group.includes(targetId)) || [];
    return Array.from(new Set([...triad, movePalace(targetId, 6)]));
}

function detectCoreConfigurations(palaces, targetId) {
    const relationIds = getRelationIds(targetId);
    const present = starIdsInPalaces(palaces, relationIds);
    return CONFIGURATIONS.filter((configuration) => configuration.required.every((id) => present.has(id))).map((configuration) => ({
        ...configuration,
        targetId,
        relationIds,
        starPalaces: configuration.required.map((starId) => {
            const palace = palaces.find((item) => item.stars.some((star) => star.id === starId));
            const star = palace?.stars.find((item) => item.id === starId);
            return { starId, starName: star?.name || starId, palaceId: palace?.id || null, palaceName: palace?.name || "", branch: palace?.branch || "" };
        })
    }));
}

function detectAdjacentFormations(palaces, targetId) {
    const previous = getPalace(palaces, movePalace(targetId, -1));
    const next = getPalace(palaces, movePalace(targetId, 1));
    const previousIds = new Set((previous?.stars || []).map((star) => star.id));
    const nextIds = new Set((next?.stars || []).map((star) => star.id));
    return ADJACENT_FORMATIONS.filter((formation) => {
        const [a, b] = formation.pair;
        return (previousIds.has(a) && nextIds.has(b)) || (previousIds.has(b) && nextIds.has(a));
    }).map((formation) => ({ ...formation, targetId, previous, next }));
}

function pairRelation(a, b) {
    if (a === b)
        return "same";
    if (movePalace(a, 6) === b)
        return "opposite";
    if ((TRIADS.find((group) => group.includes(a)) || []).includes(b))
        return "triad";
    if (movePalace(a, 1) === b || movePalace(a, -1) === b)
        return "adjacent";
    return "separate";
}

function analyzeActivationNetwork(palaces, focusIds) {
    const ids = focusIds.filter((id) => Number.isInteger(id) && id >= 1 && id <= 12);
    const counts = new Map();
    ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const uniqueIds = [...counts.keys()];
    const exact = [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ palace: getPalace(palaces, id), count }));
    const relations = { triad: [], opposite: [], adjacent: [], separate: [] };
    for (let i = 0; i < uniqueIds.length; i += 1) {
        for (let j = i + 1; j < uniqueIds.length; j += 1) {
            const a = uniqueIds[i];
            const b = uniqueIds[j];
            const relation = pairRelation(a, b);
            if (relation === "same")
                continue;
            relations[relation].push({ a: getPalace(palaces, a), b: getPalace(palaces, b) });
        }
    }
    const connectedPairs = relations.triad.length + relations.opposite.length + relations.adjacent.length;
    let structure = "distributed";
    if (exact.length || connectedPairs >= Math.max(2, uniqueIds.length - 1))
        structure = "concentrated";
    else if (connectedPairs)
        structure = "linked";
    return { ids, uniqueIds, exact, relations, connectedPairs, structure };
}

function formatList(values) {
    const list = Array.from(new Set(values.filter(Boolean)));
    if (!list.length)
        return "";
    if (list.length === 1)
        return list[0];
    if (list.length === 2)
        return `${list[0]} và ${list[1]}`;
    return `${list.slice(0, -1).join(", ")} và ${list[list.length - 1]}`;
}

function buildConfigurationParagraphs(palaces, targetId) {
    const target = getPalace(palaces, targetId);
    return detectCoreConfigurations(palaces, targetId).map((configuration) => {
        const placements = configuration.starPalaces.map((item) => `${item.starName} tại ${item.palaceName} ở ${item.branch}`);
        return `Tam phương tứ chính của cung ${target.name} hội đủ nhóm ${configuration.name}, gồm ${formatList(placements)}. Cách cục này không được hiểu như một nhãn dự báo độc lập, mà cho thấy bốn cung liên hệ cùng chia sẻ một trục vận hành về ${configuration.emphasis}. Mức độ biểu hiện còn phụ thuộc trạng thái sáng tối của từng chính tinh, các sao phụ đi kèm và lớp vận hạn đang kích hoạt cung nào trong toàn bộ cấu trúc.`;
    });
}

function buildAdjacentParagraphs(palaces, targetId) {
    const target = getPalace(palaces, targetId);
    return detectAdjacentFormations(palaces, targetId).map((formation) => {
        const tone = formation.tone === "support"
            ? "Hai cung kề tạo một lớp hỗ trợ bao quanh, giúp chính tinh tại cung trung tâm có thêm điều kiện triển khai"
            : formation.tone === "challenge"
                ? "Hai cung kề cùng tạo sức ép, khiến chính tinh tại cung trung tâm phải xử lý ảnh hưởng từ hai phía trước khi phát huy ổn định"
                : "Hai cung kề đưa vào những lực tác động khác nhau, vì vậy cung trung tâm cần cân bằng giữa hai hướng vận hành";
        return `Cung ${target.name} tại ${target.branch} được ${formation.name} bởi hai cung kề ${formation.previous.name} ở ${formation.previous.branch} và ${formation.next.name} ở ${formation.next.branch}. ${tone}. Trong thực tế, cấu trúc này làm nổi bật ${formation.effect}; tác động chỉ rõ khi các sao giáp cung đồng thời được vận hạn hoặc Tứ Hóa kích hoạt.`;
    });
}

function pairLabels(pairs, limit = 3) {
    return pairs.slice(0, limit).map((pair) => `${pair.a.name} ở ${pair.a.branch} với ${pair.b.name} ở ${pair.b.branch}`);
}

function buildActivationParagraph(palaces, focusIds, label) {
    const network = analyzeActivationNetwork(palaces, focusIds);
    if (!network.uniqueIds.length)
        return `${label} chưa hình thành đủ dữ liệu để xác định một mạng kích hoạt rõ. Vì vậy, phần vận hạn cần được đọc chủ yếu từ nền sao gốc và từng lớp thời gian riêng lẻ.`;
    const clauses = [];
    if (network.exact.length)
        clauses.push(`có sự chồng lớp trực tiếp tại ${formatList(network.exact.map((item) => `${item.palace.name} ở ${item.palace.branch}`))}`);
    if (network.relations.triad.length)
        clauses.push(`các trục tam hợp nổi bật gồm ${formatList(pairLabels(network.relations.triad))}`);
    if (network.relations.opposite.length)
        clauses.push(`các trục xung chiếu gồm ${formatList(pairLabels(network.relations.opposite))}`);
    if (network.relations.adjacent.length)
        clauses.push(`các cung kề nhau gồm ${formatList(pairLabels(network.relations.adjacent))}`);
    let conclusion = `Các lớp thời gian phân bố tương đối rời, nên diễn biến có xu hướng xuất hiện ở nhiều lĩnh vực và cần được đọc tuần tự từ đại vận đến lưu thời.`;
    if (network.structure === "linked")
        conclusion = `Mạng vận hạn có liên kết nhưng chưa quy tụ hoàn toàn vào một cung. Một thay đổi ở cung khởi phát có thể lan sang cung tam hợp, xung chiếu hoặc cung kề, song mức độ vẫn phụ thuộc thứ tự của từng lớp thời gian.`;
    if (network.structure === "concentrated")
        conclusion = `Mạng vận hạn có độ tập trung cao. Khi nhiều lớp cùng chồng lên một cung hoặc nối với nhau bằng tam hợp và xung chiếu, chủ đề của các cung đó thường biểu hiện rõ hơn, liên tục hơn và dễ tạo phản ứng dây chuyền sang các lĩnh vực liên quan.`;
    return `${label} ${clauses.length ? clauses.join("; ") : "phân bố trên các cung chưa tạo thành quan hệ trực tiếp"}. ${conclusion}`;
}

});
define("tuvi/content-pipeline",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAtomicInsight = createAtomicInsight;
exports.resolveInsightConflicts = resolveInsightConflicts;
exports.synthesizeInsights = synthesizeInsights;
exports.finalizeInterpretations = finalizeInterpretations;
exports.textSimilarity = textSimilarity;

const INTERNAL_TERMS = /\b(?:ruleId|evidence|confidence|relationType|primaryPalace|supportingRuleIds|conflictingRuleIds|dataset|fixture|sourceId|profileVersion)\b/giu;
const ABSOLUTE_WORDING = [
    [/chắc chắn sẽ/giu, "có xu hướng"],
    [/bắt buộc sẽ/giu, "dễ"],
    [/không thể tránh/giu, "khó tránh hoàn toàn"],
    [/định mệnh/giu, "khuynh hướng dài hạn"]
];
const STOP_WORDS = new Set("của và là có trong tại một những các cho được với khi vào từ theo này đó nên vì về còn hơn như qua đang sẽ để hoặc giữa do trên dưới".split(" "));

function cleanSentence(value) {
    let text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text)
        return "";
    ABSOLUTE_WORDING.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
    });
    text = text.replace(INTERNAL_TERMS, "");
    text = text.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
    if (!/[.!?]$/u.test(text))
        text += ".";
    return text;
}

function normalizeTokens(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function textSimilarity(a, b) {
    const left = new Set(normalizeTokens(a));
    const right = new Set(normalizeTokens(b));
    if (!left.size || !right.size)
        return 0;
    let intersection = 0;
    left.forEach((token) => {
        if (right.has(token))
            intersection += 1;
    });
    return intersection / Math.min(left.size, right.size);
}

function createAtomicInsight(definition) {
    const insight = {
        ruleId: String(definition.ruleId || "").trim(),
        topic: String(definition.topic || "").trim(),
        polarity: definition.polarity || "neutral",
        strength: Number.isFinite(definition.strength) ? definition.strength : 1,
        confidence: ["low", "medium", "high"].includes(definition.confidence) ? definition.confidence : "medium",
        evidence: Array.isArray(definition.evidence) ? definition.evidence.filter(Boolean) : [],
        claim: cleanSentence(definition.claim),
        explanation: cleanSentence(definition.explanation),
        manifestations: (definition.manifestations || []).map(cleanSentence).filter(Boolean),
        conditions: (definition.conditions || []).map(cleanSentence).filter(Boolean),
        advice: cleanSentence(definition.advice),
        primaryPalace: definition.primaryPalace || null,
        relatedPalaces: Array.isArray(definition.relatedPalaces) ? definition.relatedPalaces.filter(Boolean) : [],
        relationType: definition.relationType || null
    };
    if (!insight.ruleId || !insight.topic || !insight.evidence.length || !insight.claim || !insight.explanation)
        throw new Error("Insight nội bộ phải có định danh, chủ đề, căn cứ, nhận định và giải thích.");
    return insight;
}

function deduplicateInsights(insights) {
    const kept = [];
    [...insights].sort((a, b) => b.strength - a.strength).forEach((insight) => {
        const duplicate = kept.some((candidate) => candidate.topic === insight.topic && textSimilarity(candidate.claim, insight.claim) >= 0.78);
        if (!duplicate)
            kept.push(insight);
    });
    return kept;
}

function resolveInsightConflicts(insights) {
    const clean = deduplicateInsights(insights);
    const supportive = clean.filter((item) => item.polarity === "supportive");
    const challenging = clean.filter((item) => item.polarity === "challenging");
    const other = clean.filter((item) => !["supportive", "challenging"].includes(item.polarity));
    if (!supportive.length || !challenging.length)
        return clean;
    const support = supportive[0];
    const challenge = challenging[0];
    const mixed = createAtomicInsight({
        ruleId: `${support.ruleId}+${challenge.ruleId}`,
        topic: support.topic,
        polarity: "mixed",
        strength: Math.max(support.strength, challenge.strength) + 0.25,
        confidence: support.confidence === "high" && challenge.confidence === "high" ? "high" : "medium",
        evidence: [...support.evidence, ...challenge.evidence],
        claim: `${support.claim.replace(/[.!?]+$/u, "")}, nhưng ${challenge.claim.charAt(0).toLowerCase()}${challenge.claim.slice(1)}`,
        explanation: `${support.explanation} Ở chiều ngược lại, ${challenge.explanation}`,
        manifestations: [...support.manifestations, ...challenge.manifestations],
        conditions: [...support.conditions, ...challenge.conditions],
        advice: support.advice || challenge.advice,
        primaryPalace: support.primaryPalace || challenge.primaryPalace,
        relatedPalaces: [...new Set([...support.relatedPalaces, ...challenge.relatedPalaces])],
        relationType: support.relationType || challenge.relationType
    });
    return [mixed, ...other, ...supportive.slice(1), ...challenging.slice(1)];
}

function joinSentences(parts) {
    const sentences = [];
    parts.flat().filter(Boolean).forEach((part) => {
        const clean = cleanSentence(part);
        if (!clean)
            return;
        if (!sentences.some((existing) => textSimilarity(existing, clean) >= 0.82))
            sentences.push(clean);
    });
    return sentences.join(" ");
}

function synthesizeInsights(insights, options = {}) {
    const maxParagraphs = options.maxParagraphs || 3;
    const confidenceRank = { high: 3, medium: 2, low: 1 };
    const resolved = resolveInsightConflicts(insights)
        .sort((a, b) => confidenceRank[b.confidence] - confidenceRank[a.confidence] || b.strength - a.strength)
        .slice(0, maxParagraphs);
    return resolved.map((insight, index) => {
        const manifestation = insight.polarity === "mixed" && insight.manifestations.length > 1
            ? joinSentences([insight.manifestations[0], insight.manifestations[insight.manifestations.length - 1]])
            : insight.manifestations[index % Math.max(1, insight.manifestations.length)] || insight.manifestations[0];
        const condition = insight.polarity === "mixed" && insight.conditions.length > 1
            ? joinSentences([insight.conditions[0], insight.conditions[insight.conditions.length - 1]])
            : insight.conditions[index % Math.max(1, insight.conditions.length)] || insight.conditions[0];
        const conditionLeads = ["Xu hướng này rõ hơn khi", "Mặt biểu hiện còn phụ thuộc việc", "Độ ổn định thay đổi khi"];
        const conditionBody = String(condition || "").replace(/[.!?]+$/u, "");
        const conditionText = !conditionBody
            ? ""
            : /^(?:mặt|khả năng|đây|ảnh hưởng|lớp|sự|tứ hóa|khi|nếu)/iu.test(conditionBody)
                ? `${conditionBody.charAt(0).toUpperCase()}${conditionBody.slice(1)}`
                : `${conditionLeads[index % conditionLeads.length]} ${conditionBody.charAt(0).toLowerCase()}${conditionBody.slice(1)}`;
        return joinSentences([
            insight.claim,
            insight.explanation,
            manifestation,
            conditionText,
            insight.advice
        ]);
    }).filter(Boolean);
}

function splitSentences(paragraph) {
    return String(paragraph || "").match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || [];
}

function variedOpening(paragraph, index) {
    const replacements = [
        ["Cung ", "Xét về "],
        ["Trong ", "Ở lớp "],
        ["Điều này ", "Từ đó, "],
        ["Vì vậy, ", "Theo cấu trúc này, "]
    ];
    if (index % 3 === 0)
        return paragraph;
    const [from, to] = replacements[index % replacements.length];
    return paragraph.startsWith(from) ? `${to}${paragraph.slice(from.length)}` : paragraph;
}

function finalizeInterpretations(items) {
    const seenParagraphs = [];
    let paragraphIndex = 0;
    return items.map((item) => {
        const paragraphs = [];
        (item.paragraphs || []).forEach((paragraph) => {
            const kept = [];
            const localSentences = [];
            splitSentences(cleanSentence(paragraph)).forEach((sentence) => {
                const clean = cleanSentence(sentence);
                const duplicate = localSentences.some((existing) => {
                    const ratio = Math.min(existing.length, clean.length) / Math.max(existing.length, clean.length);
                    return ratio >= 0.82 && textSimilarity(existing, clean) >= 0.96;
                });
                if (!duplicate) {
                    kept.push(clean);
                    localSentences.push(clean);
                }
            });
            const combined = variedOpening(kept.join(" "), paragraphIndex++).trim();
            const repeatedParagraph = !/\d+\s*[-–]\s*\d+\s+tuổi/u.test(combined) && seenParagraphs.some((existing) => {
                const ratio = Math.min(existing.length, combined.length) / Math.max(existing.length, combined.length);
                return ratio >= 0.85 && textSimilarity(existing, combined) >= 0.96;
            });
            if (combined.length >= 70 && !repeatedParagraph) {
                paragraphs.push(combined);
                seenParagraphs.push(combined);
            }
        });
        if (!paragraphs.length && item.paragraphs?.length) {
            const fallback = cleanSentence(`${item.title} được đặt trong chủ đề ${item.topic}. ${item.paragraphs[0]}`);
            paragraphs.push(fallback);
            seenParagraphs.push(fallback);
        }
        return { id: item.id, topic: item.topic, title: item.title, paragraphs, body: paragraphs.join("\n\n") };
    });
}

});
define("tuvi/interpreter",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterpretations = buildInterpretations;
const fortune_1 = require("./fortune");
const patterns_1 = require("./patterns");
const content_pipeline_1 = require("./content-pipeline");

const MAJOR_PROFILES = {
    "tu-vi": { core: "khả năng quy tụ, tổ chức và giữ vai trò trung tâm", tension: "xu hướng muốn tự mình kiểm soát trục quyết định" },
    "liem-trinh": { core: "ý thức nguyên tắc, danh dự và ranh giới", tension: "sự cứng rắn hoặc nhạy cảm trước chuyện đúng sai" },
    "thien-dong": { core: "khả năng thích nghi, kết nối và thay đổi theo môi trường", tension: "tâm thế dễ dao động khi điều kiện bên ngoài biến chuyển" },
    "vu-khuc": { core: "năng lực quản lý nguồn lực, tính toán và theo đuổi kết quả", tension: "cách xử lý thiên về hiệu quả nên đôi lúc trở nên khô cứng" },
    "thai-duong": { core: "tính chủ động, tinh thần trách nhiệm và nhu cầu tạo ảnh hưởng công khai", tension: "áp lực phải thể hiện vai trò hoặc gánh trách nhiệm quá sớm" },
    "thien-co": { core: "khả năng quan sát biến động, suy tính và tìm phương án", tension: "tư duy liên tục khiến quyết định dễ bị kéo dài" },
    "thien-phu": { core: "năng lực quản trị, tích lũy và duy trì nền tảng", tension: "tâm lý ưu tiên an toàn có thể làm chậm thay đổi cần thiết" },
    "thai-am": { core: "sự tinh tế, khả năng tích lũy và quan sát chiều sâu", tension: "cảm xúc kín và xu hướng suy nghĩ nhiều trước khi bộc lộ" },
    "tham-lang": { core: "khả năng kết nối, trải nghiệm và nhận diện cơ hội", tension: "sự phân tán khi có quá nhiều lựa chọn cùng xuất hiện" },
    "cu-mon": { core: "năng lực phân tích, phản biện và diễn đạt", tension: "tranh luận, hiểu lầm hoặc áp lực từ lời nói" },
    "thien-tuong": { core: "khả năng phối hợp, giữ tiêu chuẩn và bảo vệ quan hệ", tension: "tâm thế phải cân bằng quá nhiều phía" },
    "thien-luong": { core: "ý thức nguyên tắc, hướng dẫn và bảo hộ", tension: "khuynh hướng tự đặt mình vào vai người chịu trách nhiệm" },
    "that-sat": { core: "khả năng quyết định, chịu áp lực và xử lý tình huống khó", tension: "nhịp hành động mạnh, dễ tạo va chạm khi thiếu khoảng lùi" },
    "pha-quan": { core: "năng lực cải tổ, kết thúc chu kỳ cũ và mở chu kỳ mới", tension: "biến động lớn khi quá trình thay đổi thiếu nền tảng ổn định" }
};

const PALACE_THEMES = {
    "Mệnh": "khí chất nền, cách tiếp nhận hoàn cảnh và phương thức tự định vị",
    "Phụ Mẫu": "quan hệ với cha mẹ, người nâng đỡ và các khuôn mẫu hình thành từ gia đình",
    "Phúc Đức": "nền tảng tinh thần, ảnh hưởng dòng họ và sức bền nội tâm",
    "Điền Trạch": "nhà ở, tài sản cố định và cảm giác ổn định trong môi trường cư trú",
    "Quan Lộc": "nghề nghiệp, vị trí xã hội và phương thức tạo ra thành tựu",
    "Nô Bộc": "bạn bè, đồng nghiệp, cộng sự và chất lượng mạng lưới xã hội",
    "Thiên Di": "hoạt động bên ngoài, dịch chuyển và cách cá nhân được nhìn nhận trong xã hội",
    "Tật Ách": "thể trạng, nhịp năng lượng và phản ứng khi áp lực tích tụ",
    "Tài Bạch": "khả năng tạo lập, quản lý và luân chuyển nguồn lực tài chính",
    "Tử Tức": "con cái, dự án dài hạn và những thành quả cần thời gian nuôi dưỡng",
    "Phu Thê": "quan hệ gắn bó, hôn nhân và cách hai bên phối hợp trong đời sống lâu dài",
    "Huynh Đệ": "anh chị em, quan hệ ngang hàng và cách chia sẻ trách nhiệm"
};

const PALACE_MANIFESTATIONS = {
    "Mệnh": "nhịp ra quyết định, mức chủ động và cách xác lập ranh giới cá nhân",
    "Phụ Mẫu": "cách tiếp nhận kỳ vọng gia đình, quan hệ với người nâng đỡ và mức độ kế thừa khuôn mẫu cũ",
    "Phúc Đức": "sức bền tâm lý, cách hồi phục sau biến động và ảnh hưởng của nền gia tộc",
    "Điền Trạch": "cách tạo không gian ổn định, tích lũy tài sản cố định và thích ứng với thay đổi nơi ở",
    "Quan Lộc": "kiểu công việc, cách nhận trách nhiệm và nhịp phát triển vị trí xã hội",
    "Nô Bộc": "cách chọn cộng sự, phân chia lợi ích và duy trì độ tin cậy trong mạng lưới",
    "Thiên Di": "cách phản ứng với môi trường mới, năng lực dịch chuyển và hình ảnh thể hiện ra bên ngoài",
    "Tật Ách": "nhịp tiêu hao năng lượng, khả năng hồi phục và phản ứng của cơ thể trước áp lực kéo dài",
    "Tài Bạch": "cách tạo thu nhập, quản lý dòng tiền và phản ứng trước cơ hội tài chính",
    "Tử Tức": "cách nuôi dưỡng con cái hoặc dự án dài hạn, mức kiên nhẫn và khả năng trao quyền",
    "Phu Thê": "cách hình thành cam kết, phân chia vai trò và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "cách tương tác với người ngang hàng, chia sẻ trách nhiệm và duy trì ranh giới trong quan hệ gần"
};

const PALACE_LEADS = {
    "Mệnh": "Cách phản ứng và tự định vị",
    "Phụ Mẫu": "Quan hệ với cha mẹ, người nâng đỡ và các khuôn mẫu gia đình",
    "Phúc Đức": "Sức bền tinh thần và khả năng hồi phục sau biến động",
    "Điền Trạch": "Nhu cầu ổn định về nhà ở và tài sản tích lũy",
    "Quan Lộc": "Con đường nghề nghiệp và cách đảm nhận trách nhiệm",
    "Nô Bộc": "Cách chọn cộng sự và duy trì độ tin cậy trong quan hệ xã hội",
    "Thiên Di": "Khả năng thích nghi khi bước ra môi trường bên ngoài",
    "Tật Ách": "Nhịp sinh hoạt và cách cơ thể phản ứng khi áp lực kéo dài",
    "Tài Bạch": "Khả năng tạo thu nhập, giữ nguồn lực và xử lý biến động dòng tiền",
    "Tử Tức": "Cách nuôi dưỡng con cái hoặc những dự án cần thời gian",
    "Phu Thê": "Cách hình thành cam kết và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "Cách chia sẻ trách nhiệm và giữ ranh giới với người ngang hàng"
};

const SUPPORT_ROLES = {
    "Lộc Tồn": "khả năng tích lũy và duy trì nguồn lực",
    "Tả Phù": "sự hỗ trợ từ cộng sự và năng lực tổ chức theo nhóm",
    "Hữu Bật": "khả năng nhận trợ giúp linh hoạt từ người xung quanh",
    "Văn Xương": "tư duy hệ thống, học tập và diễn đạt rõ ràng",
    "Văn Khúc": "khả năng cảm thụ, biểu đạt và xử lý thông tin mềm",
    "Thiên Khôi": "cơ hội được nhìn nhận hoặc gặp người dẫn dắt",
    "Thiên Việt": "sự hỗ trợ đúng lúc và khả năng tiếp cận nguồn lực tốt",
    "Thiên Mã": "dịch chuyển, thay đổi môi trường và mở rộng phạm vi hoạt động",
    "Quốc Ấn": "uy tín, trách nhiệm và dấu hiệu của vị trí chính thức",
    "Đào Hoa": "sức hút xã hội và khả năng tạo kết nối",
    "Hồng Loan": "độ nhạy trong quan hệ và nhu cầu gắn kết",
    "Thiên Hỷ": "không khí cởi mở, giao tiếp thuận và sự kiện mang tính kết nối",
    "Thiên Giải": "khả năng tháo gỡ trở ngại",
    "Địa Giải": "khả năng giảm nhẹ áp lực thực tế",
    "Giải Thần": "cơ chế điều hòa khi mâu thuẫn phát sinh",
    "Ân Quang": "sự hỗ trợ về tinh thần, học hỏi và thiện ý",
    "Thiên Quý": "quý nhân, sự nâng đỡ và cơ hội được bảo hộ",
    "Thiên Thọ": "sức bền và khả năng duy trì nhịp ổn định",
    "Thiên Phúc": "phúc khí, sự dung hòa và khả năng gặp điều kiện thuận",
    "Thiên Quan": "sự nâng đỡ từ hệ thống, người có thẩm quyền hoặc chuẩn mực chung",
    "Thiên Đức": "khả năng giảm xung đột và giữ giới hạn đạo lý",
    "Nguyệt Đức": "tính mềm hóa, thiện chí và khả năng hòa giải",
    "Bát Tọa": "nền tảng, sự sắp xếp và khả năng giữ vị trí",
    "Tam Thai": "quá trình tiến từng bậc và sự hỗ trợ theo lớp",
    "Thai Phụ": "khả năng chuẩn bị, nâng đỡ và hoàn thiện thủ tục",
    "Phong Cáo": "sự ghi nhận, danh vị hoặc kết quả được xác lập công khai",
    "Long Trì": "môi trường nâng đỡ, tính trang trọng và khả năng được bảo vệ",
    "Phượng Các": "khả năng biểu đạt, thẩm mỹ và sự ghi nhận từ cộng đồng",
    "Hoa Cái": "chiều sâu chuyên môn, thẩm mỹ và xu hướng làm việc độc lập",
    "Đường Phù": "tính quy củ, hồ sơ, giấy tờ và quy trình",
    "Thiên Tài": "khả năng ứng biến và sử dụng năng lực cá nhân đúng lúc",
    "Thiên Trù": "điều kiện nuôi dưỡng, hưởng dụng và chăm lo đời sống",
    "Thiên Y": "khả năng chăm sóc, phục hồi và quan tâm tới thể trạng",
    "Lưu Niên Văn Tinh": "nhu cầu học hỏi, viết, nói hoặc xử lý thông tin trong thời điểm được kích hoạt"
};

const CHALLENGE_ROLES = {
    "Kình Dương": "xung lực mạnh, cạnh tranh và va chạm trực diện",
    "Đà La": "trì hoãn, vướng mắc kéo dài và sức cản âm ỉ",
    "Địa Không": "khoảng trống, thay đổi đột ngột hoặc kỳ vọng khó giữ nguyên",
    "Địa Kiếp": "biến động mạnh và nguy cơ hao hụt khi quyết định thiếu độ lùi",
    "Hỏa Tinh": "nhịp phản ứng nhanh, áp lực bùng phát và tính nóng",
    "Linh Tinh": "sự bất ổn khó đoán và căng thẳng tích tụ",
    "Cự Môn": "mâu thuẫn qua lời nói và khác biệt trong cách diễn giải",
    "Thiên Hình": "tính nghiêm khắc, ranh giới pháp lý hoặc áp lực từ quy chuẩn",
    "Thiên Khốc": "gánh nặng cảm xúc và cảm giác thiếu sự chia sẻ",
    "Thiên Hư": "khoảng cách giữa kỳ vọng và kết quả thực tế",
    "Cô Thần": "xu hướng tự xử lý vấn đề và khó chia sẻ cảm xúc",
    "Quả Tú": "cảm giác tách biệt trong quan hệ gần",
    "Kiếp Sát": "tình huống bất ngờ buộc phải phản ứng nhanh",
    "Phá Toái": "sự việc vụn vặt, gián đoạn và hao tổn do nhiều đầu mối",
    "Thiên Không": "sự đảo chiều hoặc kết quả khác với dự tính ban đầu",
    "Lưu Hà": "dòng biến động khó giữ ổn định và nguy cơ bị cuốn theo tình thế",
    "Thiên La": "cảm giác bị ràng buộc bởi hoàn cảnh hoặc suy nghĩ lặp lại",
    "Địa Võng": "mạng lưới trách nhiệm chồng chéo và khó tách khỏi hệ quả cũ",
    "Thiên Riêu": "độ nhạy cảm, hấp lực cảm xúc và khả năng phát sinh nhiễu trong quan hệ",
    "Thiên Sứ": "áp lực buộc phải xử lý hậu quả hoặc phần việc khó né tránh",
    "Thiên Thương": "tổn hao do trách nhiệm, quan hệ hoặc sự cố ngoài dự tính"
};

const TRANSFORM_ROLES = {
    "Hóa Lộc": "mở rộng nguồn lực, khả năng tiếp nhận lợi ích và tăng tính thuận",
    "Hóa Quyền": "tăng quyền chủ động, trách nhiệm và mức độ phải đứng ra quyết định",
    "Hóa Khoa": "tăng tính minh bạch, khả năng học hỏi và sự ghi nhận",
    "Hóa Kỵ": "tạo điểm nghẽn, tâm lý vướng mắc hoặc vấn đề cần xử lý nhiều lần"
};

const TRIADS = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];

function getPalace(palaces, id) {
    return palaces.find((item) => item.id === id);
}

function movePalace(start, offset) {
    return ((start - 1 + offset) % 12 + 12) % 12 + 1;
}

function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
}

function formatList(list) {
    const values = unique(list);
    if (!values.length)
        return "";
    if (values.length === 1)
        return values[0];
    if (values.length === 2)
        return `${values[0]} và ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} và ${values[values.length - 1]}`;
}

function getStars(palace, groups) {
    return palace.stars.filter((item) => groups.includes(item.group));
}

function getMovingStars(palace, layers) {
    return layers.flatMap((layer) => palace[layer] || []);
}

function starDisplay(star) {
    return `${star.name}${star.brightness ? ` ở trạng thái ${star.brightness}` : ""}`;
}

function majorDisplay(palace) {
    const major = getStars(palace, ["major"]);
    return major.length ? formatList(major.map(starDisplay)) : "vô chính diệu";
}

function brightnessSentence(star) {
    const profile = MAJOR_PROFILES[star.id] || { core: "đặc tính chủ đạo của sao", tension: "mặt căng thẳng của sao" };
    if (["Miếu", "Vượng", "Đắc", "Lợi"].includes(star.brightness)) {
        return `Ở thế ${star.brightness}, mặt tích cực của ${star.name}, thể hiện qua ${profile.core}, có xu hướng bộc lộ trực tiếp và giữ vai trò dẫn dắt; mặt căng thẳng liên quan đến ${profile.tension} thường chỉ nổi rõ khi cung đồng thời chịu nhiều sát tinh hoặc gặp vận hạn gây sức ép`;
    }
    if (["Hãm", "Bất"].includes(star.brightness)) {
        return `Ở thế ${star.brightness}, mặt tích cực của ${star.name}, gồm ${profile.core}, vẫn hiện diện nhưng thường biểu lộ sau va vấp hoặc qua một đường vòng; trong khi đó, mặt căng thẳng liên quan đến ${profile.tension} dễ xuất hiện sớm hơn khi hoàn cảnh thiếu ổn định`;
    }
    return `Ở trạng thái ${star.brightness || "trung bình"}, ${star.name} biểu hiện đồng thời mặt tích cực là ${profile.core} và mặt căng thẳng là ${profile.tension}; kết quả vì thế phụ thuộc nhiều vào phụ tinh, Tứ Hóa và các cung hội chiếu`;
}

function mappedRoleSentences(stars, roleMap, limit = 4) {
    const selected = stars.filter((star) => roleMap[star.name]).slice(0, limit);
    return selected.map((star) => `${star.name} làm rõ ${roleMap[star.name]}`);
}

function transformationSentences(palace) {
    return getStars(palace, ["transform"]).map((star) => `${star.name} khiến cung nghiêng thêm về ${TRANSFORM_ROLES[star.name] || "một chiều biến đổi riêng"}`);
}

function balanceState(palace, movingLayers = []) {
    const natalSupport = getStars(palace, ["support", "transform"]).length;
    const natalChallenge = getStars(palace, ["malefic"]).length;
    const moving = getMovingStars(palace, movingLayers);
    const movingSupport = moving.filter((item) => item.group.endsWith("support")).length;
    const movingChallenge = moving.filter((item) => item.group.endsWith("malefic")).length;
    const support = natalSupport + movingSupport;
    const challenge = natalChallenge + movingChallenge;
    if (support >= challenge + 3)
        return { label: "thiên về nâng đỡ", support, challenge };
    if (challenge >= support + 3)
        return { label: "thiên về thử thách", support, challenge };
    return { label: "đan xen thuận lợi và trở lực", support, challenge };
}

function relationSet(palaces, palace) {
    const triad = TRIADS.find((group) => group.includes(palace.id)) || [];
    const triadPalaces = triad.filter((id) => id !== palace.id).map((id) => getPalace(palaces, id));
    const opposite = getPalace(palaces, movePalace(palace.id, 6));
    return { triadPalaces, opposite };
}

function relatedPalaceClause(palace) {
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `${palace.name} tại ${palace.branch} là cung vô chính diệu, vì vậy ${PALACE_THEMES[palace.name]} phụ thuộc mạnh vào hệ sao hội chiếu`;
    const roles = major.map((star) => MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo của sao");
    return `${palace.name} tại ${palace.branch} có ${majorDisplay(palace)}, đưa ${formatList(roles)} vào ${PALACE_THEMES[palace.name]}`;
}

function relationParagraph(palaces, palace) {
    const { triadPalaces, opposite } = relationSet(palaces, palace);
    const related = [...triadPalaces, opposite];
    const clauses = related.map(relatedPalaceClause);
    const supportive = related.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challenging = related.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let closing = `Các chiều hỗ trợ và gây sức ép khá cân bằng, nên biểu hiện của cung ${palace.name} thay đổi rõ theo hoàn cảnh và lớp vận hạn đang kích hoạt`;
    if (supportive >= challenging + 5)
        closing = `Cụm cung liên hệ có nhiều yếu tố nâng đỡ hơn, giúp chủ đề của cung ${palace.name} có đường triển khai tương đối liền mạch khi các lĩnh vực liên quan cùng vận động`;
    if (challenging >= supportive + 5)
        closing = `Cụm cung liên hệ chứa nhiều yếu tố gây sức ép hơn, khiến chủ đề của cung ${palace.name} thường phải đi qua điều chỉnh, va chạm hoặc thay đổi cách xử lý trước khi ổn định`;
    return `Tam phương tứ chính đặt cung ${palace.name} trong một chuỗi liên hệ rõ: ${clauses.join("; ")}. Do đó, ${PALACE_THEMES[palace.name]} được hình thành đồng thời qua ${formatList(related.map((item) => PALACE_THEMES[item.name]))}. ${closing}.`;
}

function corePalaceParagraph(palace) {
    const major = getStars(palace, ["major"]);
    const theme = PALACE_THEMES[palace.name];
    const manifestation = PALACE_MANIFESTATIONS[palace.name];
    if (!major.length) {
        return `Cung ${palace.name} an tại ${palace.branch} là cung vô chính diệu. Vì thiếu một chính tinh tọa thủ làm trục cố định, ${theme} thường phản ứng mạnh hơn với phụ tinh, Tứ Hóa, tam phương và cung xung chiếu. Biểu hiện thực tế vì thế có độ biến thiên cao, đặc biệt ở ${manifestation}, và cần được đọc cùng vận hạn thay vì quy về một nét tính duy nhất.`;
    }
    const opening = major.length === 1
        ? `${major[0].name} giữ vai trò trung tâm, nhấn mạnh ${MAJOR_PROFILES[major[0].id]?.core || "đặc tính chủ đạo của sao"}`
        : `${major[0].name} tạo trục ${MAJOR_PROFILES[major[0].id]?.core || "chủ đạo"}, còn ${major.slice(1).map((star) => `${star.name} bổ sung ${MAJOR_PROFILES[star.id]?.core || "một chiều vận hành khác"}`).join("; ")}`;
    const brightness = major.map(brightnessSentence).join(". ");
    const tensions = unique(major.map((star) => MAJOR_PROFILES[star.id]?.tension));
    const tensionText = tensions.length
        ? `Điểm dễ mất cân bằng của bộ sao là ${formatList(tensions)}; xu hướng này chủ yếu bộc lộ khi môi trường đòi hỏi phản ứng nhanh hoặc khi cung bị nhiều sao gây trở lực kích hoạt`
        : `Mặt căng thẳng của bộ sao phụ thuộc chủ yếu vào các phụ tinh đi kèm`;
    return `Cung ${palace.name} an tại ${palace.branch} có ${majorDisplay(palace)}. ${opening}. ${brightness}. Trong phạm vi ${theme}, bộ sao này thường biểu hiện qua ${manifestation}. ${tensionText}.`;
}

function auxiliaryParagraph(palace, movingLayers = []) {
    const support = getStars(palace, ["support"]);
    const challenges = getStars(palace, ["malefic"]);
    const supportSentences = mappedRoleSentences(support, SUPPORT_ROLES);
    const challengeSentences = mappedRoleSentences(challenges, CHALLENGE_ROLES);
    const transformSentences = transformationSentences(palace);
    const balance = balanceState(palace, movingLayers);
    const parts = [];
    if (supportSentences.length)
        parts.push(`Ở chiều nâng đỡ, ${supportSentences.join("; ")}`);
    else if (support.length)
        parts.push(`Các trợ tinh ${formatList(support.slice(0, 6).map((star) => star.name))} tạo thêm lớp hỗ trợ cho chính tinh tọa thủ`);
    if (challengeSentences.length)
        parts.push(`Ở chiều gây sức ép, ${challengeSentences.join("; ")}`);
    else if (challenges.length)
        parts.push(`Các sao ${formatList(challenges.slice(0, 6).map((star) => star.name))} làm tăng độ phức tạp và biến động của cung`);
    if (transformSentences.length)
        parts.push(transformSentences.join("; "));
    if (palace.hasTuan || palace.hasTriet) {
        const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
        parts.push(`${blockers} án trực tiếp làm nhịp biểu hiện bị ngắt, chậm hoặc đổi hướng, vì vậy năng lực của chính tinh thường chỉ ổn định sau một giai đoạn điều chỉnh`);
    }
    if (!parts.length)
        parts.push(`Cung ít phụ tinh nổi bật, khiến chính tinh tọa thủ và tam phương tứ chính giữ vai trò chi phối rõ hơn`);
    let conclusion = `Hai chiều thuận và nghịch cùng tồn tại, nên ${PALACE_MANIFESTATIONS[palace.name]} có thể chuyển trạng thái khá nhanh khi bối cảnh thay đổi`;
    if (balance.label === "thiên về nâng đỡ")
        conclusion = `Thế cung thiên về nâng đỡ, vì vậy mặt tích cực của chính tinh có điều kiện duy trì đều hơn trong ${PALACE_MANIFESTATIONS[palace.name]}`;
    if (balance.label === "thiên về thử thách")
        conclusion = `Thế cung thiên về thử thách, vì vậy mặt mạnh của chính tinh thường xuất hiện sau khi cá nhân đã xử lý sức cản, độ trễ hoặc mâu thuẫn liên quan tới ${PALACE_MANIFESTATIONS[palace.name]}`;
    return `${parts.join(". ")}. ${conclusion}.`;
}

function compactPalaceSynthesis(palace, contextLabel) {
    const major = getStars(palace, ["major"]);
    const balance = balanceState(palace);
    if (!major.length) {
        return `Khi đặt cung ${palace.name} vào ${contextLabel}, đặc điểm nổi bật là trạng thái vô chính diệu tại ${palace.branch}. Cung này tiếp nhận ảnh hưởng từ hệ sao hội chiếu nhiều hơn từ một trục cố định, nên ${PALACE_MANIFESTATIONS[palace.name]} có xu hướng thay đổi theo môi trường và thời kỳ. Tổng thể phụ tinh hiện tại cho thấy thế cung ${balance.label}.`;
    }
    const roleText = formatList(major.map((star) => `${star.name} gắn với ${MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo"}`));
    const strong = major.filter((star) => ["Miếu", "Vượng", "Đắc", "Lợi"].includes(star.brightness));
    const weak = major.filter((star) => ["Hãm", "Bất"].includes(star.brightness));
    let stateText = `Các chính tinh ở trạng thái trung gian, nên cách biểu hiện phụ thuộc nhiều vào phụ tinh và vận hạn`;
    if (strong.length && !weak.length)
        stateText = `${formatList(strong.map((star) => `${star.name} ở thế ${star.brightness}`))} giúp mặt tích cực của bộ sao hiện ra tương đối rõ`;
    if (weak.length && !strong.length)
        stateText = `${formatList(weak.map((star) => `${star.name} ở thế ${star.brightness}`))} làm mặt căng thẳng của bộ sao xuất hiện sớm hơn mặt thuận`;
    if (strong.length && weak.length)
        stateText = `${formatList(strong.map((star) => `${star.name} ở thế ${star.brightness}`))} tạo lực đẩy, trong khi ${formatList(weak.map((star) => `${star.name} ở thế ${star.brightness}`))} tạo phần cần điều chỉnh`;
    return `Trong ${contextLabel}, cung ${palace.name} tại ${palace.branch} được định hình bởi ${roleText}. ${stateText}. Vì thế, ${PALACE_MANIFESTATIONS[palace.name]} vừa mang dấu ấn của chính tinh, vừa chuyển động theo thế phụ tinh ${balance.label}.`;
}

function compactModifierSynthesis(palace, contextLabel) {
    const support = getStars(palace, ["support"]);
    const challenges = getStars(palace, ["malefic"]);
    const transforms = getStars(palace, ["transform"]);
    const supportRoles = mappedRoleSentences(support, SUPPORT_ROLES, 3);
    const challengeRoles = mappedRoleSentences(challenges, CHALLENGE_ROLES, 3);
    const clauses = [];
    if (supportRoles.length)
        clauses.push(`phần nâng đỡ đến từ ${supportRoles.join("; ")}`);
    else if (support.length)
        clauses.push(`${formatList(support.slice(0, 4).map((star) => star.name))} tạo nền hỗ trợ cho cung`);
    if (challengeRoles.length)
        clauses.push(`phần gây sức ép đến từ ${challengeRoles.join("; ")}`);
    else if (challenges.length)
        clauses.push(`${formatList(challenges.slice(0, 4).map((star) => star.name))} làm tăng độ phức tạp của cung`);
    if (transforms.length)
        clauses.push(`${formatList(transforms.map((star) => star.name))} làm thay đổi hướng biểu hiện của nguồn lực, trách nhiệm, sự ghi nhận hoặc điểm nghẽn`);
    if (palace.hasTuan || palace.hasTriet)
        clauses.push(`${formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""])} tạo độ trễ và buộc quá trình phát triển phải đổi nhịp`);
    if (!clauses.length)
        clauses.push(`cung ít phụ tinh nổi bật, nên chính tinh và hệ hội chiếu giữ vai trò lớn hơn`);
    return `Xét riêng ${contextLabel}, ${clauses.join("; ")}. Những yếu tố này tác động đồng thời lên ${PALACE_MANIFESTATIONS[palace.name]}, tạo ra cách biểu hiện cụ thể của cung thay vì tồn tại như các dấu hiệu tách rời.`;
}

function lifeBodyInteractionParagraph(life, body) {
    if (life.id === body.id)
        return `Mệnh và Thân đồng cung tại ${life.branch}, khiến động lực bên trong và cách hành động khi trưởng thành cùng đi qua một hệ sao. Sự thống nhất này làm đặc tính của ${majorDisplay(life)} xuất hiện khá nhất quán giữa cảm nhận cá nhân, lựa chọn thực tế và trách nhiệm lâu dài.`;
    return `Cung Mệnh tại ${life.branch} mở đầu phản ứng bằng ${formatList(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core || star.name))}, còn cung Thân tại ${body.branch} chuyển phản ứng ấy sang ${PALACE_THEMES[body.name]} qua ${formatList(getStars(body, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core || star.name))}. Sự khác biệt giữa hai cung cho thấy cá nhân có thể cảm nhận vấn đề theo một cách nhưng chỉ thực sự bộc lộ năng lực khi bước vào chủ đề của cung ${body.name}.`;
}

function periodNatalContext(palace, label) {
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `Nền sao gốc của cung ${palace.name} là vô chính diệu, nên ${label.toLowerCase()} phản ứng mạnh với các sao lưu và cung xung chiếu. Diễn biến của giai đoạn dễ đổi nhịp khi môi trường hoặc quan hệ liên quan thay đổi.`;
    const stars = major.map((star) => {
        const profile = MAJOR_PROFILES[star.id] || { core: "đặc tính chủ đạo", tension: "mặt căng thẳng" };
        return `${star.name} ở thế ${star.brightness || "trung bình"} đưa ${profile.core} vào giai đoạn, đồng thời giữ khả năng phát sinh ${profile.tension}`;
    });
    return `Nền sao gốc tại cung ${palace.name} gồm ${stars.join("; ")}. Trong ${label.toLowerCase()}, bộ sao này không tạo một tính cách mới, mà làm rõ cách ${PALACE_MANIFESTATIONS[palace.name]} được biểu hiện khi chủ đề của cung trở thành trọng tâm thời gian.`;
}

function movingBaseName(name) {
    return String(name || "")
        .replace(/^Lưu\s+/, "")
        .replace(/^Nguyệt\s+/, "")
        .replace(/^Nhật\s+/, "")
        .replace(/^Thời\s+/, "");
}

function movingRoleClause(star) {
    const base = movingBaseName(star.name);
    const role = SUPPORT_ROLES[base] || CHALLENGE_ROLES[base] || TRANSFORM_ROLES[base];
    if (role)
        return `${star.name} làm nổi bật ${role}`;
    if (base === "Thái Tuế")
        return `${star.name} xác định khu vực chịu tác động trực tiếp của năm`;
    if (["Nguyệt", "Nhật", "Thời"].includes(base))
        return `${star.name} xác định điểm tập trung của lớp thời gian đang xem`;
    return `${star.name} tạo thêm một lớp kích hoạt tại cung`;
}

function movingParagraph(palace, layerLabel, starArrayName, contextText) {
    const stars = palace[starArrayName] || [];
    if (!stars.length) {
        return `Trong ${layerLabel}, cung ${palace.name} không có điểm nhấn sao lưu trực tiếp. Vì vậy, ${PALACE_MANIFESTATIONS[palace.name]} chủ yếu tiếp tục theo nền sao gốc và chỉ đổi mức biểu hiện khi ${contextText} cùng tác động; đây là nhịp tương đối nền của lĩnh vực, không phải dấu hiệu cho một sự kiện riêng.`;
    }
    const support = stars.filter((item) => item.group.endsWith("support"));
    const challenge = stars.filter((item) => item.group.endsWith("malefic"));
    const cycle = stars.filter((item) => item.group.endsWith("cycle"));
    const movingRoles = (group, roleMap, fallback) => roleSummary(group.map((star) => ({ ...star, name: movingBaseName(star.name) })), roleMap, fallback);
    let conclusion = `${layerLabel} tạo cả phần thuận lẫn phần cần điều chỉnh tại cung ${palace.name}`;
    if ((support.length > 0 && challenge.length === 0) || support.length >= challenge.length + 2)
        conclusion = `${layerLabel} tạo điều kiện thuận hơn bình thường cho ${PALACE_MANIFESTATIONS[palace.name]}`;
    if ((challenge.length > 0 && support.length === 0) || challenge.length >= support.length + 2)
        conclusion = `${layerLabel} dễ làm ${PALACE_MANIFESTATIONS[palace.name]} xuất hiện thêm độ trễ, va chạm hoặc nhu cầu điều chỉnh`;
    const technical = formatList([...cycle, ...support, ...challenge].slice(0, 5).map((star) => star.name));
    const supportText = support.length ? `Điểm thuận liên quan đến ${movingRoles(support, SUPPORT_ROLES, "khả năng nhận hỗ trợ và chủ động xử lý")}` : "Chiều nâng đỡ không tạo điểm nhấn riêng tại bản cung";
    const challengeText = challenge.length ? `phần cần thận trọng liên quan đến ${movingRoles(challenge, CHALLENGE_ROLES, "sức cản hoặc thay đổi ngoài dự tính")}` : "phần gây sức ép không nổi trội tại bản cung";
    return `${conclusion}. Trong cách đọc kỹ thuật, ${technical} cùng hội tại cung ${palace.name}; khi tổng hợp theo nhóm chức năng, ${supportText.charAt(0).toLowerCase()}${supportText.slice(1)}, còn ${challengeText}. Tác động này chỉ thu hẹp thời điểm biểu hiện của ${PALACE_THEMES[palace.name]} và vẫn phải đặt dưới ${contextText}, thay vì được dùng như một kết luận độc lập.`;
}

function palaceEvidence(palace, groups = ["major", "support", "malefic", "transform"]) {
    const stars = getStars(palace, groups);
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function selectedStarEvidence(palace, stars) {
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function roleSummary(stars, roleMap, fallback) {
    const roles = unique(stars.map((star) => roleMap[star.name])).slice(0, 3);
    return roles.length ? formatList(roles) : fallback;
}

function palaceMainClaim(palace) {
    const major = getStars(palace, ["major"]);
    const balance = balanceState(palace);
    const lead = PALACE_LEADS[palace.name];
    if (!major.length)
        return palace.id % 2
            ? `${lead} có xu hướng linh hoạt và đổi theo hoàn cảnh nhiều hơn là đi theo một khuôn cố định`
            : `Không có một chính tinh làm trục cố định, ${lead.toLowerCase()} thường thích nghi theo môi trường và các cung liên hệ`;
    const cores = formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 3));
    const ending = balance.label === "thiên về nâng đỡ"
        ? "được duy trì tương đối liền mạch"
        : balance.label === "thiên về thử thách"
            ? "thường chỉ hình thành sau một vài lần điều chỉnh"
            : "thay đổi khá rõ theo môi trường và cách xử lý áp lực";
    if (palace.id % 3 === 0)
        return `Nổi bật trong ${lead.toLowerCase()} là ${cores}; nhịp phát triển ${ending}`;
    if (palace.id % 3 === 1)
        return `${lead} lấy ${cores} làm nền và ${ending}`;
    return `${cores.charAt(0).toUpperCase()}${cores.slice(1)} định hình ${lead.toLowerCase()}, trong khi độ ổn định ${ending}`;
}

function palaceParagraphs(palaces, palace, movingLayers = []) {
    const major = getStars(palace, ["major"]);
    const support = [...getStars(palace, ["support"]), ...getStars(palace, ["transform"]).filter((star) => star.name !== "Hóa Kỵ")];
    const challenges = [...getStars(palace, ["malefic"]), ...getStars(palace, ["transform"]).filter((star) => star.name === "Hóa Kỵ")];
    const { triadPalaces, opposite } = relationSet(palaces, palace);
    const related = [...triadPalaces, opposite];
    const insights = [];
    insights.push((0, content_pipeline_1.createAtomicInsight)({
        ruleId: `palace-${palace.id}-natal-core`,
        topic: palace.name,
        polarity: "neutral",
        strength: 8,
        evidence: palaceEvidence(palace, ["major"]),
        claim: palaceMainClaim(palace),
        explanation: major.length
            ? `Trong cách đọc Tử Vi, căn cứ chính là ${majorDisplay(palace)} tại ${palace.name}; trạng thái của bộ chính tinh cho biết mặt thuận dễ phát huy trực tiếp hay cần đi qua va vấp trước khi ổn định`
            : `Cung ${palace.name} tại ${palace.branch} là cung vô chính diệu, nên kết luận phải dựa nhiều hơn vào phụ tinh, tam phương tứ chính và đối cung thay vì gán một nét cố định`,
        manifestations: [`Trong đời sống, xu hướng này thường đi vào ${PALACE_MANIFESTATIONS[palace.name]}`],
        conditions: [palace.id % 3 === 0
            ? `khi hoàn cảnh cho phép phát huy ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"}, mặt thuận dễ rõ hơn; khi áp lực kéo dài, phần gây cản trở dễ nổi lên`
            : palace.id % 3 === 1
                ? `mặt tích cực rõ hơn khi hoàn cảnh cho phép phát huy ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"}; mặt khó nổi lên khi áp lực kéo dài hoặc các yếu tố gây cản trở cùng được kích hoạt`
                : `khả năng phát huy phụ thuộc việc môi trường có nâng đỡ ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"} hay đồng thời tạo thêm sức ép`],
        advice: `Điểm cần lưu ý là đây là đặc điểm nền của cung ${palace.name}, không phải một sự kiện chắc chắn hay kết luận cho mọi giai đoạn`,
        primaryPalace: palace.id
    }));
    if (support.length) {
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `palace-${palace.id}-support`,
            topic: palace.name,
            polarity: "supportive",
            strength: 4 + Math.min(2, support.length / 4),
            evidence: selectedStarEvidence(palace, support),
            claim: `Điểm thuận của cung nằm ở ${roleSummary(support, { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, "khả năng nhận hỗ trợ và điều phối nguồn lực")}`,
            explanation: `Các yếu tố ${formatList(support.slice(0, 5).map((star) => star.name))} cùng củng cố chiều này, nhưng được đọc như một nhóm chức năng thay vì các lời giải rời cho từng sao`,
            manifestations: [`Nhờ đó, ${PALACE_MANIFESTATIONS[palace.name]} có thể giữ nhịp tốt hơn khi nguồn lực và quan hệ hỗ trợ hiện diện đúng lúc`],
            conditions: [`khả năng này phát huy rõ hơn khi các cung tam hợp cùng có nền hỗ trợ hoặc khi vận đang xét kích hoạt đúng trục`],
            primaryPalace: palace.id
        }));
    }
    if (challenges.length || palace.hasTuan || palace.hasTriet) {
        const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `palace-${palace.id}-challenge`,
            topic: palace.name,
            polarity: "challenging",
            strength: 4 + Math.min(2, (challenges.length + Number(Boolean(blockers))) / 4),
            evidence: selectedStarEvidence(palace, challenges),
            claim: `độ ổn định có thể giảm khi ${roleSummary(challenges, CHALLENGE_ROLES, "sức cản hoặc độ trễ")} xuất hiện cùng lúc`,
            explanation: `${formatList(challenges.slice(0, 5).map((star) => star.name)) || "Các yếu tố gây cản trở"}${blockers ? ` cùng ${blockers}` : ""} làm nhịp biểu hiện dễ ngắt, chậm hoặc phải đổi cách xử lý`,
            manifestations: [`Mặt khó thường thể hiện ở ${PALACE_MANIFESTATIONS[palace.name]}, nhất là khi cá nhân phải phản ứng nhanh trong một hoàn cảnh thiếu ổn định`],
            conditions: [`đây là phần điều chỉnh của cung; nó rõ hơn khi vận cùng gây sức ép và nhẹ hơn khi tam phương có đủ yếu tố nâng đỡ`],
            primaryPalace: palace.id
        }));
    }
    const relatedSupport = related.reduce((sum, item) => sum + balanceState(item).support, 0);
    const relatedChallenge = related.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let relationClaim = `Xu hướng của ${palace.name} thay đổi theo cách các lĩnh vực liên quan phối hợp với nhau`;
    if (relatedSupport >= relatedChallenge + 5)
        relationClaim = `Các cung liên hệ tạo thêm nền nâng đỡ, giúp chủ đề ${palace.name} có đường triển khai liền mạch hơn`;
    if (relatedChallenge >= relatedSupport + 5)
        relationClaim = `Các cung liên hệ tạo áp lực đáng kể, nên điểm mạnh của ${palace.name} thường được dùng để thích nghi và điều chỉnh hơn là giữ nguyên một hoàn cảnh`;
    insights.push((0, content_pipeline_1.createAtomicInsight)({
        ruleId: `palace-${palace.id}-relations`,
        topic: palace.name,
        polarity: relatedSupport >= relatedChallenge + 5 ? "supportive" : relatedChallenge >= relatedSupport + 5 ? "challenging" : "neutral",
        strength: 3.5,
        evidence: related.flatMap((item) => palaceEvidence(item, ["major", "support", "malefic", "transform"])),
        claim: relationClaim,
        explanation: `Tam phương tứ chính nối ${palace.name} với ${formatList(triadPalaces.map((item) => item.name))} và đối cung ${opposite.name}; vì vậy ${PALACE_THEMES[palace.name]} không được đọc như một ô độc lập`,
        manifestations: [`Sự liên hệ này giải thích vì sao thay đổi ở ${formatList(related.map((item) => PALACE_THEMES[item.name]))} có thể làm cách biểu hiện của ${palace.name} đổi theo`],
        conditions: [`ảnh hưởng liên cung rõ nhất khi nhiều cung trong cùng trục được một lớp vận kích hoạt, còn ở lá số gốc đây vẫn là khuynh hướng nền`],
        primaryPalace: palace.id,
        relatedPalaces: related.map((item) => item.id),
        relationType: "tam_hop_doi_cung"
    }));
    const detail = palace.stars.length + (palace.hasTuan ? 2 : 0) + (palace.hasTriet ? 2 : 0);
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: detail >= 12 ? 4 : detail >= 7 ? 3 : 2 });
}

function makeItem(id, topic, title, paragraphs) {
    const cleanParagraphs = paragraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean);
    return { id, topic, title, paragraphs: cleanParagraphs, body: cleanParagraphs.join("\n\n") };
}

function repeatedFocusParagraph(palaces, focusIds, label) {
    const counts = new Map();
    focusIds.filter(Boolean).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ palace: getPalace(palaces, id), count }));
    const repeated = ranked.filter((item) => item.count > 1);
    if (repeated.length) {
        return `${label} có sự chồng lớp tại ${formatList(repeated.map((item) => `${item.palace.name} ở ${item.palace.branch}`))}. Khi một cung đồng thời xuất hiện ở nhiều tầng vận, chủ đề của cung đó thường trở thành trục chính và các sự kiện liên quan có xu hướng biểu hiện rõ hơn so với những cung chỉ xuất hiện một lần.`;
    }
    return `${label} phân bố trên nhiều cung khác nhau. Điều này cho thấy diễn biến không tập trung hoàn toàn vào một lĩnh vực, thay vào đó được chia thành nhiều đầu mối và cần đọc theo thứ tự từ đại vận đến lớp thời gian hẹp hơn.`;
}

function thematicSynthesis(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((item) => item.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((item) => item.name === name)).filter(Boolean);
    const all = [primary, ...related];
    const supportScore = all.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challengeScore = all.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    const topicManifestations = {
        "Sự nghiệp": "kiểu môi trường phù hợp, mức chủ động, cách nhận trách nhiệm và khả năng phối hợp với người khác",
        "Tài chính": "khả năng tạo thu nhập, cách tích lũy, độ biến động của dòng tiền và phản ứng trước cơ hội",
        "Tình cảm": "cách hình thành cam kết, nhu cầu về khoảng riêng và phương thức xử lý khác biệt",
        "Gia đình và quan hệ": "mức gần gũi, cách chia sẻ trách nhiệm và ranh giới giữa các thế hệ hoặc nhóm quan hệ",
        "Sức khỏe và nhịp sống": "sức bền, mức tiêu hao khi căng thẳng và khả năng duy trì nhịp sinh hoạt ổn định"
    };
    const mainPolarity = supportScore >= challengeScore + 5 ? "supportive" : challengeScore >= supportScore + 5 ? "challenging" : "mixed";
    const mainClaim = mainPolarity === "supportive"
        ? `${title} có nền thuận tương đối rõ, nhưng kết quả vẫn phụ thuộc cách nguồn lực được duy trì trong thực tế`
        : mainPolarity === "challenging"
            ? `${title} thường phát triển qua điều chỉnh và thay đổi nhịp hơn là theo một đường hoàn toàn ổn định`
            : `${title} có cả khả năng phát triển lẫn điểm dễ gây gián đoạn, nên điều quan trọng nằm ở cách hai chiều này được cân bằng`;
    const insights = [(0, content_pipeline_1.createAtomicInsight)({
        ruleId: `theme-${primary.id}-main`,
        topic: title,
        polarity: mainPolarity,
        strength: 5,
        evidence: all.flatMap((item) => palaceEvidence(item)),
        claim: mainClaim,
        explanation: `Căn cứ chính nằm ở cung ${primary.name} tại ${primary.branch}, sau đó được đối chiếu với ${formatList(related.map((item) => `${item.name} tại ${item.branch}`))}; bộ chính tinh ${majorDisplay(primary)} tạo trục, còn các cung liên hệ cho biết trục ấy được hỗ trợ hay bị điều chỉnh ra sao`,
        manifestations: [`Trong đời sống, cấu trúc này thường thể hiện qua ${topicManifestations[title] || PALACE_MANIFESTATIONS[primary.name]}`],
        conditions: [`mặt thuận rõ hơn khi các cung liên hệ cùng nâng đỡ; nếu một cung trọng yếu chịu nhiều sức ép, kết quả dễ đổi nhịp dù bản cung vẫn có năng lực`],
        advice: title === "Sức khỏe và nhịp sống"
            ? "Nội dung chỉ mô tả khuynh hướng về nhịp sinh hoạt và sức bền, không thay thế đánh giá hoặc chẩn đoán y khoa"
            : `Phần này mô tả khuynh hướng của ${title.toLowerCase()}, không khẳng định một kết quả cố định hay thay thế quyết định thực tế`,
        primaryPalace: primary.id,
        relatedPalaces: related.map((item) => item.id),
        relationType: "functional"
    })];
    const transforms = all.flatMap((item) => getStars(item, ["transform"]));
    if (transforms.length) {
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `theme-${primary.id}-transforms`,
            topic: title,
            polarity: transforms.some((star) => star.name === "Hóa Kỵ") ? "mixed" : "supportive",
            strength: 4,
            evidence: all.flatMap((item) => palaceEvidence(item, ["transform"])),
            claim: `Khả năng tiếp nhận nguồn lực, nắm quyền chủ động, được ghi nhận hoặc gặp điểm nghẽn là lớp điều chỉnh đáng chú ý của chủ đề này`,
            explanation: `Trong cách đọc Tử Vi, nhóm Tứ Hóa ${formatList(transforms.map((star) => star.name))} xuất hiện trong cụm cung liên quan, nên tác động được tổng hợp theo toàn trục thay vì gán mỗi sao cho một kết luận riêng`,
            manifestations: [`Sự điều chỉnh thường đi vào ${topicManifestations[title] || PALACE_MANIFESTATIONS[primary.name]} và có thể làm cùng một năng lực biểu hiện khác nhau theo từng giai đoạn`],
            conditions: [`Tứ Hóa chỉ làm rõ hướng vận hành đã có sẵn; mức biểu hiện còn phụ thuộc chính tinh, phụ tinh và lớp vận đang kích hoạt`],
            primaryPalace: primary.id,
            relatedPalaces: related.map((item) => item.id),
            relationType: "functional"
        }));
    }
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: 3 });
}

function periodParagraphs(palaces, palace, label, contextIds, movingConfig) {
    const balance = balanceState(palace, movingConfig ? [movingConfig.arrayName] : []);
    const contextPalaces = contextIds.filter(Boolean).map((id) => getPalace(palaces, id));
    const main = (0, content_pipeline_1.createAtomicInsight)({
        ruleId: `period-${label}-${palace.id}-main`,
        topic: label,
        polarity: balance.label === "thiên về nâng đỡ" ? "supportive" : balance.label === "thiên về thử thách" ? "challenging" : "mixed",
        strength: 5,
        evidence: palaceEvidence(palace),
        claim: `${label} làm ${PALACE_LEADS[palace.name].toLowerCase()} trở thành trọng tâm rõ hơn bình thường`,
        explanation: `Lớp vận này đi vào cung ${palace.name} tại ${palace.branch}, nơi có ${majorDisplay(palace)} làm nền; vì vậy vận chỉ tăng hoặc điều chỉnh mức biểu hiện của một xu hướng sẵn có, không tạo thành đặc điểm cả đời mới`,
        manifestations: [`Trong giai đoạn này, trọng tâm thường đi vào ${PALACE_MANIFESTATIONS[palace.name]}`],
        conditions: [`mặt thuận dễ phát huy khi nền sao gốc và các lớp vận lớn hơn cùng hướng; nếu hai lớp trái chiều, diễn biến thường xuất hiện theo từng đợt và cần đọc theo lớp thời gian dài trước`],
        primaryPalace: palace.id,
        relatedPalaces: contextPalaces.map((item) => item.id),
        relationType: "fortune_activation"
    });
    const network = (0, content_pipeline_1.createAtomicInsight)({
        ruleId: `period-${label}-${palace.id}-network`,
        topic: label,
        polarity: "neutral",
        strength: 4,
        evidence: [palace, ...contextPalaces].flatMap((item) => palaceEvidence(item)),
        claim: `Ý nghĩa của giai đoạn hình thành từ sự liên kết giữa ${palace.name} và ${formatList(contextPalaces.map((item) => item.name)) || "nền lá số"}, không phải từ một cung riêng lẻ`,
        explanation: (0, patterns_1.buildActivationParagraph)(palaces, [palace.id, ...contextIds], `Xét toàn bộ chuỗi thời gian`),
        manifestations: [`Một thay đổi ở cung trọng tâm có thể lan sang ${formatList(contextPalaces.map((item) => PALACE_THEMES[item.name])) || "những lĩnh vực liên hệ"}, nhưng mức độ phụ thuộc thứ tự Đại hạn, Tiểu hạn, vận năm và lớp thời gian hẹp hơn`],
        conditions: [`sự chồng lớp tại cùng một cung làm chủ đề rõ hơn; khi các lớp phân tán, diễn biến có xu hướng chia thành nhiều đầu mối`],
        primaryPalace: palace.id,
        relatedPalaces: contextPalaces.map((item) => item.id),
        relationType: "fortune_activation"
    });
    const insights = [main, network];
    if (movingConfig) {
        const moving = palace[movingConfig.arrayName] || [];
        const movingSupport = moving.filter((star) => star.group.endsWith("support"));
        const movingChallenge = moving.filter((star) => star.group.endsWith("malefic"));
        const movingRoleText = [
            movingSupport.length ? `phần thuận liên quan đến ${roleSummary(movingSupport.map((star) => ({ ...star, name: movingBaseName(star.name) })), SUPPORT_ROLES, "khả năng nhận hỗ trợ")}` : "",
            movingChallenge.length ? `phần cần thận trọng liên quan đến ${roleSummary(movingChallenge.map((star) => ({ ...star, name: movingBaseName(star.name) })), CHALLENGE_ROLES, "sức cản hoặc thay đổi ngoài dự tính")}` : ""
        ].filter(Boolean);
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `period-${label}-${palace.id}-${movingConfig.arrayName}`,
            topic: label,
            polarity: balance.label === "thiên về nâng đỡ" ? "supportive" : balance.label === "thiên về thử thách" ? "challenging" : "mixed",
            strength: 4.5,
            evidence: [{ palaceId: palace.id, layer: movingConfig.arrayName, starIds: moving.map((star) => star.id) }],
            claim: moving.length
                ? `Trong lớp thời gian hẹp hơn, nhịp của cung ${palace.name} ${balance.label === "thiên về nâng đỡ" ? "được hỗ trợ rõ hơn" : balance.label === "thiên về thử thách" ? "dễ có thêm độ trễ hoặc áp lực" : "đan xen cơ hội với phần cần điều chỉnh"}`
                : `Lớp thời gian hẹp hơn không tạo thêm một điểm nhấn sao lưu trực tiếp tại cung ${palace.name}`,
            explanation: moving.length
                ? `Nhóm sao lưu tại cung gồm ${formatList(moving.slice(0, 5).map((star) => star.name))}; khi tổng hợp theo chức năng, ${formatList(movingRoleText) || "trọng tâm thời gian được xác định rõ hơn"}, thay vì tách thành các lời phán riêng`
                : `Trọng tâm vẫn do nền sao gốc và quan hệ với ${movingConfig.context} quyết định`,
            manifestations: [`Biểu hiện thường thu hẹp vào ${PALACE_MANIFESTATIONS[palace.name]} trong ${movingConfig.label}`],
            conditions: [`lớp thời gian này chỉ cho biết thời điểm một xu hướng dễ nổi lên, không đủ để kết luận sự kiện dài hạn nếu đứng một mình`],
            primaryPalace: palace.id,
            relationType: "fortune_activation"
        }));
    }
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: movingConfig ? 3 : 2 });
}

function timelineParagraphs(palaces, activeDecadePalaceId) {
    const ordered = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
    const activeIndex = Math.max(0, ordered.findIndex((palace) => palace.id === activeDecadePalaceId));
    const start = Math.max(0, Math.min(ordered.length - 4, activeIndex - 1));
    const selected = ordered.slice(start, start + 4);
    return selected.map((palace, index) => {
        const previous = index ? selected[index - 1] : ordered[start - 1];
        const balance = balanceState(palace);
        const transition = previous
            ? `So với giai đoạn ${previous.decadeStart}-${previous.decadeEnd} tuổi, trọng tâm chuyển từ ${PALACE_THEMES[previous.name]} sang ${PALACE_THEMES[palace.name]}`
            : `Đây là một trong những giai đoạn đầu của chuỗi Đại hạn được hiển thị trong báo cáo`;
        let tone = `thế cung đan xen yếu tố nâng đỡ và gây sức ép, nên quá trình thường có cả phần phát triển lẫn phần phải điều chỉnh`;
        if (balance.label === "thiên về nâng đỡ")
            tone = `thế cung có nhiều yếu tố nâng đỡ hơn, tạo điều kiện để chủ đề này được duy trì tương đối liền mạch`;
        if (balance.label === "thiên về thử thách")
            tone = `thế cung có nhiều yếu tố gây sức ép hơn, nên điểm mạnh thường được hình thành qua thay đổi nhịp hoặc xử lý trở lực`;
        const current = palace.id === activeDecadePalaceId ? " Đây là Đại hạn hiện tại theo tuổi mụ đang dùng trong lá số." : "";
        return `${palace.decadeStart}-${palace.decadeEnd} tuổi là giai đoạn ${PALACE_LEADS[palace.name].toLowerCase()} nổi lên rõ hơn. ${transition}; ${tone}.${current}`;
    });
}

function overviewTopicParagraph(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((palace) => palace.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((palace) => palace.name === name)).filter(Boolean);
    const cluster = [primary, ...related];
    const support = cluster.reduce((sum, palace) => sum + balanceState(palace).support, 0);
    const challenge = cluster.reduce((sum, palace) => sum + balanceState(palace).challenge, 0);
    const tone = support >= challenge + 5
        ? "có nền nâng đỡ rõ hơn phần gây sức ép"
        : challenge >= support + 5
            ? "thường phát triển qua nhiều lần điều chỉnh hơn là theo một nhịp cố định"
            : "đan xen khả năng phát triển với phần cần điều chỉnh theo hoàn cảnh";
    const focus = {
        "Sự nghiệp": "Trọng tâm nằm ở cách nhận trách nhiệm, mức chủ động và sự thích nghi với môi trường làm việc",
        "Tài chính": "Điểm đáng chú ý là mối liên hệ giữa khả năng tạo thu nhập, nhịp nghề nghiệp và cách giữ nguồn lực",
        "Tình cảm": "Trục quan hệ tập trung vào cách hình thành cam kết, nhu cầu phối hợp và khoảng riêng của mỗi bên",
        "Gia đình và quan hệ": "Nền gia đình được nhìn qua cách chia sẻ trách nhiệm, giữ ranh giới và duy trì sự nâng đỡ",
        "Sức khỏe và nhịp sống": "Phần thể trạng chỉ tập trung vào sức bền, áp lực và nhịp sinh hoạt"
    }[title] || `Trọng tâm nằm ở ${PALACE_MANIFESTATIONS[primary.name]}`;
    return `${title} ${tone}. ${focus}. Kết luận này được tổng hợp từ cung ${primary.name} cùng ${formatList(related.map((palace) => palace.name))}, nên thay đổi ở một trục có thể làm cách biểu hiện của toàn chủ đề đổi theo.`;
}

function buildInterpretations(params) {
    const {
        palaces,
        annualStars,
        monthlyStars,
        dailyStars,
        hourlyStars,
        viewScope = "legacy",
        monthlyFortunes = [],
        lifePalace,
        bodyPalace,
        nominalAge,
        birthElement,
        bureauElement,
        bureauLabel,
        activeDecadePalaceId,
        annualDecadePalaceId,
        minorFortunePalaceId,
        yearBranchPalaceId,
        monthlyPalaceId,
        dailyPalaceId,
        hourlyPalaceId,
        viewYear,
        viewYearCanChi,
        viewMonth,
        viewLeap,
        monthCanChi,
        viewDay,
        viewDayCanChi,
        viewHourBranch,
        viewHourCanChi
    } = params;
    const items = [];
    const life = getPalace(palaces, lifePalace);
    const body = getPalace(palaces, bodyPalace);
    const activeDecade = activeDecadePalaceId ? getPalace(palaces, activeDecadePalaceId) : null;
    const annualDecade = annualDecadePalaceId ? getPalace(palaces, annualDecadePalaceId) : null;
    const minorFortune = minorFortunePalaceId ? getPalace(palaces, minorFortunePalaceId) : null;
    const yearBranchPalace = yearBranchPalaceId ? getPalace(palaces, yearBranchPalaceId) : null;
    const monthlyPalace = monthlyPalaceId ? getPalace(palaces, monthlyPalaceId) : null;
    const dailyPalace = dailyPalaceId ? getPalace(palaces, dailyPalaceId) : null;
    const hourlyPalace = hourlyPalaceId ? getPalace(palaces, hourlyPalaceId) : null;
    const hasAnnualScope = Number.isInteger(viewYear) && Boolean(minorFortune) && Boolean(yearBranchPalace);
    const bureauRelation = (0, fortune_1.getElementRelation)(birthElement, bureauElement);

    const configurationParagraphs = (0, patterns_1.buildConfigurationParagraphs)(palaces, life.id);
    const adjacentParagraphs = (0, patterns_1.buildAdjacentParagraphs)(palaces, life.id);
    const lifeBalance = balanceState(life);
    const bodyAxis = body.id === life.id
        ? `Mệnh và Thân đồng cung tại ${life.branch}, nên cách cảm nhận và cách hành động lâu dài có xu hướng nhất quán hơn`
        : `Mệnh tại ${life.branch} tạo phản ứng ban đầu, còn Thân cư ${body.name} tại ${body.branch} chuyển phản ứng ấy vào ${PALACE_THEMES[body.name]}`;
    items.push(makeItem("overview-structure", "Tổng quan", "Khí chất và trục phát triển", [
        `${palaceMainClaim(life)}. ${bodyAxis}. Vì vậy, điểm đáng chú ý không chỉ là khí chất bên trong mà còn là cách khí chất ấy được đưa vào lựa chọn và trách nhiệm thực tế theo thời gian.`,
        `Căn cứ chuyên môn nằm ở cung Mệnh có ${majorDisplay(life)}, cung Thân có ${majorDisplay(body)} và quan hệ Mệnh - Cục ${bureauRelation.description}. ${configurationParagraphs[0] || adjacentParagraphs[0] || `Tam phương tứ chính của Mệnh cho thấy thế cung ${lifeBalance.label}, nên các mặt thuận và phần gây sức ép phải được đọc cùng nhau.`}`,
        `Trục chi phối nhiều phần của lá số là sự chuyển tiếp từ ${PALACE_THEMES[life.name]} sang ${PALACE_THEMES[body.name]}. Đây là sợi nối giữa khí chất, công việc, nguồn lực và quan hệ; các phần sau mở rộng từng mặt của cùng một cấu trúc thay vì đưa ra những kết luận rời nhau.`
    ]));

    items.push(makeItem("overview-capacity", "Tổng quan", "Năng lực và điểm tạo áp lực", [
        `${palaceMainClaim(life)}. Điểm thuận nằm ở ${roleSummary(getStars(life, ["support"]), SUPPORT_ROLES, "khả năng duy trì và điều phối nguồn lực")}; phần dễ tạo áp lực liên quan đến ${roleSummary(getStars(life, ["malefic"]), CHALLENGE_ROLES, "độ trễ hoặc mâu thuẫn khi hoàn cảnh thay đổi")}. Hai mặt cùng tồn tại nên năng lực thường rõ nhất trong cách xử lý tình huống thực tế, không phải ở một nhãn tính cách cố định.`,
        `Căn cứ tại cung Mệnh gồm phụ tinh và Tứ Hóa ${formatList(getStars(life, ["support", "transform"]).slice(0, 5).map((star) => star.name)) || "không có điểm nhấn riêng"}, đồng thời có nhóm gây sức ép ${formatList(getStars(life, ["malefic"]).slice(0, 5).map((star) => star.name)) || "không nổi trội"}. Tam phương tứ chính nối Mệnh với ${formatList(relationSet(palaces, life).triadPalaces.map((palace) => palace.name))} và ${relationSet(palaces, life).opposite.name}, vì vậy mặt mạnh hay mặt khó chỉ nổi rõ khi các lĩnh vực này cùng tạo điều kiện tương ứng.`
    ]));

    items.push(makeItem("overview-work", "Tổng quan", "Công việc và nguồn lực", [
        overviewTopicParagraph(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"]),
        overviewTopicParagraph(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])
    ]));

    items.push(makeItem("overview-relations", "Tổng quan", "Quan hệ và nền tinh thần", [
        overviewTopicParagraph(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"]),
        overviewTopicParagraph(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Nô Bộc"])
    ]));

    items.push(makeItem("overview-timeline", "Tổng quan", "Dòng thời gian nổi bật", [
        `Các mốc dưới đây là Đại hạn 10 năm và đều dùng tuổi mụ theo cùng quy ước với tuổi đang hiển thị trên lá số. Mỗi giai đoạn cho biết chủ đề nào dễ nổi lên hơn, không phải danh sách tuổi tốt, tuổi xấu hay sự kiện chắc chắn.`,
        ...timelineParagraphs(palaces, activeDecadePalaceId)
    ]));

    if (hasAnnualScope) {
        items.push(makeItem("overview-period", "Tổng quan", `Trục vận hạn năm ${viewYearCanChi}`, [
            `Điểm khác của năm ${viewYearCanChi} so với nền lá số là trọng tâm tạm thời chuyển sang ${formatList(unique([activeDecade, annualDecade, minorFortune, yearBranchPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}. Ở tuổi mụ ${nominalAge}, ${activeDecade ? `năm này nằm trong Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "lá số chưa bước vào Đại hạn 10 năm đầu tiên"}; các lớp ngắn hơn chỉ điều chỉnh mức độ và thời điểm biểu hiện của bối cảnh đó.`,
            repeatedFocusParagraph(palaces, [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId, monthlyPalaceId], `Các lớp vận trong năm ${viewYear}`),
            `Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, Tiểu hạn ở ${minorFortune.name}, còn Lưu Thái Tuế tại ${yearBranchPalace.name}. Chuỗi này cho biết năm dễ nhấn mạnh ${formatList(unique([annualDecade, minorFortune, yearBranchPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}, nhưng không đủ để khẳng định một sự kiện cụ thể.`
        ]));
    }

    items.push(makeItem("life-detail", "Mệnh - Thân", `Mối liên hệ giữa Mệnh và Thân`, [
        `${palaceMainClaim(life)}. Đây là “con người nền”: cách tiếp nhận hoàn cảnh và phản ứng trước khi trách nhiệm thực tế buộc phải lựa chọn. Cung Mệnh tại ${life.branch} có ${majorDisplay(life)}, còn phụ tinh và tam phương quyết định mặt nào của bộ sao dễ biểu hiện rõ hơn.`,
        body.id === life.id
            ? `Mệnh và Thân đồng cung nên phần cảm nhận bên trong và cách đi vào đời sống thực tế cùng dùng một hệ sao. ${lifeBodyInteractionParagraph(life, body)} Điểm mạnh là tính nhất quán; mặt cần điều chỉnh là một áp lực tại cung này có thể đồng thời ảnh hưởng tới cả cách nghĩ lẫn cách hành động.`
            : `Thân cư ${body.name} cho thấy khí chất của Mệnh chỉ bộc lộ đầy đủ khi đi vào ${PALACE_THEMES[body.name]}. Cung Thân có ${majorDisplay(body)}, vì vậy ${formatList(getStars(body, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core)) || "ảnh hưởng của hệ hội chiếu"} là cách nền tính khí được chuyển thành lựa chọn, trách nhiệm và kết quả cụ thể.`,
        body.id === life.id
            ? `Tam phương tứ chính của cung đồng Mệnh - Thân nối trục này với ${formatList(relationSet(palaces, life).triadPalaces.map((item) => PALACE_THEMES[item.name]))} và ${PALACE_THEMES[relationSet(palaces, life).opposite.name]}. Bối cảnh liên cung quyết định đặc tính nhất quán ấy trở thành thế mạnh hay áp lực trong từng giai đoạn.`
            : `Hai cung tạo hai lớp khác nhau: Mệnh thiên về ${formatList(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core)) || "phản ứng theo môi trường"}, còn Thân đưa trọng tâm sang ${PALACE_THEMES[body.name]}. Khi hai lớp cùng chiều, hành động dễ nhất quán với suy nghĩ; khi trái chiều, cá nhân có thể cần thời gian để biến điều mình nhận thấy thành lựa chọn phù hợp.`,
        `Khái quát lại, Mệnh giải thích khuynh hướng tương đối ổn định, còn Thân cho biết khuynh hướng đó tập trung vào đâu khi trưởng thành. Các vận hạn chỉ kích hoạt hoặc điều chỉnh mức biểu hiện của hai nền này, không tạo ra một “con người mới” tách khỏi lá số gốc.`
    ]));

    palaces.forEach((palace) => {
        items.push(makeItem(`palace-${palace.id}`, "12 cung", `${palace.name} tại ${palace.branch}`, palaceParagraphs(palaces, palace)));
    });

    items.push(makeItem("career-synthesis", "Sự nghiệp", "Cấu trúc nghề nghiệp và vị trí xã hội", thematicSynthesis(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"])));
    items.push(makeItem("finance-synthesis", "Tài chính", "Khả năng tạo lập và giữ nguồn lực", thematicSynthesis(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])));
    items.push(makeItem("relationship-synthesis", "Tình cảm", "Mẫu hình quan hệ gắn bó", thematicSynthesis(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"])));
    items.push(makeItem("family-synthesis", "Gia đình - Quan hệ", "Nền tảng gia đình và mạng lưới quan hệ", thematicSynthesis(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Tử Tức", "Nô Bộc"])));
    items.push(makeItem("health-synthesis", "Sức khỏe - Nhịp sống", "Thể trạng và phản ứng trước áp lực", [
        ...thematicSynthesis(palaces, "Sức khỏe và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]),
        "Phần này chỉ mô tả khuynh hướng nhịp năng lượng và phản ứng trước áp lực theo hệ thống Tử Vi truyền thống. Nội dung không thay thế đánh giá y khoa hoặc chẩn đoán sức khỏe."
    ]));

    if (viewScope === "natal_overview") {
        [...palaces].sort((a, b) => a.decadeStart - b.decadeStart).forEach((decade, index, ordered) => {
            const previous = ordered[index - 1];
            const next = ordered[index + 1];
            const paragraphs = periodParagraphs(palaces, decade, `Đại hạn ${decade.decadeStart}-${decade.decadeEnd} tuổi`, [], null);
            paragraphs.push(`${previous ? `Giai đoạn trước nhấn mạnh ${PALACE_THEMES[previous.name]}` : "Đây là Đại hạn đầu tiên trong chuỗi"}; giai đoạn này chuyển trọng tâm sang ${PALACE_THEMES[decade.name]}${next ? `, trước khi giai đoạn kế tiếp hướng sang ${PALACE_THEMES[next.name]}` : " và khép lại dải Đại hạn đang trình bày"}. Chuỗi tuổi mô tả sự đổi trọng tâm theo thời gian, không khẳng định sự kiện chắc chắn.`);
            items.push(makeItem(`decade-${decade.decadeStart}`, "Đại vận", `Đại hạn ${decade.decadeStart}-${decade.decadeEnd} tuổi`, paragraphs));
        });
    }
    else if (activeDecade) {
        const orderedDecades = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
        const activeIndex = orderedDecades.findIndex((palace) => palace.id === activeDecade.id);
        const previous = orderedDecades[activeIndex - 1];
        const next = orderedDecades[activeIndex + 1];
        const decadeCopy = periodParagraphs(
            palaces,
            activeDecade,
            `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`,
            [annualDecadePalaceId, minorFortunePalaceId],
            null
        );
        decadeCopy.push(`${previous ? `Giai đoạn trước đặt trọng tâm ở ${PALACE_THEMES[previous.name]}` : "Đây là Đại hạn đầu trong chuỗi hiện có"}, còn Đại hạn hiện tại chuyển sang ${PALACE_THEMES[activeDecade.name]}.${next ? ` Giai đoạn kế tiếp sẽ chuyển trọng tâm sang ${PALACE_THEMES[next.name]}, vì vậy thời kỳ này đóng vai trò ${activeDecade.name === next.name ? "củng cố" : "chuyển tiếp"} giữa hai hướng phát triển.` : " Đây là giai đoạn cuối trong dải Đại hạn được tính."} So sánh này mô tả sự thay đổi trọng tâm, không khẳng định một sự kiện sẽ xảy ra ở tuổi cụ thể.`);
        items.push(makeItem("decade-main", "Đại vận", `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`, decadeCopy));
    }
    else if (hasAnnualScope) {
        const firstDecade = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart)[0];
        items.push(makeItem("decade-before-start", "Đại vận", "Giai đoạn trước đại vận đầu tiên", [
            `Tuổi mụ ${nominalAge} chưa bước vào đại vận mười năm đầu. Đại vận đầu bắt đầu từ ${firstDecade.decadeStart} tuổi tại cung ${firstDecade.name} ở ${firstDecade.branch}. Giai đoạn hiện tại vì thế được đọc chủ yếu từ cung Mệnh, cung Thân và các lớp lưu niên.`,
            `${periodNatalContext(firstDecade, "Đại vận đầu tiên")} Đây là cấu trúc sẽ giữ vai trò nền khi đại vận đầu chính thức bắt đầu.`
        ]));
    }
    if (hasAnnualScope && annualDecade) {
        items.push(makeItem("annual-decade", "Đại vận", `Lưu đại hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            annualDecade,
            `Lưu đại hạn năm ${viewYear}`,
            [activeDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận mười năm và tiểu hạn" }
        )));
    }

    if (hasAnnualScope) {
        items.push(makeItem("minor-fortune", "Tiểu vận", `Lưu niên tiểu hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            minorFortune,
            `Tiểu hạn năm ${viewYearCanChi}`,
            [activeDecadePalaceId, annualDecadePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận, lưu đại hạn và Lưu Thái Tuế" }
        )));
        items.push(makeItem("annual-moving-stars", "Tiểu vận", "Cấu trúc sao lưu của năm", [
            `Sao lưu của năm phân bố trên ${palaces.filter((palace) => palace.annualStars.length).length} cung, vì vậy nhịp năm không quy về một lĩnh vực duy nhất. Các điểm nhấn chính liên quan đến ${formatList(palaces.filter((palace) => palace.annualStars.length).slice(0, 5).map((palace) => PALACE_THEMES[palace.name]))}; mức biểu hiện phải đặt dưới Đại hạn và Tiểu hạn đang có.`,
            `Trong cách đọc kỹ thuật, nhóm sao lưu tạo các chiều về nguồn lực, quyền chủ động, sự ghi nhận, dịch chuyển và sức ép. Báo cáo chỉ tổng hợp tác động chung tại cung chúng đi tới, vì một sao lưu đơn lẻ không đủ để biến thành kết luận về cả năm.`
        ]));

        const annualTopic = `Vận hạn ${viewYear}`;
        const focusIds = [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId];
        items.push(makeItem("year-synthesis", annualTopic, `Tổng hợp vận hạn năm ${viewYearCanChi}`, [
            `Năm ${viewYearCanChi} được đặt trong đại vận ${activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "chưa xác định"}. Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, tiểu hạn nằm tại ${minorFortune.name} ở ${minorFortune.branch}, còn Lưu Thái Tuế đi tới ${yearBranchPalace.name} ở ${yearBranchPalace.branch}. Bốn lớp này cho biết bối cảnh dài hạn, trọng tâm của riêng năm và khu vực dễ xuất hiện sự kiện.`,
            (0, patterns_1.buildActivationParagraph)(palaces, focusIds, `Cấu trúc năm ${viewYear}`),
            `Xét các cung trọng tâm, năm chạm tới ${formatList(unique(focusIds.filter(Boolean).map((id) => PALACE_THEMES[getPalace(palaces, id).name])))}. Những lĩnh vực này có xu hướng liên hệ với nhau, vì quyết định ở một cung có thể tạo phản ứng dây chuyền sang các cung còn lại. Báo cáo năm vì vậy ưu tiên mối liên hệ giữa các cung hơn việc diễn giải từng sao lưu đơn lẻ.`
        ]));

        const annualSubjects = [
            ["year-career", "Công việc và vị trí xã hội", "Quan Lộc", ["Thiên Di", "Mệnh"]],
            ["year-finance", "Tài chính và nguồn lực", "Tài Bạch", ["Quan Lộc", "Điền Trạch"]],
            ["year-relationship", "Tình cảm và quan hệ gắn bó", "Phu Thê", ["Mệnh", "Phúc Đức"]],
            ["year-health", "Thể trạng và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]]
        ];
        annualSubjects.forEach(([id, title, primaryName, relatedNames]) => {
            const primary = palaces.find((item) => item.name === primaryName);
            const related = relatedNames.map((name) => palaces.find((item) => item.name === name));
            const natalCopy = thematicSynthesis(palaces, title.startsWith("Công việc") ? "Sự nghiệp" : title.startsWith("Tài chính") ? "Tài chính" : title.startsWith("Tình cảm") ? "Tình cảm" : "Sức khỏe và nhịp sống", primaryName, relatedNames);
            const annualAtPrimary = primary.annualStars || [];
            items.push(makeItem(id, annualTopic, `${title} năm ${viewYear}`, [
                `So với nền lá số, ${title.toLowerCase()} trong năm ${viewYear} ${annualAtPrimary.length ? `được kích hoạt trực tiếp tại cung ${primary.name}, nên ${PALACE_MANIFESTATIONS[primary.name]} dễ nổi lên rõ hơn` : `không nhận điểm nhấn sao lưu trực tiếp tại cung ${primary.name}, nên thay đổi chủ yếu đến từ Đại hạn, Tiểu hạn và các cung liên hệ`}. Đây là khác biệt về mức độ và thời điểm biểu hiện, không phải một đặc điểm lâu dài mới.`,
                natalCopy[0],
                movingParagraph(primary, `năm ${viewYear}`, "annualStars", `${formatList(related.map((item) => item.name))}, đại vận và tiểu hạn`),
                `Kết luận của năm còn phụ thuộc ${formatList(related.map((item) => PALACE_THEMES[item.name]))}. Khi các cung này cùng hướng với ${primary.name}, xu hướng dễ liền mạch hơn; nếu trái chiều, cơ hội ở một mặt có thể đi kèm áp lực điều chỉnh ở mặt khác, vì vậy không nên gắn toàn bộ năm với nhãn tốt hoặc xấu.`
            ]));
        });
    }

    if (viewScope !== "legacy" && monthlyFortunes.length) {
        const monthTopic = viewScope === "all_months" ? `Lưu nguyệt năm ${viewYear}` : `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
        monthlyFortunes.forEach((fortune, fortuneIndex) => {
            const paragraphs = [];
            fortune.parts.forEach((part) => {
                const scopedPalaces = palaces.map((palace) => ({
                    ...palace,
                    monthlyStars: part.stars.filter((star) => star.palace === palace.id)
                }));
                const focus = getPalace(scopedPalaces, part.palaceId);
                const partParagraphs = periodParagraphs(
                    scopedPalaces,
                    focus,
                    `Lưu nguyệt ${fortune.label.toLowerCase()}${fortune.parts.length > 1 ? ` - ${part.phase.toLowerCase()}` : ""}`,
                    [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
                    { label: `${fortune.label.toLowerCase()} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
                );
                if (fortune.parts.length > 1)
                    partParagraphs[0] = `${part.phase}: ${partParagraphs[0]}`;
                paragraphs.push(...partParagraphs.slice(0, 2));
            });
            items.push(makeItem(`month-synthesis-${fortuneIndex + 1}`, monthTopic, `${fortune.label} âm lịch - ${fortune.parts.map((part) => part.monthCanChi).filter((value, index, list) => list.indexOf(value) === index).join(" / ")}`, paragraphs));
        });
    }
    else if (viewScope === "legacy") {
        const monthTopic = `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
        items.push(makeItem("month-synthesis", monthTopic, `Tổng hợp tháng ${viewMonth} âm lịch - ${monthCanChi}`, periodParagraphs(
            palaces,
            monthlyPalace,
            `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""} âm lịch`,
            [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
            { label: `tháng ${viewMonth} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
        )));
        const dayTopic = `Lưu nhật ngày ${viewDay}`;
        items.push(makeItem("day-synthesis", dayTopic, `Tổng hợp ngày ${viewDay} âm lịch - ${viewDayCanChi}`, periodParagraphs(
            palaces,
            dailyPalace,
            `Lưu nhật ngày ${viewDay} âm lịch`,
            [monthlyPalaceId, minorFortunePalaceId, annualDecadePalaceId],
            { label: `ngày ${viewDay} âm lịch`, arrayName: "dailyStars", context: "lưu nguyệt, tiểu hạn và vận năm" }
        )));
        const hourTopic = `Lưu thời giờ ${viewHourBranch}`;
        items.push(makeItem("hour-synthesis", hourTopic, `Tổng hợp giờ ${viewHourCanChi}`, periodParagraphs(
            palaces,
            hourlyPalace,
            `Lưu thời giờ ${viewHourCanChi}`,
            [dailyPalaceId, monthlyPalaceId, minorFortunePalaceId],
            { label: `giờ ${viewHourCanChi}`, arrayName: "hourlyStars", context: "lưu nhật, lưu nguyệt và tiểu hạn" }
        )));
    }
    return (0, content_pipeline_1.finalizeInterpretations)(items);
}

});
define("tuvi/engine",function(require,module,exports){
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

});
const core=load('tuvi/core'); const engine=load('tuvi/engine'); const profiles=load('tuvi/profiles'); const time=load('tuvi/time-correction'); const brightness=load('tuvi/brightness'); const stars=load('tuvi/stars'); const fortune=load('tuvi/fortune'); global.MXiaoTuviEngine=Object.freeze({...core,...engine,...profiles,...time,...brightness,...stars,...fortune});
})(typeof globalThis!=='undefined'?globalThis:window);
