"use strict";
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
