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
define("tuvi/interpreter",function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterpretations = buildInterpretations;
const fortune_1 = require("./fortune");
const patterns_1 = require("./patterns");

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
        return `Trong ${layerLabel}, cung ${palace.name} không nhận nhóm sao lưu chính đang được mã hóa. Trọng tâm thời gian vẫn nằm tại ${PALACE_THEMES[palace.name]}, nhưng mức độ biểu hiện chủ yếu do nền sao gốc và quan hệ với ${contextText} quyết định.`;
    }
    const support = stars.filter((item) => item.group.endsWith("support"));
    const challenge = stars.filter((item) => item.group.endsWith("malefic"));
    const cycle = stars.filter((item) => item.group.endsWith("cycle"));
    const sections = [];
    if (cycle.length)
        sections.push(cycle.map(movingRoleClause).join("; "));
    if (support.length)
        sections.push(`Ở chiều thuận, ${support.map(movingRoleClause).join("; ")}`);
    if (challenge.length)
        sections.push(`Ở chiều gây sức ép, ${challenge.map(movingRoleClause).join("; ")}`);
    let balance = `Hai chiều thuận và nghịch cùng tác động, làm ${PALACE_MANIFESTATIONS[palace.name]} trở thành nơi dễ thay đổi nhịp trong ${layerLabel}`;
    if ((support.length > 0 && challenge.length === 0) || support.length >= challenge.length + 2)
        balance = `Nhóm sao nâng đỡ chiếm ưu thế, nên ${PALACE_MANIFESTATIONS[palace.name]} có điều kiện vận hành thuận hơn trong ${layerLabel}`;
    if ((challenge.length > 0 && support.length === 0) || challenge.length >= support.length + 2)
        balance = `Nhóm sao gây sức ép chiếm ưu thế, nên ${PALACE_MANIFESTATIONS[palace.name]} dễ xuất hiện độ trễ, va chạm hoặc nhu cầu điều chỉnh trong ${layerLabel}`;
    return `${sections.join(". ")}. Các sao lưu cùng hội tại cung ${palace.name}, vì vậy tác động của chúng quy tụ trực tiếp vào ${PALACE_THEMES[palace.name]}. ${balance}. Khi đặt dưới ${contextText}, lớp thời gian này cho biết mức độ và thời điểm biểu hiện của một xu hướng đã có sẵn trong lá số, thay vì tạo ra một chủ đề hoàn toàn tách biệt.`;
}

function palaceParagraphs(palaces, palace, movingLayers = []) {
    return [corePalaceParagraph(palace), auxiliaryParagraph(palace, movingLayers), relationParagraph(palaces, palace)];
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
    const first = compactPalaceSynthesis(primary, `bức tranh ${title.toLowerCase()}`);
    const relationClauses = related.map((item) => {
        const major = getStars(item, ["major"]);
        if (!major.length)
            return `${item.name} tại ${item.branch} là cung vô chính diệu, khiến ${PALACE_THEMES[item.name]} biến đổi mạnh theo hội chiếu`;
        return `${item.name} tại ${item.branch} có ${majorDisplay(item)}, đưa ${formatList(major.map((star) => MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo của sao"))} vào ${PALACE_THEMES[item.name]}`;
    });
    const second = `${title} không chỉ nằm tại cung ${primary.name}. Cụm liên hệ còn gồm ${relationClauses.join("; ")}. Vì vậy, kết quả của lĩnh vực này hình thành từ sự phối hợp giữa ${PALACE_THEMES[primary.name]}, ${formatList(related.map((item) => PALACE_THEMES[item.name]))}; thay đổi ở một trục có thể kéo theo phản ứng ở các trục còn lại.`;
    const all = [primary, ...related];
    const supportScore = all.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challengeScore = all.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let third = `Toàn bộ cụm cung có thế thuận nghịch tương đối cân bằng. ${title} vì thế thường phát triển theo từng giai đoạn, với kết quả phụ thuộc nhiều vào vận hạn đang kích hoạt cung nào và cách các cung phối hợp tại thời điểm đó.`;
    if (supportScore >= challengeScore + 5)
        third = `Trong toàn bộ cụm cung, cát tinh và yếu tố nâng đỡ nổi trội hơn. Điều này tạo nền để năng lực của chính tinh tại ${primary.name} được triển khai khá liền mạch, nhất là khi các cung liên hệ cùng được vận hạn kích hoạt theo chiều thuận.`;
    if (challengeScore >= supportScore + 5)
        third = `Trong toàn bộ cụm cung, sát tinh và yếu tố gây sức ép nổi trội hơn. Quá trình phát triển của ${title.toLowerCase()} vì thế thường đi qua nhiều lần điều chỉnh, thay đổi nhịp hoặc xử lý mâu thuẫn trước khi hình thành kết quả ổn định.`;
    return [first, second, third];
}

function periodParagraphs(palaces, palace, label, contextIds, movingConfig) {
    const paragraphs = [
        `${label} nhập cung ${palace.name} tại ${palace.branch}, đưa ${PALACE_THEMES[palace.name]} lên thành trục chính của giai đoạn. Từ vị trí này, các sự kiện của thời kỳ thường biểu hiện qua ${PALACE_MANIFESTATIONS[palace.name]}, còn mức độ thuận nghịch được quyết định bởi chính tinh, phụ tinh và các lớp vận lớn hơn.`,
        periodNatalContext(palace, label),
        compactModifierSynthesis(palace, label.toLowerCase()),
        (0, patterns_1.buildActivationParagraph)(palaces, [palace.id, ...contextIds], `Khi đặt ${label.toLowerCase()} trong toàn bộ chuỗi thời gian`)
    ];
    if (movingConfig)
        paragraphs.push(movingParagraph(palace, movingConfig.label, movingConfig.arrayName, movingConfig.context));
    return paragraphs;
}

function buildInterpretations(params) {
    const {
        palaces,
        annualStars,
        monthlyStars,
        dailyStars,
        hourlyStars,
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
    const minorFortune = getPalace(palaces, minorFortunePalaceId);
    const yearBranchPalace = getPalace(palaces, yearBranchPalaceId);
    const monthlyPalace = getPalace(palaces, monthlyPalaceId);
    const dailyPalace = getPalace(palaces, dailyPalaceId);
    const hourlyPalace = getPalace(palaces, hourlyPalaceId);
    const bureauRelation = (0, fortune_1.getElementRelation)(birthElement, bureauElement);

    items.push(makeItem("overview-structure", "Tổng quan", "Cấu trúc tổng thể của lá số", [
        `Mệnh an tại ${life.branch}, Thân cư ${body.name} tại ${body.branch}. Bản mệnh thuộc ${birthElement}, lá số thuộc ${bureauLabel}; quan hệ Mệnh - Cục là ${bureauRelation.description}. Cung Mệnh mô tả nền khí chất và cách tiếp nhận hoàn cảnh, còn cung Thân cho biết lĩnh vực cá nhân dồn nhiều năng lượng hơn khi bước vào giai đoạn trưởng thành. Vì Thân cư ${body.name}, trọng tâm biểu hiện lâu dài thường gắn với ${PALACE_THEMES[body.name]}.`,
        compactPalaceSynthesis(life, "bức tranh tổng quan về khí chất và cách tự định vị"),
        compactModifierSynthesis(life, "cấu trúc tổng quan của cung Mệnh"),
        body.id === life.id
            ? `Mệnh và Thân đồng cung tại ${life.branch}, vì vậy động lực bên trong và cách hành động khi trưởng thành cùng đi qua một hệ sao. Cấu trúc này làm các đặc tính của ${majorDisplay(life)} xuất hiện nhất quán hơn giữa cảm nhận, lựa chọn thực tế và trách nhiệm lâu dài.`
            : compactPalaceSynthesis(body, `bức tranh trưởng thành qua cung ${body.name}`),
        body.id === life.id
            ? `Khái quát lại, Mệnh và Thân cùng đặt tại ${life.branch} nên điều cá nhân cảm nhận, cách lựa chọn và lĩnh vực phải chịu trách nhiệm có xu hướng hội tụ trên một trục. Các vận hạn đi qua cung này vì thế thường tác động đồng thời lên cả nội tâm lẫn hành động thực tế.`
            : `Khái quát lại, Mệnh tại ${life.branch} tạo động lực khởi đầu, còn Thân cư ${body.name} tại ${body.branch} quyết định nơi động lực ấy được chuyển thành hành động lâu dài. Toàn bộ lá số vì vậy cần được đọc theo hướng từ khí chất bên trong sang ${PALACE_THEMES[body.name]}, thay vì xem hai cung như hai phần tách biệt.`
    ]));

    const configurationParagraphs = (0, patterns_1.buildConfigurationParagraphs)(palaces, life.id);
    if (configurationParagraphs.length) {
        items.push(makeItem("overview-configurations", "Tổng quan", "Cách cục và cấu trúc hội chiếu", [
            `Cung Mệnh tại ${life.branch} cần được đọc đồng thời với hai cung tam hợp và cung xung chiếu. Khi một nhóm chính tinh có quan hệ chức năng cùng xuất hiện trong bốn cung này, trọng tâm của lá số không còn nằm ở từng sao riêng lẻ mà chuyển thành cách các cung phân công vai trò, hỗ trợ hoặc kiềm chế lẫn nhau.`,
            ...configurationParagraphs
        ]));
    }
    const adjacentParagraphs = (0, patterns_1.buildAdjacentParagraphs)(palaces, life.id);
    if (adjacentParagraphs.length) {
        items.push(makeItem("overview-adjacent", "Tổng quan", "Giáp cung và ảnh hưởng từ hai phía", [
            `Hai cung đứng ngay trước và ngay sau cung Mệnh tạo lớp ảnh hưởng gián tiếp nhưng liên tục. Khác với sao tọa thủ, sao giáp cung không thay thế trục chính của Mệnh; chúng tạo điều kiện bao quanh, làm tăng lực hỗ trợ hoặc sức ép tùy theo tính chất của cặp sao và thời điểm được vận hạn kích hoạt.`,
            ...adjacentParagraphs
        ]));
    }

    items.push(makeItem("overview-period", "Tổng quan", `Trục vận hạn năm ${viewYearCanChi}`, [
        `Ở tuổi mụ ${nominalAge}, ${activeDecade ? `đại vận nằm tại cung ${activeDecade.name} ở ${activeDecade.branch}` : "lá số chưa bước vào đại vận mười năm đầu tiên"}. Lưu đại hạn ${annualDecade ? `đi vào cung ${annualDecade.name} ở ${annualDecade.branch}` : "chưa xác định"}, tiểu hạn ở cung ${minorFortune.name}, Lưu Thái Tuế ở cung ${yearBranchPalace.name}, lưu nguyệt tháng ${viewMonth} ở cung ${monthlyPalace.name}, lưu nhật ngày ${viewDay} ở cung ${dailyPalace.name} và lưu thời ${viewHourCanChi} ở cung ${hourlyPalace.name}. Chuỗi này đi từ bối cảnh dài hạn đến thời điểm hẹp, nên lớp sau được đọc trong giới hạn của lớp trước.`,
        (0, patterns_1.buildActivationParagraph)(palaces, [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId, monthlyPalaceId, dailyPalaceId, hourlyPalaceId], `Vận hạn năm ${viewYear}`),
        `Các cung nổi lên trong năm lần lượt chạm tới ${formatList(unique([activeDecade, annualDecade, minorFortune, yearBranchPalace, monthlyPalace, dailyPalace, hourlyPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}. Vì vậy, báo cáo vận hạn cần được hiểu như một hệ thống liên kết giữa nhiều lĩnh vực, thay vì tách từng sao lưu thành kết luận độc lập.`
    ]));

    items.push(makeItem("life-detail", "Mệnh - Thân", `Mối liên hệ giữa Mệnh và Thân`, [
        `Cung Mệnh tại ${life.branch} là điểm khởi phát của cách nhìn nhận và phản ứng, còn cung Thân tại ${body.branch} cho biết nơi phản ứng ấy trở thành lựa chọn có hậu quả lâu dài. Vì Thân cư ${body.name}, quá trình trưởng thành thường đòi hỏi cá nhân đưa khí chất của cung Mệnh vào ${PALACE_THEMES[body.name]}.`,
        compactPalaceSynthesis(life, "cách phản ứng ban đầu của cung Mệnh"),
        compactPalaceSynthesis(body, `cách hành động khi trưởng thành tại cung ${body.name}`),
        lifeBodyInteractionParagraph(life, body)
    ]));
    items.push(makeItem("body-detail", "Mệnh - Thân", `Trục phát triển của cung Thân`, [
        `Cung Thân nằm tại ${body.name} ở ${body.branch}, cho thấy ${PALACE_THEMES[body.name]} là nơi cá nhân phải trực tiếp lựa chọn, chịu trách nhiệm và bộc lộ năng lực rõ hơn theo thời gian. Trục này thường hiện ra qua những hoàn cảnh yêu cầu hành động thực tế, thay vì chỉ phản ánh cảm nhận bên trong.`,
        compactModifierSynthesis(body, `quá trình phát triển của cung Thân tại ${body.name}`),
        `Trong quan hệ với cung Mệnh tại ${life.branch}, cung Thân nhận phần động lực ban đầu từ ${formatList(getStars(life, ["major"]).map((star) => star.name)) || "hệ sao hội chiếu"} và chuyển nó sang cách vận hành của ${formatList(getStars(body, ["major"]).map((star) => star.name)) || "cung vô chính diệu"}. Điều này giải thích vì sao cùng một khí chất có thể tạo ra các lựa chọn khác nhau khi đi vào quan hệ, nghề nghiệp hoặc trách nhiệm cụ thể.`,
        `Tam phương và cung xung chiếu của Thân nối chủ đề ${PALACE_THEMES[body.name]} với ${formatList(relationSet(palaces, body).triadPalaces.map((item) => PALACE_THEMES[item.name]))} và ${PALACE_THEMES[relationSet(palaces, body).opposite.name]}. Trục phát triển của cung Thân vì vậy chịu ảnh hưởng từ cả năng lực cá nhân lẫn môi trường quan hệ xung quanh.`
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

    if (activeDecade) {
        items.push(makeItem("decade-main", "Đại vận", `Đại vận ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`, periodParagraphs(
            palaces,
            activeDecade,
            `Đại vận ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`,
            [annualDecadePalaceId, minorFortunePalaceId],
            null
        )));
    }
    else {
        const firstDecade = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart)[0];
        items.push(makeItem("decade-before-start", "Đại vận", "Giai đoạn trước đại vận đầu tiên", [
            `Tuổi mụ ${nominalAge} chưa bước vào đại vận mười năm đầu. Đại vận đầu bắt đầu từ ${firstDecade.decadeStart} tuổi tại cung ${firstDecade.name} ở ${firstDecade.branch}. Giai đoạn hiện tại vì thế được đọc chủ yếu từ cung Mệnh, cung Thân và các lớp lưu niên.`,
            `${periodNatalContext(firstDecade, "Đại vận đầu tiên")} Đây là cấu trúc sẽ giữ vai trò nền khi đại vận đầu chính thức bắt đầu.`
        ]));
    }
    if (annualDecade) {
        items.push(makeItem("annual-decade", "Đại vận", `Lưu đại hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            annualDecade,
            `Lưu đại hạn năm ${viewYear}`,
            [activeDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận mười năm và tiểu hạn" }
        )));
    }

    items.push(makeItem("minor-fortune", "Tiểu vận", `Lưu niên tiểu hạn năm ${viewYear}`, periodParagraphs(
        palaces,
        minorFortune,
        `Tiểu hạn năm ${viewYearCanChi}`,
        [activeDecadePalaceId, annualDecadePalaceId, yearBranchPalaceId],
        { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận, lưu đại hạn và Lưu Thái Tuế" }
    )));
    items.push(makeItem("annual-moving-stars", "Tiểu vận", "Cấu trúc sao lưu của năm", [
        `Bộ sao lưu năm gồm ${formatList(annualStars.map((item) => item.name))}. Nhóm sao này phân bố trên nhiều cung, tạo nên các điểm nhấn về nguồn lực, quyền chủ động, sự ghi nhận, dịch chuyển và những nơi dễ phát sinh áp lực. Ý nghĩa của sao lưu chỉ có giá trị khi được đặt vào cung mà nó đi tới và so sánh với chính tinh gốc tại cung đó.`,
        `${palaces.filter((palace) => palace.annualStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.annualStars.map((item) => item.name))}`).join(". ")}. Sự phân bố này cho biết những chủ đề được kích hoạt trong năm, còn mức độ thuận nghịch phụ thuộc nền sao gốc, đại vận và tiểu hạn.`
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
        items.push(makeItem(id, annualTopic, `${title} năm ${viewYear}`, [
            `Phương diện ${title.toLowerCase()} được đọc trước hết từ cung ${primary.name} tại ${primary.branch}, sau đó đối chiếu với ${formatList(related.map((item) => `${item.name} tại ${item.branch}`))}. Cách đọc này giúp phân biệt nền tảng sẵn có của lĩnh vực với phần biến động chỉ xuất hiện trong năm ${viewYear}.`,
            compactPalaceSynthesis(primary, `nền tảng ${title.toLowerCase()} trước khi xét sao lưu năm ${viewYear}`),
            movingParagraph(primary, `năm ${viewYear}`, "annualStars", `${formatList(related.map((item) => item.name))}, đại vận và tiểu hạn`),
            `Trong cụm liên hệ, ${related.map((item) => `${item.name} có ${majorDisplay(item)} và phản ánh ${PALACE_THEMES[item.name]}`).join("; ")}. Vì vậy, diễn biến ${title.toLowerCase()} trong năm chịu tác động đồng thời từ cấu trúc gốc của cung ${primary.name}, cách cá nhân hành động và môi trường thực tế. Mức độ biểu hiện tăng khi cung ${primary.name} trùng hoặc tam hợp với một trong các cung vận hạn chính.`
        ]));
    });

    const monthTopic = `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
    items.push(makeItem("month-synthesis", monthTopic, `Tổng hợp tháng ${viewMonth} âm lịch - ${monthCanChi}`, periodParagraphs(
        palaces,
        monthlyPalace,
        `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""} âm lịch`,
        [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
        { label: `tháng ${viewMonth} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
    )));
    items.push(makeItem("month-moving-stars", monthTopic, "Nhịp vận động trong tháng", [
        `Bộ sao lưu tháng gồm ${formatList(monthlyStars.map((item) => item.name))}. Các sao này thu hẹp trọng tâm của năm vào một khoảng thời gian ngắn hơn, giúp nhận diện nơi nguồn lực được tăng cường và nơi áp lực dễ xuất hiện rõ.`,
        `${palaces.filter((palace) => palace.monthlyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.monthlyStars.map((item) => item.name))}`).join(". ")}. Khi cung lưu nguyệt trùng với tiểu hạn, lưu đại hạn hoặc đại vận, chủ đề của cung đó thường nổi bật hơn trong tháng.`
    ]));

    const dayTopic = `Lưu nhật ngày ${viewDay}`;
    items.push(makeItem("day-synthesis", dayTopic, `Tổng hợp ngày ${viewDay} âm lịch - ${viewDayCanChi}`, periodParagraphs(
        palaces,
        dailyPalace,
        `Lưu nhật ngày ${viewDay} âm lịch`,
        [monthlyPalaceId, minorFortunePalaceId, annualDecadePalaceId],
        { label: `ngày ${viewDay} âm lịch`, arrayName: "dailyStars", context: "lưu nguyệt, tiểu hạn và vận năm" }
    )));
    items.push(makeItem("day-moving-stars", dayTopic, "Nhịp vận động trong ngày", [
        `Bộ sao lưu ngày gồm ${formatList(dailyStars.map((item) => item.name))}. Đây là lớp thời gian ngắn, dùng để xác định chủ đề nào trong tháng có khả năng được kích hoạt rõ hơn vào ngày đang xem.`,
        `${palaces.filter((palace) => palace.dailyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.dailyStars.map((item) => item.name))}`).join(". ")}. Các dấu hiệu trong ngày cần được đặt dưới xu hướng của tháng và năm để tránh khuếch đại một biến động ngắn thành kết luận dài hạn.`
    ]));

    const hourTopic = `Lưu thời giờ ${viewHourBranch}`;
    items.push(makeItem("hour-synthesis", hourTopic, `Tổng hợp giờ ${viewHourCanChi}`, periodParagraphs(
        palaces,
        hourlyPalace,
        `Lưu thời giờ ${viewHourCanChi}`,
        [dailyPalaceId, monthlyPalaceId, minorFortunePalaceId],
        { label: `giờ ${viewHourCanChi}`, arrayName: "hourlyStars", context: "lưu nhật, lưu nguyệt và tiểu hạn" }
    )));
    items.push(makeItem("hour-moving-stars", hourTopic, "Nhịp vận động trong giờ", [
        `Bộ sao lưu giờ gồm ${formatList(hourlyStars.map((item) => item.name))}. Lớp này chỉ thu hẹp trọng tâm của ngày vào một khung thời gian cụ thể, phù hợp để quan sát nhịp sự việc hơn là đưa ra kết luận dài hạn.`,
        `${palaces.filter((palace) => palace.hourlyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.hourlyStars.map((item) => item.name))}`).join(". ")}. Khi lưu thời trùng với lưu nhật hoặc lưu nguyệt, chủ đề của cung tương ứng có thể biểu hiện tập trung hơn trong khung giờ đã chọn.`
    ]));

    return items;
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

});
const core=load('tuvi/core'); const engine=load('tuvi/engine'); const profiles=load('tuvi/profiles'); const time=load('tuvi/time-correction'); const brightness=load('tuvi/brightness'); const stars=load('tuvi/stars'); const fortune=load('tuvi/fortune'); global.MXiaoTuviEngine=Object.freeze({...core,...engine,...profiles,...time,...brightness,...stars,...fortune});
})(typeof globalThis!=='undefined'?globalThis:window);
