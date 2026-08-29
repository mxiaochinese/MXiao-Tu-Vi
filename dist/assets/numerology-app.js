(function () {
  "use strict";

  const E = window.MXiaoNumerologyEngine;
  const P = window.MXiaoPdf;
  const S = window.MXiaoWholePerson;
  if (!E || !P) throw new Error("Thần số học tạm thời không khả dụng.");
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const state = { profile: null, narrative: null, reviews: {}, selectedChartItem: null };
  const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const SECTION_LABELS = { overview: "Bức tranh tổng hợp", core: "Năm chỉ số cốt lõi", expression: "Năng lực và trưởng thành", name: "Cấu trúc tên", chart: "Biểu đồ ngày sinh", bridges: "Nhịp nối giữa các chỉ số", cycles: "Chu kỳ phát triển", year: "Năm cá nhân", integration: "Gợi ý tích hợp", calculation: "Cách tính" };

  function valueLabel(number) { return E.valueLabel(number); }
  function showError(message) { $("numerology-form-error").textContent = message || ""; $("numerology-form-error").hidden = !message; }
  function parseDate() {
    const [year, month, day] = $("numerology-date").value.split("-").map(Number);
    if (!year || !month || !day) throw new Error("Hãy nhập ngày sinh hợp lệ.");
    return { day, month, year };
  }
  function reviewKey(kind) { return kind === "birth" ? $("numerology-birth-name").value.trim() : $("numerology-current-name").value.trim(); }
  function freshReview(kind) {
    const name = reviewKey(kind);
    const normalized = E.normalizeName(name);
    const tokens = normalized.split(" ").map((token) => token.replace(/['-]/g, "")).filter(Boolean);
    return { name, tokens, mergedAfter: new Set(), givenUnitIndex: Math.max(0, tokens.length - 1), yOverrides: {}, confirmed: false };
  }
  function ensureReview(kind) {
    const name = reviewKey(kind);
    if (!name) return null;
    if (!state.reviews[kind] || state.reviews[kind].name !== name) state.reviews[kind] = freshReview(kind);
    return state.reviews[kind];
  }
  function unitGroups(review) {
    const groups = [];
    review.tokens.forEach((_, index) => {
      if (index > 0 && review.mergedAfter.has(index - 1)) groups[groups.length - 1].push(index);
      else groups.push([index]);
    });
    return groups;
  }
  function unitLabels(review) { return unitGroups(review).map((group) => group.map((index) => review.tokens[index]).join(" ")); }
  function reviewBlock(kind, title) {
    const review = ensureReview(kind);
    if (!review) return "";
    const groups = unitGroups(review);
    if (review.givenUnitIndex >= groups.length) review.givenUnitIndex = groups.length - 1;
    const yItems = E.yReviewItems(review.name, "vi");
    return `<section class="name-review-card" data-review-kind="${kind}"><div class="name-review-heading"><h4>${esc(title)}</h4><span>${review.confirmed ? "Đã xác nhận" : "Cần xác nhận"}</span></div><p class="normalized-name">${esc(E.normalizeName(review.name))}</p><div class="name-token-row">${review.tokens.map((token, index) => `${index ? `<label class="merge-control"><input type="checkbox" data-merge-boundary="${index - 1}" ${review.mergedAfter.has(index - 1) ? "checked" : ""}> Gộp</label>` : ""}<span>${esc(token)}</span>`).join("")}</div><label class="review-select">Đơn vị tên gọi<select data-given-unit>${groups.map((group, index) => `<option value="${index}" ${index === review.givenUnitIndex ? "selected" : ""}>${esc(group.map((tokenIndex) => review.tokens[tokenIndex]).join(" "))}</option>`).join("")}</select></label>${yItems.length ? `<div class="y-review-list"><h5>Xác nhận vai trò từng chữ Y</h5>${yItems.map((item) => { const key = `${item.token_index}:${item.char_index}`; return `<label><span>${esc(item.token)}: chữ Y ở vị trí ${item.char_index + 1}</span><select data-y-key="${key}"><option value="">Chọn vai trò</option><option value="vowel" ${review.yOverrides[key] === "vowel" ? "selected" : ""}>Nguyên âm</option><option value="consonant" ${review.yOverrides[key] === "consonant" ? "selected" : ""}>Phụ âm</option></select></label>`; }).join("")}</div>` : `<p class="review-ready">Tên này không có chữ Y cần phân loại.</p>`}</section>`;
  }
  function renderReview() {
    const birth = ensureReview("birth");
    if (!birth) throw new Error("Hãy nhập họ tên khai sinh.");
    const current = ensureReview("current");
    $("numerology-name-review-root").innerHTML = `${reviewBlock("birth", "Tên khai sinh")}${current ? reviewBlock("current", "Tên đang dùng") : ""}<button id="numerology-confirm-name" class="primary-button compact" type="button">Xác nhận và lập báo cáo</button>`;
    $("numerology-name-review").hidden = false;
  }
  function captureReviewChanges(event) {
    const card = event.target.closest("[data-review-kind]");
    if (!card) return;
    const kind = card.dataset.reviewKind; const review = state.reviews[kind];
    if (event.target.matches("[data-merge-boundary]")) {
      const boundary = Number(event.target.dataset.mergeBoundary);
      if (event.target.checked) review.mergedAfter.add(boundary); else review.mergedAfter.delete(boundary);
      review.confirmed = false;
      renderReview();
    } else if (event.target.matches("[data-given-unit]")) {
      review.givenUnitIndex = Number(event.target.value); review.confirmed = false;
    } else if (event.target.matches("[data-y-key]")) {
      const key = event.target.dataset.yKey;
      if (event.target.value) review.yOverrides[key] = event.target.value; else delete review.yOverrides[key];
      review.confirmed = false;
    }
  }
  function profileInput(requireFinal = false) {
    const birth = ensureReview("birth"); const current = ensureReview("current"); const date = parseDate();
    if (requireFinal) {
      for (const review of [birth, current].filter(Boolean)) {
        const missingY = E.yReviewItems(review.name, "vi").filter((item) => !review.yOverrides[`${item.token_index}:${item.char_index}`]);
        if (missingY.length) throw new Error("Hãy xác nhận vai trò của từng chữ Y.");
        review.confirmed = true;
      }
    }
    const birthGroups = unitGroups(birth);
    const input = { birthName: birth.name, ...date, targetYear: Number($("numerology-year").value), locale: "vi", yOverrides: birth.yOverrides, birthUnitGroups: birthGroups, birthGivenUnitIndex: Math.min(birth.givenUnitIndex, birthGroups.length - 1), birthStructureConfirmed: birth.confirmed };
    if (current) {
      const currentGroups = unitGroups(current);
      Object.assign(input, { currentName: current.name, currentYOverrides: current.yOverrides, currentUnitGroups: currentGroups, currentGivenUnitIndex: Math.min(current.givenUnitIndex, currentGroups.length - 1), currentStructureConfirmed: current.confirmed });
    }
    return input;
  }

  function coreCards(profile) {
    const items = [
      ["Đường đời", profile.date.life_path.value, "Trục phát triển dài hạn"],
      ["Ngày sinh", profile.date.birthday.value, `Năng lực từ ngày ${profile.date.birthday.raw}`],
      ["Sứ mệnh", profile.birth_name.expression.reduced, "Cách năng lực đi ra hành động"],
      ["Linh hồn", profile.birth_name.soul_urge.reduced, "Động cơ và nhu cầu bên trong"],
      ["Nhân cách", profile.birth_name.personality.reduced, "Ấn tượng và cách tiếp xúc ban đầu"]
    ];
    return items.map(([label, value, note]) => `<article class="numerology-core-card"><span>${esc(label)}</span><strong>${valueLabel(value)}</strong><p>${esc(note)}</p></article>`).join("");
  }
  function motifCards(profile) {
    const items = [
      ["Hướng trưởng thành", valueLabel(profile.maturity), E.SEMANTICS[profile.maturity][0]],
      ["Tư duy lý trí", valueLabel(profile.rational_thought), E.SEMANTICS[profile.rational_thought][0]],
      ["Xu hướng nổi trội trong tên", profile.birth_name.hidden_passion.map(valueLabel).join(", "), "Những số xuất hiện nhiều nhất trong tên khai sinh"],
      ["Năm cá nhân", String(profile.date.forecast.personal_year.value), `Chủ đề của năm ${profile.date.forecast.year}`]
    ];
    return items.map(([label, value, note]) => `<article><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${esc(note)}</p></article>`).join("");
  }
  function numberDetail(number, count) {
    const meaning = E.SEMANTICS[number];
    return `<h3>Số ${number}${count > 1 ? ` xuất hiện ${count} lần` : count ? " có mặt" : " ít được đại diện"}</h3><p>${esc(meaning[0])}.</p><p>${count ? `Mặt thuận là ${meaning[1]}. Điểm cần quan sát là xu hướng ${meaning[2]}.` : `Phẩm chất này có thể được xây dần qua trải nghiệm và phương pháp phù hợp. Hướng phát triển là ${meaning[3]}.`}</p>`;
  }
  function renderChart(profile) {
    const counts = profile.date.birth_chart.counts;
    const order = [3, 6, 9, 2, 5, 8, 1, 4, 7];
    $("numerology-birth-chart").innerHTML = `<div class="birth-grid">${order.map((number) => `<button type="button" data-chart-number="${number}" class="${counts[number] ? "present" : "absent"}"><span>${number}</span><small>${counts[number] ? "•".repeat(counts[number]) : "Chưa có"}</small></button>`).join("")}</div><div class="arrow-list"><h3>Mũi tên và đường trống</h3>${profile.date.birth_chart.filled_arrows.map((line) => `<button type="button" data-chart-arrow="${line}" data-filled="true">Mũi tên ${line}</button>`).join("")}${profile.date.birth_chart.empty_arrows.map((line) => `<button type="button" data-chart-arrow="${line}" data-filled="false">Đường trống ${line}</button>`).join("") || "<p>Không có đường trống hoàn toàn.</p>"}</div>`;
    $("numerology-chart-detail").innerHTML = numberDetail(5, counts[5]);
  }
  function renderTimeline(profile) {
    const periods = profile.date.periods.map((item) => `<article><span>Chu kỳ ${item.index}</span><strong>${valueLabel(item.value)}</strong><small>${item.age_start}${item.age_end == null ? "+" : `-${item.age_end}`} tuổi</small></article>`).join("");
    const pinnacles = profile.date.pinnacles.map((item, index) => `<article><span>Đỉnh ${item.index}</span><strong>${valueLabel(item.value)}</strong><small>${item.age_start}${item.age_end == null ? "+" : `-${item.age_end}`} tuổi</small><em>Thử thách ${profile.date.challenges[index]}</em></article>`).join("");
    $("numerology-timeline").innerHTML = `<div class="cycle-track periods-track">${periods}</div><div class="cycle-track pinnacles-track">${pinnacles}</div><p class="timeline-year-marker">Năm đang xem: <strong>${profile.date.forecast.year}</strong> · Năm cá nhân <strong>${profile.date.forecast.personal_year.value}</strong></p>`;
  }
  function renderMonths(profile) {
    $("numerology-month-title").textContent = `12 tháng cá nhân ${profile.date.forecast.year}`;
    $("numerology-months").innerHTML = MONTHS.map((label, index) => `<article><span>${label}</span><strong>${profile.date.forecast.personal_months[index + 1]}</strong><p>${esc(E.SEMANTICS[profile.date.forecast.personal_months[index + 1]][0])}</p></article>`).join("");
  }
  function renderReport(narrative) {
    $("numerology-report-nav").innerHTML = narrative.sections.map((section) => `<a href="#numerology-report-${section.id}">${esc(section.title)}</a>`).join("");
    $("numerology-report").innerHTML = narrative.sections.map((section) => `<section id="numerology-report-${section.id}"><h3>${esc(section.title)}</h3>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section>`).join("");
  }
  function renderCalculation(profile) {
    const life = profile.date.life_path;
    $("numerology-calculation-root").innerHTML = `<p><strong>Đường đời:</strong> tháng ${life.units.month.value} + ngày ${life.units.day.value} + năm ${life.units.year.value} = ${life.sum} → ${valueLabel(life.value)}</p><p><strong>Sứ mệnh:</strong> ${profile.birth_name.expression_parts.map((part) => `${part.unit} ${part.sum} → ${valueLabel(part.reduced)}`).join("; ")} → ${valueLabel(profile.birth_name.expression.reduced)}</p><p><strong>Linh hồn:</strong> ${valueLabel(profile.birth_name.soul_urge.reduced)} · <strong>Nhân cách:</strong> ${valueLabel(profile.birth_name.personality.reduced)} · <strong>Trưởng thành:</strong> ${valueLabel(profile.maturity)}</p><p><strong>Cầu nối:</strong> Đường đời và Sứ mệnh ${profile.bridges.life_path_expression}; Linh hồn và Nhân cách ${profile.bridges.soul_personality}; Đường đời và Ngày sinh ${profile.bridges.life_path_birthday}.</p>`;
  }
  function renderPdfOptions(narrative) {
    $("numerology-pdf-options-grid").innerHTML = narrative.sections.map((section) => `<label class="pdf-option"><input type="checkbox" data-numerology-pdf="${section.id}" checked><span>${esc(SECTION_LABELS[section.id] || section.title)}</span></label>`).join("");
  }
  function renderProfile(profile) {
    const narrative = E.buildNarrative(profile);
    state.profile = profile; state.narrative = narrative;
    $("numerology-result").hidden = false;
    $("numerology-result-title").textContent = profile.birth_name.original;
    $("numerology-result-meta").textContent = `${profile.date.birth_date} · Năm cá nhân ${profile.date.forecast.personal_year.value} trong ${profile.date.forecast.year}`;
    $("numerology-core-cards").innerHTML = coreCards(profile);
    $("numerology-motifs").innerHTML = motifCards(profile);
    renderChart(profile); renderTimeline(profile); renderMonths(profile); renderReport(narrative); renderCalculation(profile); renderPdfOptions(narrative);
    $("numerology-result").scrollIntoView({ behavior: "smooth", block: "start" });
    void synthesizeOverview(profile, narrative);
  }
  async function synthesizeOverview(profile, deterministicNarrative) {
    if (!S) return;
    const input = S.numerologyInput(profile, deterministicNarrative);
    if (!input.evidence.length) return;
    const wholePersonProfile = await S.requestWholePerson(input);
    if (state.profile !== profile || !wholePersonProfile) return;
    const content = S.overviewContent(wholePersonProfile);
    const paragraphs = [content.portrait, content.identity, ...content.strengths.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`), ...content.tensions.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`)].filter(Boolean);
    const narrative = {
      ...deterministicNarrative,
      sections: deterministicNarrative.sections.map((section) => section.id === "overview" ? { ...section, title: "Chân dung tổng hợp", paragraphs } : section)
    };
    profile.wholePersonProfile = wholePersonProfile;
    state.narrative = narrative;
    renderReport(narrative);
    renderPdfOptions(narrative);
  }
  function confirmAndBuild() {
    try {
      showError("");
      const profile = E.calculateProfile(profileInput(true));
      if (profile.status !== "final") throw new Error("Hãy hoàn tất xác nhận tên trước khi lập báo cáo.");
      renderReview();
      renderProfile(profile);
    } catch (error) { showError(error.message || "Không thể lập báo cáo Thần số học."); }
  }
  function selectedPdfSections() { return Array.from(document.querySelectorAll("[data-numerology-pdf]:checked")).map((input) => input.dataset.numerologyPdf); }
  function reset() {
    $("numerology-form").reset();
    $("numerology-birth-name").value = ""; $("numerology-date").value = ""; $("numerology-current-name").value = "";
    state.profile = null; state.narrative = null; state.reviews = {};
    $("numerology-name-review").hidden = true; $("numerology-result").hidden = true; showError("");
  }

  const currentYear = new Date().getFullYear();
  $("numerology-year").innerHTML = Array.from({ length: 21 }, (_, index) => currentYear - 5 + index).map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`).join("");
  $("numerology-form").addEventListener("submit", (event) => { event.preventDefault(); try { showError(""); renderReview(); } catch (error) { showError(error.message); } });
  $("numerology-name-review-root").addEventListener("change", captureReviewChanges);
  $("numerology-name-review-root").addEventListener("click", (event) => { if (event.target.id === "numerology-confirm-name") confirmAndBuild(); });
  $("numerology-reset").addEventListener("click", reset);
  $("numerology-birth-chart").addEventListener("click", (event) => {
    const numberButton = event.target.closest("[data-chart-number]"); const arrowButton = event.target.closest("[data-chart-arrow]");
    if (numberButton && state.profile) { const number = Number(numberButton.dataset.chartNumber); $("numerology-chart-detail").innerHTML = numberDetail(number, state.profile.date.birth_chart.counts[number]); }
    if (arrowButton) { const line = arrowButton.dataset.chartArrow; const filled = arrowButton.dataset.filled === "true"; $("numerology-chart-detail").innerHTML = `<h3>${filled ? "Mũi tên" : "Đường trống"} ${esc(line)}</h3><p>${filled ? "Ba số trên tuyến đều có mặt, cho thấy phẩm chất của tuyến này dễ nối thành một phản xạ tự nhiên." : "Ba số trên tuyến đều ít được đại diện, vì vậy phẩm chất liên quan thường cần môi trường và phương pháp hỗ trợ rõ hơn."}</p><p>Hãy đọc tuyến này cùng các ô lặp, ô vắng và năm chỉ số cốt lõi.</p>`; }
  });
  $("numerology-pdf-options-button").addEventListener("click", () => { const panel = $("numerology-pdf-options"); panel.hidden = !panel.hidden; $("numerology-pdf-options-button").setAttribute("aria-expanded", String(!panel.hidden)); });
  $("numerology-pdf-options-close").addEventListener("click", () => { $("numerology-pdf-options").hidden = true; $("numerology-pdf-options-button").setAttribute("aria-expanded", "false"); });
  $("numerology-pdf-button").addEventListener("click", async () => {
    if (!state.profile || !state.narrative) return;
    const sections = selectedPdfSections();
    if (!sections.length) { showError("Hãy chọn ít nhất một phần cho PDF Thần số học."); return; }
    try {
      $("numerology-pdf-button").disabled = true; $("numerology-toolbar-status").textContent = "Đang tạo PDF...";
      const pages = await P.downloadNumerologyPdf(state.profile, state.narrative, { sections });
      $("numerology-toolbar-status").textContent = `Đã tạo ${pages} trang A4.`;
    } catch (error) { showError(error.message || "Không thể tạo PDF Thần số học."); $("numerology-toolbar-status").textContent = ""; }
    finally { $("numerology-pdf-button").disabled = false; }
  });
})();
