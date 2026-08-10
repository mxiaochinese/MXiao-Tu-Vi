(function(global){
"use strict";
const factories=Object.create(null); const cache=Object.create(null);
function define(id,factory){factories[id]=factory;}
function load(id){if(cache[id]) return cache[id].exports; const factory=factories[id]; if(!factory) throw new Error('Không tìm thấy module '+id); const module={exports:{}}; cache[id]=module; factory((request)=>load(request.replace(/^\.\//,'numerology/').replace(/\.js$/,'')),module,module.exports); return module.exports;}
define("numerology/engine",function(require,module,exports){
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

});
define("numerology/synthesis",function(require,module,exports){
const SEMANTICS = {
  1: ["tính tự chủ, xu hướng khởi xướng và nhu cầu tự quyết", "chủ động, dứt khoát và sẵn sàng mở đường", "cứng đầu, thu hẹp góc nhìn hoặc khó nhận hỗ trợ", "giữ quyền tự quyết đồng thời lắng nghe phản hồi có giá trị"],
  2: ["độ nhạy với quan hệ, khả năng phối hợp và đọc sắc thái", "hợp tác, tinh tế, kiên nhẫn và biết duy trì nhịp quan hệ", "chần chừ hoặc thích nghi quá mức với nhu cầu xung quanh", "xác lập tiêu chuẩn và ranh giới cá nhân rõ hơn"],
  3: ["biểu đạt, ngôn ngữ, sức sáng tạo và khả năng kết nối ý tưởng", "nói, viết, kể chuyện và chuyển ý tưởng thành hình thức dễ tiếp nhận", "tản lực, bỏ dở hoặc né phần việc cần kỷ luật dài hạn", "gom sức biểu đạt vào vài hướng đủ quan trọng để tạo kết quả bền"],
  4: ["cấu trúc, phương pháp, tính ổn định và khả năng xây quy trình", "bền bỉ, đáng tin, thực tế và tổ chức tốt", "cứng nhắc, quá thận trọng hoặc khó đổi cách làm", "giữ nền tảng chắc và cho phép sửa hệ thống khi bối cảnh đổi khác"],
  5: ["chuyển động, trải nghiệm, nhu cầu tự do và cách học qua thay đổi", "thích nghi nhanh, tò mò và xử lý tốt môi trường biến động", "dễ chán, đổi hướng sớm hoặc khó duy trì cam kết", "tạo khoảng tự do bên trong một số cam kết đủ rõ"],
  6: ["trách nhiệm, chăm sóc và tiêu chuẩn về chất lượng quan hệ", "quan tâm, biết nâng đỡ và chú ý tới môi trường chung", "ôm việc, can thiệp sâu hoặc đặt tiêu chuẩn quá cao", "phân biệt trách nhiệm của mình với lựa chọn của người khác"],
  7: ["chiều sâu, phân tích, nhu cầu hiểu bản chất và học qua quan sát", "nghiên cứu, tập trung, độc lập tư duy và nhìn ra cấu trúc", "thu mình, hoài nghi kéo dài hoặc đánh giá quá kỹ", "biến chiều sâu thành tri thức có thể sử dụng và chia sẻ"],
  8: ["khả năng tổ chức nguồn lực, ý thức về kết quả và năng lực điều hành", "quản trị, quyết định và chịu được áp lực thành tựu", "kiểm soát quá mức hoặc đánh giá mình qua thành tích", "dùng năng lực điều hành theo tiêu chuẩn rõ và có giới hạn"],
  9: ["tầm nhìn rộng, ý thức hoàn tất và sự quan tâm tới ý nghĩa dài hạn", "bao quát, cảm thông và tổng hợp trải nghiệm từ nhiều góc", "lý tưởng hóa, ôm vấn đề quá rộng hoặc khó đặt ranh giới", "chọn phạm vi đóng góp cụ thể và biết kết thúc đúng lúc"],
  11: ["độ nhạy và trực giác được khuếch đại, cùng khả năng nhận tín hiệu tinh tế", "cảm nhận sắc, truyền cảm hứng và kết nối ý tưởng với con người", "quá tải hoặc dao động khi lượng tín hiệu tiếp nhận quá lớn", "giữ nhịp sống ổn định để độ nhạy trở thành năng lực phân biệt"],
  22: ["khả năng nghĩ ở quy mô lớn rồi đưa mục tiêu xuống cấu trúc cụ thể", "xây hệ thống, tổ chức dự án và nối tầm nhìn với kỷ luật", "chịu áp lực cao, kiểm soát chi tiết hoặc trì hoãn trước mục tiêu lớn", "chia quy mô thành các tầng có thể thực hiện và biết giao quyền"],
  33: ["trách nhiệm chăm sóc và khả năng hướng dẫn ở phạm vi rộng", "giảng giải, nâng đỡ và tạo môi trường giúp người khác phát triển", "gánh thay hoặc đánh mất nhu cầu riêng trong trách nhiệm", "giữ chất lượng phục vụ cùng giới hạn rõ ràng"]
};

const ROLE = {
  life: "Đường đời phản ánh trục phát triển dài hạn và kiểu bài toán thường trở lại qua trải nghiệm.",
  birthday: "Ngày sinh bổ sung một năng lực cụ thể cho cách bạn xử lý đời sống hằng ngày.",
  expression: "Sứ mệnh cho thấy bộ công cụ biểu đạt và cách năng lực có xu hướng đi ra thành hành động.",
  soul: "Linh hồn mô tả động cơ bên trong, điều đem lại cảm giác có ý nghĩa và đáng theo đuổi.",
  personality: "Nhân cách nói về lớp ấn tượng ban đầu và cách bạn sàng lọc sự tiếp xúc với bên ngoài.",
  maturity: "Trưởng thành là hướng ngày càng rõ khi kinh nghiệm sống đã đủ dày để các năng lực phối hợp.",
  cycle: "Các chu kỳ mô tả chủ đề của từng giai đoạn, giúp đặt trải nghiệm vào một nhịp thời gian rộng hơn."
};

function meaning(number) {
  return SEMANTICS[number] || SEMANTICS[Number(String(number).slice(-1)) || 9];
}

function valueLabel(number) {
  if (number === 11) return "11/2";
  if (number === 22) return "22/4";
  if (number === 33) return "33/6";
  return String(number);
}

function coreParagraphs(role, number, relatedLabel, relatedNumber) {
  const [core, strength, friction, development] = meaning(number);
  const related = meaning(relatedNumber);
  return [
    `${ROLE[role]} Với số ${valueLabel(number)}, trọng tâm nằm ở ${core}. Đây là một khuynh hướng cần được đọc qua nhiều giai đoạn sống, bởi cùng một phẩm chất có thể biểu hiện rất khác khi bối cảnh, trách nhiệm và mức độ tự nhận biết thay đổi. Dấu hiệu rõ nhất thường xuất hiện trong cách bạn chọn ưu tiên, phân bổ năng lượng và phản ứng khi phải tự đưa ra quyết định.`,
    `Mặt thuận lợi của cấu trúc này là ${strength}. Khi được đặt vào môi trường phù hợp, bạn thường phát huy tốt hơn nếu mục tiêu đủ rõ, nhịp làm việc có ý nghĩa và kết quả tạo được cảm giác tiến bộ thực chất. Năng lực ấy có thể trở thành điểm tựa ổn định, nhất là khi bạn nhận ra điều gì xứng đáng để đầu tư lâu dài thay vì phân tán theo những yêu cầu đến cùng lúc.`,
    `Phần cần quan sát là xu hướng ${friction}. Nó thường lộ ra khi áp lực tăng, khi thời gian bị thu hẹp hoặc khi bạn chưa có đủ thông tin để cảm thấy chắc chắn. Việc nhận diện sớm giúp bạn phân biệt một phản ứng tạm thời với một lựa chọn thật sự phù hợp. Hướng phát triển hữu ích là ${development}, qua đó giữ được chất riêng mà vẫn mở ra thêm lựa chọn hành động.`,
    `${relatedLabel} số ${valueLabel(relatedNumber)} đưa thêm sắc thái ${related[0]}. Hai nguồn lực này có thể hỗ trợ nhau khi bạn dành thời gian xác định vai trò của từng bên: số ${valueLabel(number)} giữ trục chính, còn số ${valueLabel(relatedNumber)} bổ sung cách triển khai. Khi chúng kéo theo hai nhu cầu khác nhau, một nhịp chuyển có chủ ý giữa suy nghĩ, trao đổi và hành động sẽ hiệu quả hơn việc cố dùng một cách phản ứng cho mọi tình huống.`,
    `Trong thực tế, chất lượng của số ${valueLabel(number)} được nhìn qua sự nhất quán giữa điều bạn coi trọng và việc bạn lặp lại mỗi ngày. Một lựa chọn nhỏ nhưng được duy trì thường cho thấy nhiều hơn một tuyên bố lớn. Bạn có thể quan sát ba dấu hiệu: việc nào làm năng lượng sáng rõ hơn, quan hệ nào cho phép mình giữ đúng ranh giới, và điều gì vẫn còn ý nghĩa sau khi cảm xúc tức thời đã lắng xuống.`
  ];
}

function chartParagraphs(profile) {
  const counts = profile.date.birth_chart.counts;
  const repeated = Object.entries(counts).filter(([, count]) => count > 1).map(([number, count]) => `số ${number} xuất hiện ${count} lần`);
  const absent = Object.entries(counts).filter(([, count]) => count === 0).map(([number]) => number);
  const filled = profile.date.birth_chart.filled_arrows;
  const empty = profile.date.birth_chart.empty_arrows;
  return [
    `Biểu đồ ngày sinh được dựng từ các chữ số của ${profile.date.birth_date}, bỏ số 0 và giữ nguyên số lần lặp. Trong biểu đồ này, ${repeated.length ? repeated.join(", ") : "không có ô nào lặp nhiều lần"}. Số lặp làm chủ đề của ô đó được nhấn mạnh hơn trong thói quen phản ứng, nhưng ý nghĩa vẫn cần đặt cạnh năm số lõi và bối cảnh sống thay vì tách riêng thành một kết luận cố định.`,
    `${absent.length ? `Các số ít được đại diện trong ngày sinh là ${absent.join(", ")}.` : "Cả chín ô đều có đại diện trong ngày sinh."} Khoảng trống cho biết những phẩm chất cần được xây bằng trải nghiệm, môi trường và sự luyện tập có chủ ý. Nó không phải nhãn thiếu hụt. Khi một phẩm chất chưa tự xuất hiện, phương pháp cụ thể và nhịp lặp ổn định thường hữu ích hơn việc tự ép mình phải thay đổi ngay.`,
    `${filled.length ? `Mũi tên đầy ${filled.join(", ")} cho thấy một số tuyến năng lượng đã có sự nối liền tự nhiên.` : "Không có mũi tên đầy, vì vậy điểm nhấn nằm ở cách từng ô phối hợp qua trải nghiệm."} ${empty.length ? `Các đường trống ${empty.join(", ")} gợi ý vùng cần chủ động tạo cấu trúc hỗ trợ.` : "Không có đường trống hoàn toàn, nên việc phát triển chủ yếu nằm ở chất lượng sử dụng từng tuyến."} Cách đọc tốt nhất là nhìn tương tác giữa ô lặp, ô vắng và các con số lõi.`,
    `Biểu đồ này trở nên hữu ích khi được nối với hành vi có thể quan sát. Hãy chú ý cách bạn bắt đầu một việc, duy trì nhịp giữa chặng và hoàn tất khi hứng thú ban đầu đã giảm. Những điểm mạnh thường xuất hiện như phản xạ tự nhiên; những vùng cần xây thường cần lịch trình, người đồng hành hoặc môi trường nhắc nhở. Qua thời gian, chính cách tổ chức điều kiện xung quanh sẽ quyết định phẩm chất nào được dùng ổn định.`,
    `Khi chọn một ô hoặc một mũi tên trên màn hình, phần giải thích nên được xem như một lớp phóng đại của toàn biểu đồ. Việc quay lại tổng thể giúp tránh kết luận quá nhanh từ một dấu hiệu riêng lẻ. Hai người có cùng mũi tên vẫn có thể biểu hiện khác nhau vì Đường đời, Sứ mệnh, động cơ bên trong và giai đoạn hiện tại tạo ra những cách phối hợp riêng.`
  ];
}

function namePatternParagraphs(profile) {
  const name = profile.birth_name;
  const hidden = name.hidden_passion.join(", ");
  const missing = name.missing_name_numbers.join(", ");
  return [
    `Tên khai sinh tạo thêm một bản đồ về cách năng lực được biểu đạt. Trong tên này, số xuất hiện nhiều nhất là ${hidden || "không có"}; đây là xu hướng quan tâm hoặc tài năng dễ lặp lại, nhưng không thay thế năm chỉ số lõi. Việc quan sát lĩnh vực nào thường khiến bạn tự nguyện dành thời gian sẽ cho biết chủ đề này đang được dùng như năng lực thực tế hay mới dừng ở mức hứng thú.`,
    `${missing ? `Các số ít được đại diện trong tên là ${missing}.` : "Các số từ 1 đến 9 đều được đại diện trong tên."} Những vùng này có thể được phát triển qua trải nghiệm nghề nghiệp, quan hệ, trách nhiệm và những kỹ năng học được về sau. Cách diễn giải phù hợp là xác định điều kiện giúp một phẩm chất xuất hiện đều hơn, tránh gán cho chúng ý nghĩa nợ nần hoặc một số phận đã được ấn định.`,
    `Chỉ số Cân bằng ${valueLabel(name.balance.value)} nói riêng về cách phản ứng khi căng thẳng. ${meaning(name.balance.value)[0]} có thể trở thành nguồn tham khảo khi bạn cần lấy lại nhịp. Phạm vi của chỉ số này khá hẹp: nó không đại diện cho toàn bộ tính cách, mà gợi ý một cửa vào giúp giảm nhiễu trước khi quay lại vấn đề chính.`,
    `Chỉ số Tiềm thức ${name.subconscious_self} phản ánh độ rộng của các phẩm chất đã có đại diện trong tên. Con số này nên được đọc cùng số lặp và số ít đại diện, bởi tổng số nhóm hiện diện không nói hết cách chúng được sử dụng. Sự linh hoạt tăng lên khi bạn có nhiều hơn một phản ứng quen thuộc và biết chọn phản ứng phù hợp với hoàn cảnh.`,
    `Chữ đầu ${name.cornerstone} và chữ cuối ${name.capstone} của đơn vị tên gọi ${name.given_unit} bổ sung sắc thái về cách khởi đầu và hoàn tất. Chúng hữu ích nhất khi được đối chiếu với hành vi thật: bạn thường cần điều gì để bắt tay, và điều gì giúp chốt một việc đến nơi đến chốn. Phần này chỉ được tính sau khi cấu trúc tên đã được xác nhận.`
  ];
}

function cycleParagraphs(profile) {
  const date = profile.date;
  const periods = date.periods.map((item) => `giai đoạn ${item.index} mang số ${valueLabel(item.value)} từ tuổi ${item.age_start}${item.age_end == null ? " trở đi" : ` đến ${item.age_end}`}`);
  const pinnacles = date.pinnacles.map((item) => `đỉnh ${item.index} số ${valueLabel(item.value)} ở tuổi ${item.age_start}${item.age_end == null ? " trở đi" : ` đến ${item.age_end}`}`);
  return [
    `Ba chu kỳ lớn tạo nền thời gian cho quá trình phát triển: ${periods.join("; ")}. Mỗi giai đoạn đặt một nhóm phẩm chất lên gần trung tâm hơn, trong khi các chỉ số lõi vẫn giữ vai trò xuyên suốt. Sự chuyển giai đoạn thường được cảm nhận như đổi trọng tâm học hỏi, trách nhiệm hoặc cách nhìn, thay vì một sự kiện buộc phải xảy ra vào đúng một thời điểm.`,
    `Bốn Đỉnh cao của hồ sơ gồm ${pinnacles.join("; ")}. Tên gọi Đỉnh cao mô tả chủ đề phát triển nổi bật, không đồng nghĩa mọi việc đều thuận lợi. Một giai đoạn có thể đem lại cả cơ hội lẫn khối lượng công việc lớn hơn. Giá trị của dòng thời gian là giúp nhận ra năng lực nào đang cần được dùng có ý thức và điều gì nên được xây thành nền tảng cho giai đoạn sau.`,
    `Bốn Thử thách lần lượt là ${date.challenges.join(", ")}. Chúng chỉ ra bài toán phát triển có xu hướng lặp trong từng chặng. Nếu có số 0, trọng tâm nằm ở việc giữ định hướng giá trị và nhận ra hoàn cảnh cần một góc nhìn rộng, chứ không phải sự thiếu vắng hay một nhãn xấu. Mỗi thử thách nên được đối chiếu với lựa chọn và phản hồi thực tế trong giai đoạn tương ứng.`,
    `Khi hai tuyến Đỉnh cao và Thử thách được đặt cạnh nhau, một bên cho thấy phẩm chất có thể phát triển, bên kia gợi ý điểm ma sát cần quản lý. Cách đọc này giúp tránh kỳ vọng đơn giản rằng giai đoạn thuận lợi sẽ không có khó khăn. Năng lực trưởng thành thường xuất hiện chính trong quá trình dùng phẩm chất của Đỉnh cao để xử lý bài toán của Thử thách.`,
    `Mốc tuổi là khung tham chiếu để nhìn lại và chuẩn bị, không phải lịch dự báo sự kiện. Bạn có thể dùng dòng thời gian để ghi nhận ba điều: trách nhiệm nào đang tăng, kiểu quyết định nào lặp lại, và năng lực nào cần được rèn trước lần chuyển tiếp kế tiếp. Việc so sánh với trải nghiệm thật giúp bản đọc có chiều sâu và giữ được quyền lựa chọn cá nhân.`
  ];
}

function forecastParagraphs(profile) {
  const forecast = profile.date.forecast;
  if (!forecast) return [];
  const year = forecast.personal_year.value;
  const m = meaning(year);
  const months = Object.entries(forecast.personal_months).map(([month, value]) => `tháng ${month} mang số ${value}`).join(", ");
  return [
    `Năm cá nhân ${forecast.year} mang số ${year}, nhấn vào ${m[0]}. Đây là lớp thời gian ngắn hạn nằm bên trong các chu kỳ dài, vì vậy nó phù hợp để chọn nhịp triển khai hơn là dự đoán một kết quả chắc chắn. Những việc đồng điệu với chủ đề năm thường dễ nhận được sự tập trung, còn việc đi ngược nhịp có thể cần thêm cấu trúc và thời gian.`,
    `Nguồn lực thuận của năm là ${m[1]}. Bạn có thể dùng nó để rà lại các mục tiêu đang mở, xác định việc nào thực sự cần tiến thêm một bước và việc nào nên khép lại. Khi áp lực tăng, điểm cần quan sát là xu hướng ${m[2]}. Một lịch xem lại định kỳ sẽ giúp điều chỉnh sớm trước khi lựa chọn nhỏ tích tụ thành căng thẳng.`,
    `Mười hai tháng cá nhân lần lượt là: ${months}. Mỗi tháng là một sắc thái ngắn bên trong chủ đề chung của năm. Sự chuyển số không buộc cuộc sống thay đổi ngay ngày đầu tháng; nó gợi ý một cách sắp nhịp để quan sát, chuẩn bị và phân bổ nguồn lực theo những ưu tiên đang có.`,
    `Khi xem từng tháng, hãy nối con số với việc đã có trong lịch thay vì tạo thêm nhiệm vụ chỉ để đi theo dự báo. Tháng thiên về khởi động phù hợp với quyết định cần mở đường; tháng thiên về hợp tác phù hợp với trao đổi và tinh chỉnh; tháng thiên về hoàn tất phù hợp với việc dọn phần tồn. Cách dùng linh hoạt giữ cho chu kỳ trở thành công cụ phản tư.`,
    `Hướng phát triển của số ${year} trong năm là ${m[3]}. Cuối mỗi tháng, một lượt nhìn lại ngắn về năng lượng, tiến độ và chất lượng quan hệ sẽ cho dữ liệu tốt hơn cảm giác nhất thời. Sau vài tháng, các mẫu lặp đủ rõ để bạn điều chỉnh cách làm mà vẫn giữ mục tiêu và giới hạn đã chọn.`
  ];
}

function buildNarrative(profile) {
  const name = profile.birth_name; const date = profile.date;
  const sections = [
    { id: "overview", title: "Bức tranh tổng hợp", paragraphs: coreParagraphs("life", date.life_path.value, "Sứ mệnh", name.expression.reduced) },
    { id: "core", title: "Năm chỉ số cốt lõi", paragraphs: [
      ...coreParagraphs("birthday", date.birthday.value, "Đường đời", date.life_path.value),
      ...coreParagraphs("soul", name.soul_urge.reduced, "Nhân cách", name.personality.reduced),
      ...coreParagraphs("personality", name.personality.reduced, "Linh hồn", name.soul_urge.reduced)
    ] },
    { id: "expression", title: "Năng lực biểu đạt và hướng trưởng thành", paragraphs: [
      ...coreParagraphs("expression", name.expression.reduced, "Đường đời", date.life_path.value),
      ...coreParagraphs("maturity", profile.maturity, "Sứ mệnh", name.expression.reduced)
    ] },
    { id: "name", title: "Cấu trúc tên", paragraphs: namePatternParagraphs(profile) },
    { id: "chart", title: "Biểu đồ ngày sinh", paragraphs: chartParagraphs(profile) },
    { id: "bridges", title: "Nhịp nối giữa các chỉ số", paragraphs: [
      `Cầu nối Đường đời và Sứ mệnh là ${profile.bridges.life_path_expression}. Khoảng cách này mô tả mức điều chỉnh giữa trục phát triển dài hạn và cách năng lực đi ra thành hành động. Giá trị nhỏ thường cho thấy hai phía dễ tìm tiếng nói chung; giá trị lớn gợi ý cần một bước chuyển rõ hơn giữa điều muốn học và cách đang triển khai.`,
      `Cầu nối Linh hồn và Nhân cách là ${profile.bridges.soul_personality}. Chỉ số này giúp nhìn mối quan hệ giữa động cơ riêng và lớp biểu hiện ban đầu. Khi hai phía có nhịp khác nhau, bạn có thể cần thêm thời gian hoặc mức an toàn đủ tốt trước khi thể hiện điều thật sự quan trọng. Sự khác biệt ấy không đồng nghĩa thiếu chân thật.`,
      `Cầu nối Đường đời và Ngày sinh là ${profile.bridges.life_path_birthday}. Nó cho biết năng lực cụ thể của ngày sinh cần được điều chỉnh ra sao để phục vụ hành trình dài. Việc đặt một kỹ năng đúng vai trò thường hiệu quả hơn cố dùng nó cho mọi vấn đề.`,
      `Tư duy Lý trí số ${profile.rational_thought} mô tả phong cách xử lý vấn đề. ${meaning(profile.rational_thought)[0]} trở thành điểm tham khảo khi cần tách dữ kiện, cảm xúc và giả định. Chỉ số này bổ trợ cho bản đọc tổng thể, vì quyết định thực tế vẫn chịu ảnh hưởng của kinh nghiệm, bối cảnh và chất lượng thông tin.`,
      `Các cầu nối hữu ích nhất khi được dùng như câu hỏi quan sát. Bạn có thể nhận ra thời điểm mình đang sống theo trục Đường đời nhưng công cụ biểu đạt chưa theo kịp, hoặc lúc bề ngoài đã thích nghi trong khi động cơ bên trong cần được nghe rõ hơn. Một bước điều chỉnh nhỏ, được lặp đều, thường đủ để hai phía dần phối hợp.`
    ] },
    { id: "cycles", title: "Chu kỳ và các chặng phát triển", paragraphs: cycleParagraphs(profile) },
    { id: "year", title: `Năm cá nhân ${date.forecast?.year || "được chọn"}`, paragraphs: forecastParagraphs(profile) },
    { id: "integration", title: "Gợi ý tích hợp", paragraphs: [
      `Toàn bộ hồ sơ nên được đọc theo cấu trúc, bắt đầu từ năm số lõi rồi mới đi vào biểu đồ, tên và chu kỳ. Dấu hiệu lặp ở nhiều lớp đáng chú ý hơn một con số đứng riêng. Khi cùng một phẩm chất xuất hiện ở Đường đời, Sứ mệnh hoặc ô lặp, chủ đề ấy thường có nhiều đường biểu hiện và cần được quản lý ở cả mặt thuận lẫn điểm ma sát.`,
      `Một bản đọc có giá trị khi giúp bạn gọi tên điều đã quan sát được trong đời sống. Hãy đánh dấu phần nào đúng rõ, phần nào chỉ đúng trong vài hoàn cảnh và phần nào chưa có đủ trải nghiệm để kiểm chứng. Cách đối chiếu này giữ sự chủ động, đồng thời ngăn một mô tả chung trở thành nhãn cố định cho bản thân.`,
      `Nếu muốn chọn một trọng tâm trong ba tháng, hãy ưu tiên giao điểm giữa chủ đề năm cá nhân, năng lực cốt lõi và một trách nhiệm đang có thật. Mục tiêu nên đủ cụ thể để theo dõi, đủ nhỏ để duy trì và đủ ý nghĩa để không phụ thuộc hoàn toàn vào hứng thú. Sau mỗi chu kỳ ngắn, điều chỉnh theo dữ liệu đã có.`,
      `Trong quan hệ, bản đọc có thể giúp giải thích nhu cầu giao tiếp, nhịp riêng và cách phản ứng dưới áp lực. Nó không thay thế trao đổi trực tiếp. Mỗi người vẫn cần nói rõ giới hạn, kỳ vọng và điều kiện hợp tác. Khi dùng ngôn ngữ mô tả thay cho phán xét, các con số trở thành một khung mở để hiểu khác biệt.`,
      `Phần đáng giữ lại là những quan sát giúp bạn ra quyết định tỉnh táo hơn. Điểm mạnh cần môi trường để phát huy; điểm ma sát cần phương pháp và thời gian; chu kỳ cần được đặt cạnh lịch sống thật. Bản báo cáo vì thế phù hợp như một tài liệu tự chiêm nghiệm, được xem lại khi trách nhiệm hoặc mục tiêu đã thay đổi.`
    ] },
    { id: "calculation", title: "Cách tính", paragraphs: [
      `Đường đời được tính bằng cách rút gọn riêng tháng, ngày và năm sinh, giữ 11, 22, 33 khi xuất hiện, rồi cộng ba phần và rút gọn lần cuối. Hồ sơ này cho kết quả ${valueLabel(date.life_path.value)} từ tổng ${date.life_path.sum}. Ngày sinh giữ nguyên ngày ${date.birthday.raw} cùng kết quả ${valueLabel(date.birthday.value)}.`,
      `Các chỉ số tên dùng bảng quy đổi Pythagoras từ A đến Z. Từng đơn vị tên được cộng và rút gọn riêng trước khi kết hợp. Sứ mệnh là ${valueLabel(name.expression.reduced)}, Linh hồn là ${valueLabel(name.soul_urge.reduced)}, Nhân cách là ${valueLabel(name.personality.reduced)}. Dấu tiếng Việt được bỏ khi tính, còn cấu trúc tên đã xác nhận được giữ nguyên.`,
      `Chữ Y được phân loại theo lựa chọn đã xác nhận cho từng vị trí. Nguyên âm đi vào Linh hồn, phụ âm đi vào Nhân cách, và mọi chữ cái đều tham gia Sứ mệnh. Tên hiện tại, nếu có, được tính thành một lớp riêng và không thay thế tên khai sinh.`,
      `Biểu đồ ngày sinh dùng các chữ số của ngày tháng năm sinh, bỏ số 0 và giữ số lần lặp. Mũi tên đầy cần đủ cả ba số trên một tuyến; đường trống cần vắng cả ba số. Đỉnh cao, Thử thách, ba Chu kỳ và năm cá nhân dùng các phép cộng hoặc hiệu theo quy ước hiển thị trong từng bảng.`,
      `Các phép tính tạo ra một hệ quy ước để tổ chức quan sát cá nhân. Chúng không phải phép đo khoa học về tính cách và không dùng để thay thế đánh giá chuyên môn. Phần luận giải giữ ngôn ngữ xác suất, tôn trọng bối cảnh và quyền lựa chọn của người đọc.`
    ] }
  ];
  return { sections, wordCount: sections.flatMap((section) => section.paragraphs).join(" ").trim().split(/\s+/).length };
}

module.exports = { SEMANTICS, valueLabel, buildNarrative };

});
const engine=load('numerology/engine'); const synthesis=load('numerology/synthesis'); global.MXiaoNumerologyEngine=Object.freeze({...engine,...synthesis});
})(typeof globalThis!=='undefined'?globalThis:window);
