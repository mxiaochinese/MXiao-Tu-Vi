"use strict";

const MASTER = new Set([11, 22, 33]);
const VOWELS = new Set("AEIOU".split(""));
const DISALLOWED_NAME_TOKENS = new Set(["DR", "MR", "MRS", "MS", "MISS", "PROF", "JR", "SR", "II", "III", "IV", "V"]);
const LETTER_VALUE = Object.create(null);
["AJS", "BKT", "CLU", "DMV", "ENW", "FOX", "GPY", "HQZ", "IR"].forEach((letters, index) => {
  for (const letter of letters) LETTER_VALUE[letter] = index + 1;
});
const GRID_LINES = [[1, 5, 9], [3, 5, 7], [3, 6, 9], [2, 5, 8], [1, 4, 7], [1, 2, 3], [4, 5, 6], [7, 8, 9]];

function normalizeName(text) {
  return String(text || "")
    .replace(/Đ/g, "D").replace(/đ/g, "d")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z\s'-]/g, "").toUpperCase()
    .replace(/\s+/g, " ").trim();
}

function reduceNumber(value, preserveMaster = true) {
  let number = Math.abs(Number.parseInt(value, 10));
  if (!Number.isFinite(number)) number = 0;
  const chain = [number];
  while (number > 9 && !(preserveMaster && MASTER.has(number))) {
    number = String(number).split("").reduce((sum, digit) => sum + Number(digit), 0);
    chain.push(number);
  }
  return { value: number, chain };
}

function masterBase(value) {
  if (value === 11) return 2;
  if (value === 22) return 4;
  if (value === 33) return 6;
  return reduceNumber(value, false).value;
}

function tokenizeNormalizedName(normalized) {
  return normalized.split(" ").map((token) => token.replace(/['-]/g, "")).filter(Boolean);
}

function yReviewItems(originalName, locale = "vi") {
  const tokens = tokenizeNormalizedName(normalizeName(originalName));
  const items = [];
  tokens.forEach((token, tokenIndex) => {
    [...token].forEach((letter, charIndex) => {
      if (letter !== "Y") return;
      const previous = charIndex ? token[charIndex - 1] : "";
      const next = charIndex + 1 < token.length ? token[charIndex + 1] : "";
      let inferredDefault = "consonant";
      if (charIndex === 0 && next && !VOWELS.has(next)) inferredDefault = "vowel";
      else if (charIndex === token.length - 1 && previous && !VOWELS.has(previous)) inferredDefault = "vowel";
      else if (charIndex > 0 && charIndex < token.length - 1 && !VOWELS.has(previous) && !VOWELS.has(next)) inferredDefault = "vowel";
      items.push({ token_index: tokenIndex, token, char_index: charIndex, inferred_default: inferredDefault, needs_review: locale.toLowerCase().startsWith("vi") });
    });
  });
  return items;
}

function normalizeUnitGroups(tokens, unitGroups) {
  if (unitGroups == null) return tokens.map((_, index) => [index]);
  const normalized = [];
  const flat = [];
  let previous = -1;
  for (const candidate of unitGroups) {
    if (!Array.isArray(candidate) || !candidate.length) throw new Error("Mỗi đơn vị tên phải có ít nhất một từ.");
    const group = candidate.map(Number);
    const expected = Array.from({ length: group[group.length - 1] - group[0] + 1 }, (_, index) => group[0] + index);
    if (group.join(",") !== expected.join(",") || group[0] !== previous + 1) throw new Error("Các đơn vị tên phải liền nhau, đúng thứ tự và bao phủ đủ tên.");
    normalized.push(group);
    flat.push(...group);
    previous = group[group.length - 1];
  }
  if (flat.join(",") !== tokens.map((_, index) => index).join(",")) throw new Error("Các đơn vị tên phải bao phủ đủ tên.");
  return normalized;
}

function calculateNameNumbers(name, options = {}) {
  const locale = options.locale || "vi";
  const normalized = normalizeName(name);
  const tokens = tokenizeNormalizedName(normalized);
  if (!tokens.length) throw new Error("Tên cần có ít nhất một chữ cái Latin.");
  const invalidTokens = tokens.filter((token) => DISALLOWED_NAME_TOKENS.has(token));
  if (invalidTokens.length) throw new Error("Hãy bỏ danh xưng hoặc hậu tố thế hệ khỏi tên.");
  const suppliedGroups = options.unitGroups != null;
  const suppliedGiven = options.givenUnitIndex != null;
  const groups = normalizeUnitGroups(tokens, options.unitGroups);
  const givenUnitIndex = suppliedGiven ? Number(options.givenUnitIndex) : (locale.toLowerCase().startsWith("vi") ? groups.length - 1 : 0);
  if (!Number.isInteger(givenUnitIndex) || givenUnitIndex < 0 || givenUnitIndex >= groups.length) throw new Error("Đơn vị tên gọi không hợp lệ.");
  const overrides = options.yOverrides || {};
  const yItems = yReviewItems(name, locale);

  function isVowel(letter, tokenIndex, charIndex) {
    if (VOWELS.has(letter)) return true;
    if (letter !== "Y") return false;
    const key = `${tokenIndex}:${charIndex}`;
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      if (!new Set(["vowel", "consonant"]).has(overrides[key])) throw new Error("Lựa chọn vai trò chữ Y không hợp lệ.");
      return overrides[key] === "vowel";
    }
    const match = yItems.find((item) => item.token_index === tokenIndex && item.char_index === charIndex);
    return Boolean(match && match.inferred_default === "vowel");
  }

  function unitCalculation(group, mode) {
    const values = [];
    for (const tokenIndex of group) {
      [...tokens[tokenIndex]].forEach((letter, charIndex) => {
        if (!LETTER_VALUE[letter]) return;
        const vowel = isVowel(letter, tokenIndex, charIndex);
        if (mode === "all" || (mode === "vowel" && vowel) || (mode === "consonant" && !vowel)) values.push(LETTER_VALUE[letter]);
      });
    }
    const sum = values.reduce((total, value) => total + value, 0);
    const reduced = reduceNumber(sum, true);
    return { unit: group.map((index) => tokens[index]).join(" "), token_indices: group, sum, reduced: reduced.value, chain: reduced.chain, values };
  }

  const expressionParts = groups.map((group) => unitCalculation(group, "all"));
  const soulParts = groups.map((group) => unitCalculation(group, "vowel"));
  const personalityParts = groups.map((group) => unitCalculation(group, "consonant"));
  function combine(parts) {
    const sumOfUnits = parts.reduce((sum, part) => sum + part.reduced, 0);
    const reduced = reduceNumber(sumOfUnits, true);
    return { sum_of_units: sumOfUnits, reduced: reduced.value, chain: reduced.chain };
  }
  const counts = {};
  for (let number = 1; number <= 9; number += 1) counts[number] = 0;
  for (const token of tokens) for (const letter of token) if (LETTER_VALUE[letter]) counts[LETTER_VALUE[letter]] += 1;
  const maxFrequency = Math.max(...Object.values(counts));
  const hiddenPassion = Object.keys(counts).map(Number).filter((number) => maxFrequency > 0 && counts[number] === maxFrequency);
  const missingNameNumbers = Object.keys(counts).map(Number).filter((number) => counts[number] === 0);
  const initials = groups.map((group) => tokens[group[0]][0]);
  const balanceSum = initials.reduce((sum, letter) => sum + LETTER_VALUE[letter], 0);
  const requiredYKeys = new Set(yItems.map((item) => `${item.token_index}:${item.char_index}`));
  const reviewedYKeys = Object.keys(overrides).filter((key) => requiredYKeys.has(key)).sort();
  const yStatus = locale.toLowerCase().startsWith("vi") && reviewedYKeys.length !== requiredYKeys.size ? "provisional" : "final";
  const structureRequired = locale.toLowerCase().startsWith("vi");
  const structureStatus = !structureRequired || options.structureConfirmed ? "final" : "provisional";
  const givenLetters = groups[givenUnitIndex].map((index) => tokens[index]).join("");
  return {
    original: name, normalized, tokens, unit_groups: groups, locale,
    name_structure_review: { unit_groups_source: suppliedGroups ? "user" : "default", given_unit_source: suppliedGiven ? "user" : "default", requires_confirmation: structureRequired, confirmed: Boolean(options.structureConfirmed), status: structureStatus },
    calculation_units: groups.map((group) => group.map((index) => tokens[index]).join(" ")),
    given_unit_index: givenUnitIndex, given_unit: groups[givenUnitIndex].map((index) => tokens[index]).join(" "),
    given_unit_expression_sum: expressionParts[givenUnitIndex].sum,
    y_review: yItems, y_reviewed_keys: reviewedYKeys, y_status: yStatus,
    status: yStatus === "final" && structureStatus === "final" ? "final" : "provisional",
    expression_parts: expressionParts, expression: combine(expressionParts),
    soul_parts: soulParts, soul_urge: combine(soulParts),
    personality_parts: personalityParts, personality: combine(personalityParts),
    letter_value_counts: counts, hidden_passion: hiddenPassion, missing_name_numbers: missingNameNumbers,
    subconscious_self: 9 - missingNameNumbers.length,
    balance: { initials, sum: balanceSum, value: reduceNumber(balanceSum, false).value },
    cornerstone: [...givenLetters].find((letter) => LETTER_VALUE[letter]) || null,
    capstone: [...givenLetters].reverse().find((letter) => LETTER_VALUE[letter]) || null
  };
}

function assertValidDate(day, month, year) {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) throw new Error("Ngày sinh không hợp lệ.");
}

function calculateDateNumbers(dayInput, monthInput, yearInput, targetYearInput) {
  const day = Number(dayInput); const month = Number(monthInput); const year = Number(yearInput);
  assertValidDate(day, month, year);
  const monthReduced = reduceNumber(month, true); const dayReduced = reduceNumber(day, true); const yearReduced = reduceNumber(year, true);
  const lifePathSum = monthReduced.value + dayReduced.value + yearReduced.value;
  const lifePath = reduceNumber(lifePathSum, true);
  const birthday = reduceNumber(day, true);
  const attitudeSum = month + day;
  const attitude = reduceNumber(attitudeSum, false);
  const lifePathBase = masterBase(lifePath.value);
  const periods = [
    { index: 1, value: monthReduced.value, age_start: 0, age_end: 36 - lifePathBase },
    { index: 2, value: dayReduced.value, age_start: 37 - lifePathBase, age_end: 63 - lifePathBase },
    { index: 3, value: yearReduced.value, age_start: 64 - lifePathBase, age_end: null }
  ];
  const rr = (number) => reduceNumber(number, true).value;
  const p1 = rr(monthReduced.value + dayReduced.value); const p2 = rr(dayReduced.value + yearReduced.value);
  const p3 = rr(p1 + p2); const p4 = rr(monthReduced.value + yearReduced.value);
  const firstEnd = 36 - lifePathBase;
  const pinnacles = [
    { index: 1, value: p1, age_start: 0, age_end: firstEnd },
    { index: 2, value: p2, age_start: firstEnd + 1, age_end: firstEnd + 9 },
    { index: 3, value: p3, age_start: firstEnd + 10, age_end: firstEnd + 18 },
    { index: 4, value: p4, age_start: firstEnd + 19, age_end: null }
  ];
  const monthBase = reduceNumber(month, false).value; const dayBase = reduceNumber(day, false).value; const yearBase = reduceNumber(year, false).value;
  const challenge1 = Math.abs(monthBase - dayBase); const challenge2 = Math.abs(dayBase - yearBase);
  const challenges = [challenge1, challenge2, Math.abs(challenge1 - challenge2), Math.abs(monthBase - yearBase)];
  const digits = `${String(day).padStart(2, "0")}${String(month).padStart(2, "0")}${String(year).padStart(4, "0")}`.split("").map(Number).filter(Boolean);
  const counts = {}; for (let number = 1; number <= 9; number += 1) counts[number] = digits.filter((digit) => digit === number).length;
  const filledArrows = GRID_LINES.filter((line) => line.every((number) => counts[number] > 0)).map((line) => line.join("-"));
  const emptyArrows = GRID_LINES.filter((line) => line.every((number) => counts[number] === 0)).map((line) => line.join("-"));
  const result = {
    birth_date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).padStart(4, "0")}`,
    life_path: { units: { month: { raw: month, value: monthReduced.value, chain: monthReduced.chain }, day: { raw: day, value: dayReduced.value, chain: dayReduced.chain }, year: { raw: year, value: yearReduced.value, chain: yearReduced.chain } }, sum: lifePathSum, value: lifePath.value, chain: lifePath.chain },
    birthday: { raw: day, value: birthday.value, chain: birthday.chain }, attitude: { sum: attitudeSum, value: attitude.value, chain: attitude.chain },
    periods, pinnacles, challenges, birth_chart: { digits, counts, filled_arrows: filledArrows, empty_arrows: emptyArrows }
  };
  if (targetYearInput != null) {
    const targetYear = Number(targetYearInput);
    const personalYearSum = month + day + targetYear;
    const personalYear = reduceNumber(personalYearSum, false);
    const personalMonths = {}; for (let index = 1; index <= 12; index += 1) personalMonths[index] = reduceNumber(personalYear.value + index, false).value;
    result.forecast = { year: targetYear, personal_year: { sum: personalYearSum, value: personalYear.value, chain: personalYear.chain }, personal_months: personalMonths };
  }
  return result;
}

function calculateProfile(input) {
  const birthName = calculateNameNumbers(input.birthName, { yOverrides: input.yOverrides, unitGroups: input.birthUnitGroups, givenUnitIndex: input.birthGivenUnitIndex, locale: input.locale || "vi", structureConfirmed: input.birthStructureConfirmed });
  const date = calculateDateNumbers(input.day, input.month, input.year, input.targetYear);
  const lifePath = date.life_path.value; const expression = birthName.expression.reduced;
  const soul = birthName.soul_urge.reduced; const personality = birthName.personality.reduced; const birthday = date.birthday.value;
  const result = {
    birth_name: birthName, date,
    maturity: reduceNumber(lifePath + expression, true).value,
    bridges: { life_path_expression: Math.abs(masterBase(lifePath) - masterBase(expression)), soul_personality: Math.abs(masterBase(soul) - masterBase(personality)), life_path_birthday: Math.abs(masterBase(lifePath) - masterBase(birthday)) },
    rational_thought: reduceNumber(Number(input.day) + birthName.given_unit_expression_sum, false).value
  };
  if (input.currentName) result.current_name = calculateNameNumbers(input.currentName, { yOverrides: input.currentYOverrides, unitGroups: input.currentUnitGroups, givenUnitIndex: input.currentGivenUnitIndex, locale: input.locale || "vi", structureConfirmed: input.currentStructureConfirmed });
  result.status = [birthName.status, result.current_name?.status].filter(Boolean).every((status) => status === "final") ? "final" : "provisional";
  return result;
}

module.exports = { MASTER, LETTER_VALUE, GRID_LINES, normalizeName, reduceNumber, masterBase, yReviewItems, calculateNameNumbers, calculateDateNumbers, calculateProfile };
