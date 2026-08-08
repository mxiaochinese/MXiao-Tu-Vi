"use strict";
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
