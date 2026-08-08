(function () {
  "use strict";

  const E = window.MXiaoTuviEngine;
  const C = window.MXiaoCalendar;
  const P = window.MXiaoPdf;
  const TIMEZONES = Array.isArray(window.MXiaoTimezones) ? window.MXiaoTimezones : ["Asia/Ho_Chi_Minh", "UTC"];
  if (!E || !C || !P) throw new Error("Không thể khởi tạo ứng dụng.");

  const GRID_POSITION = {
    6: [1, 1], 7: [2, 1], 8: [3, 1], 9: [4, 1],
    5: [1, 2], 10: [4, 2], 4: [1, 3], 11: [4, 3],
    3: [1, 4], 2: [2, 4], 1: [3, 4], 12: [4, 4]
  };
  const GROUP_LABELS = {
    major: "Chính tinh",
    transform: "Tứ Hóa",
    support: "Phụ tinh hỗ trợ",
    malefic: "Sao tạo trở lực",
    cycle: "Vòng sao"
  };
  const BRANCH_LABELS = ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const EXPORT_SECTION_IDS = ["cover", "overview", "chart", "menh_than", "cung_12", "dai_van", "tieu_van", "van_han", "luu_nguyet", "su_nghiep", "tai_chinh", "tinh_cam", "gia_dinh", "suc_khoe"];
  const EXPORT_PRESETS = {
    full: EXPORT_SECTION_IDS,
    summary: ["cover", "overview", "chart", "menh_than", "van_han"],
    fortune: ["cover", "overview", "chart", "dai_van", "tieu_van", "van_han", "luu_nguyet"],
    palaces: ["cover", "overview", "chart", "menh_than", "cung_12"]
  };
  const state = { calendarType: "solar", gender: "male", timeMode: "exact", chart: null, lastInput: null, lastNormalized: null, comparison: null, selectedPalaceId: 1, topic: "Tổng quan", pdfSections: new Set(EXPORT_SECTION_IDS), pdfPreset: "full" };
  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function normalizeSearch(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[_/]+/g, " ").replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase().trim().replace(/\s+/g, " ");
  }

  function setSegment(ids, activeId) {
    ids.forEach((id) => $(id).classList.toggle("active", id === activeId));
  }

  function showError(message) {
    const node = $("form-error");
    node.textContent = message || "";
    node.hidden = !message;
    if (message) node.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function status(message) {
    const node = $("toolbar-status");
    node.textContent = message;
    if (message) window.setTimeout(() => { if (node.textContent === message) node.textContent = ""; }, 5000);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatOffset(minutes) {
    const sign = minutes >= 0 ? "+" : "-";
    const absolute = Math.abs(minutes);
    return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
  }

  function branchRange(branch) {
    if (branch === 1) return "23:00-00:59";
    const start = branch * 2 - 3;
    return `${pad(start)}:00-${pad(start + 1)}:59`;
  }

  function parseTime() {
    if (state.timeMode === "branch") {
      const hourBranch = Number($("birthHourBranch").value);
      if (!Number.isInteger(hourBranch) || hourBranch < 1 || hourBranch > 12) throw new Error("Khung giờ sinh không hợp lệ.");
      const hour = hourBranch === 1 ? 0 : hourBranch * 2 - 2;
      return { hour, minute: 0, hourBranch, label: `Giờ ${BRANCH_LABELS[hourBranch]} (${branchRange(hourBranch)})` };
    }
    const match = /^(\d{2}):(\d{2})$/.exec($("birthTime").value);
    if (!match) throw new Error("Giờ sinh không hợp lệ.");
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new Error("Giờ sinh không hợp lệ.");
    return { hour, minute, hourBranch: null, label: `${pad(hour)}:${pad(minute)}` };
  }

  function parseSolarDate() {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec($("solarDate").value);
    if (!match) throw new Error("Ngày sinh dương lịch không hợp lệ.");
    const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    C.solarToLunar(date.day, date.month, date.year, 7);
    return date;
  }

  function selectedTimezone() {
    const timezone = $("timezone").value;
    if (!timezone || !E.isValidTimeZone(timezone)) throw new Error("Hãy chọn múi giờ hợp lệ.");
    return timezone;
  }

  function offsetHours(parts, timezone) {
    return E.getTimeZoneOffsetMinutes(parts, timezone) / 60;
  }

  function solarFromLunar(timezone, time) {
    const lunarDay = Number($("lunarDay").value);
    const lunarMonth = Number($("lunarMonth").value);
    const lunarYear = Number($("lunarYear").value);
    const leap = $("lunarLeap").checked;
    if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("Ngày âm lịch phải từ 1 đến 30.");
    if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("Tháng âm lịch phải từ 1 đến 12.");
    let offset = offsetHours({ year: lunarYear, month: 6, day: 15, hour: 12, minute: 0 }, timezone);
    let solar = C.lunarToSolar(lunarDay, lunarMonth, lunarYear, leap, offset);
    offset = offsetHours({ ...solar, ...time }, timezone);
    solar = C.lunarToSolar(lunarDay, lunarMonth, lunarYear, leap, offset);
    return solar;
  }

  function normalizeInput(input) {
    const time = parseTime();
    const solar = state.calendarType === "solar" ? parseSolarDate() : solarFromLunar(input.timezone, time);
    const offsetMinutes = E.getTimeZoneOffsetMinutes({ ...solar, hour: time.hour, minute: time.minute }, input.timezone);
    const lunar = C.solarToLunar(solar.day, solar.month, solar.year, offsetMinutes / 60);
    if (state.calendarType === "lunar") {
      const wanted = { year: Number($("lunarYear").value), month: Number($("lunarMonth").value), day: Number($("lunarDay").value), leap: $("lunarLeap").checked };
      if (wanted.year !== lunar.year || wanted.month !== lunar.month || wanted.day !== lunar.day || wanted.leap !== lunar.leap) throw new Error("Ngày âm lịch hoặc lựa chọn tháng nhuận không hợp lệ.");
    }
    const profile = E.getCalculationProfile(input.calculationProfileId);
    const dayCanChi = E.getDayStemBranch(solar.day, solar.month, solar.year);
    const hourBranch = time.hourBranch || E.getHourBranch(time.hour, time.minute, profile.ziHourMode);
    return {
      solar,
      originalSolar: solar,
      lunar,
      originalTime: time.label,
      adjustedTime: time.label,
      timeDisplay: time.label,
      timeCorrectionMode: "civil",
      timeCorrectionMinutes: 0,
      timezoneOffsetMinutes: offsetMinutes,
      hour: time.hour,
      minute: time.minute,
      hourBranch,
      yearStem: E.getYearStem(lunar.year),
      yearBranch: E.getYearBranch(lunar.year),
      dayStem: dayCanChi.stem,
      dayBranch: dayCanChi.branch,
      yearCanChi: E.getYearCanChi(lunar.year),
      dayCanChi: dayCanChi.label
    };
  }

  function findLeapMonth(viewYear, timezone) {
    if (!Number.isInteger(viewYear) || viewYear < 1900 || viewYear > 2199 || !timezone) return null;
    const offset = offsetHours({ year: viewYear, month: 6, day: 15, hour: 12, minute: 0 }, timezone);
    for (let month = 1; month <= 12; month += 1) {
      try {
        C.lunarToSolar(1, month, viewYear, true, offset);
        return month;
      } catch {
        // Tháng này không phải tháng nhuận của năm đang chọn.
      }
    }
    return null;
  }

  function refreshViewMonthOptions() {
    const select = $("viewMonth");
    const previous = select.value || "4";
    const viewYear = Number($("viewYear").value);
    const timezone = $("timezone").value;
    const leapMonth = findLeapMonth(viewYear, timezone);
    const options = [];
    for (let month = 1; month <= 12; month += 1) {
      options.push(`<option value="${month}">Tháng ${month}</option>`);
      if (leapMonth === month) options.push(`<option value="${month}-leap">Tháng ${month} nhuận</option>`);
    }
    select.innerHTML = options.join("");
    select.value = Array.from(select.options).some((option) => option.value === previous) ? previous : "4";
    $("view-month-help").textContent = leapMonth
      ? `Năm ${viewYear} có tháng ${leapMonth} nhuận; lựa chọn này chỉ xuất hiện ngay sau tháng ${leapMonth}.`
      : `Năm ${viewYear} không có tháng nhuận.`;
    return leapMonth;
  }

  function updateViewScopeFields() {
    const scope = $("viewScope").value;
    $("view-year-field").hidden = scope === "natal_overview";
    $("view-month-field").hidden = scope !== "single_month";
    if (scope === "single_month" || scope === "all_months") refreshViewMonthOptions();
  }

  function parseViewMonth() {
    const match = /^(\d{1,2})(-leap)?$/.exec($("viewMonth").value);
    if (!match) throw new Error("Tháng muốn xem không hợp lệ.");
    const month = Number(match[1]);
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    return { month, leap: Boolean(match[2]) };
  }

  function getInput() {
    const viewScope = $("viewScope").value;
    if (!["natal_overview", "yearly", "single_month", "all_months"].includes(viewScope)) throw new Error("Phạm vi luận giải không hợp lệ.");
    const timezone = selectedTimezone();
    const needsYear = viewScope !== "natal_overview";
    const viewYear = needsYear ? Number($("viewYear").value) : null;
    if (needsYear && (!Number.isInteger(viewYear) || viewYear < 1900 || viewYear > 2199)) throw new Error("Năm muốn xem phải nằm trong khoảng 1900 đến 2199.");
    const viewLeapMonth = needsYear ? findLeapMonth(viewYear, timezone) : null;
    const monthSelection = viewScope === "single_month" ? parseViewMonth() : null;
    if (monthSelection?.leap && monthSelection.month !== viewLeapMonth) throw new Error("Tháng được chọn không phải tháng nhuận của năm âm lịch này.");
    return {
      fullName: $("fullName").value.trim() || "Người xem",
      gender: state.gender,
      calendarType: state.calendarType,
      lunarLeap: $("lunarLeap").checked,
      timezone,
      viewScope,
      ...(needsYear ? { viewYear, viewLeapMonth } : {}),
      ...(monthSelection ? { viewMonth: monthSelection.month, viewLeap: monthSelection.leap } : {}),
      timePrecision: state.timeMode,
      calculationProfileId: $("calculationProfile").value
    };
  }

  function timezoneLabel(timezone) {
    try {
      const time = parseTime();
      const solar = state.calendarType === "solar" ? parseSolarDate() : { year: Number($("lunarYear").value), month: 6, day: 15 };
      const minutes = E.getTimeZoneOffsetMinutes({ ...solar, hour: time.hour, minute: time.minute }, timezone);
      return `${timezone} - ${formatOffset(minutes)}`;
    } catch {
      return timezone;
    }
  }

  function renderTimezoneOptions(query = "", preferred = "Asia/Ho_Chi_Minh") {
    const normalized = normalizeSearch(query);
    const tokens = normalized ? normalized.split(" ") : [];
    const priority = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo", "Europe/London", "Europe/Paris", "America/New_York", "Australia/Sydney", "UTC"];
    let matches = TIMEZONES.filter((zone) => tokens.every((token) => normalizeSearch(zone).includes(token)));
    matches.sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      return a.localeCompare(b);
    });
    if (normalized) matches = matches.slice(0, 100);
    const select = $("timezone");
    select.innerHTML = matches.map((zone) => `<option value="${esc(zone)}">${esc(timezoneLabel(zone))}</option>`).join("");
    if (!matches.length) {
      select.innerHTML = '<option value="">Không tìm thấy múi giờ</option>';
      $("timezone-help").textContent = "Hãy thử tên vùng hoặc thành phố khác, ví dụ Ho Chi Minh, Tokyo, New York.";
      return;
    }
    select.value = matches.includes(preferred) ? preferred : matches[0];
    updateTimezoneHelp();
  }

  function updateTimezoneHelp() {
    const timezone = $("timezone").value;
    $("timezone-help").textContent = timezone ? `Đang dùng ${timezoneLabel(timezone)} cho thời điểm sinh.` : "Hãy chọn múi giờ.";
  }

  function viewScopeLabel(chart) {
    const labels = {
      natal_overview: "Lá số tổng quan",
      yearly: `Vận năm ${chart.input.viewYear}`,
      single_month: `Tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""} năm ${chart.input.viewYear}`,
      all_months: `Toàn bộ các tháng năm ${chart.input.viewYear}`
    };
    return labels[chart.input.viewScope] || "Lá số tổng quan";
  }

  function fortuneSummary(chart) {
    const rows = [];
    if (chart.analysis.activeDecadeLabel) rows.push(["Đại vận", chart.analysis.activeDecadeLabel]);
    if (chart.analysis.annualDecadeLabel) rows.push([`Lưu đại hạn ${chart.input.viewYear}`, chart.analysis.annualDecadeLabel]);
    if (chart.analysis.minorFortuneLabel) rows.push([`Tiểu hạn ${chart.input.viewYear}`, chart.analysis.minorFortuneLabel]);
    if (chart.analysis.monthlyLabel) rows.push([`Lưu nguyệt tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}`, chart.analysis.monthlyLabel]);
    if (chart.input.viewScope === "all_months") rows.push(["Lưu nguyệt", `${chart.analysis.monthlyFortunes.length} tháng âm lịch đã được tính`]);
    return rows;
  }

  function palaceFlags(palace) {
    const chart = state.chart;
    const flags = [];
    if (palace.id === chart.lifePalace) flags.push("Mệnh");
    if (palace.isBody) flags.push("Thân");
    if (palace.id === chart.analysis.activeDecadePalaceId) flags.push("Đại vận");
    if (palace.id === chart.analysis.annualDecadePalaceId) flags.push("Lưu đại hạn");
    if (palace.id === chart.analysis.minorFortunePalaceId) flags.push("Tiểu hạn");
    if (palace.id === chart.analysis.yearBranchPalaceId) flags.push("Lưu Thái Tuế");
    if (palace.id === chart.analysis.monthlyPalaceId) flags.push(`Lưu nguyệt T${chart.input.viewMonth}${chart.input.viewLeap ? "N" : ""}`);
    return flags;
  }

  function palaceClasses(palace) {
    const chart = state.chart;
    return [
      "palace",
      palace.id === state.selectedPalaceId ? "selected" : "",
      palace.id === chart.lifePalace ? "active" : "",
      palace.id === chart.analysis.activeDecadePalaceId ? "active-decade" : "",
      palace.id === chart.analysis.annualDecadePalaceId ? "annual-decade" : "",
      palace.id === chart.analysis.minorFortunePalaceId ? "minor-fortune" : "",
      palace.id === chart.analysis.yearBranchPalaceId ? "year-branch" : "",
      palace.id === chart.analysis.monthlyPalaceId ? "monthly-fortune" : ""
    ].filter(Boolean).join(" ");
  }

  function renderPalace(palace) {
    const [column, row] = GRID_POSITION[palace.id];
    const major = palace.stars.filter((star) => star.group === "major");
    const minor = palace.stars.filter((star) => !["major", "cycle"].includes(star.group)).slice(0, 12);
    const flags = palaceFlags(palace);
    return `<article class="${palaceClasses(palace)}" data-palace="${palace.id}" tabindex="0" style="grid-column:${column};grid-row:${row}">
      <div class="palace-head"><div class="palace-title"><strong>${esc(palace.name)}${palace.isBody ? " - Thân" : ""}</strong><span>${esc(palace.element)} - ${palace.decadeStart}-${palace.decadeEnd} tuổi</span></div><span class="branch-badge">${esc(palace.branch)}</span></div>
      <div class="major-stars">${major.length ? major.map((star) => `<span class="major-star">${esc(star.name)}${star.brightness ? `<small>${esc(star.brightness)}</small>` : ""}</span>`).join("") : '<span class="major-star">Vô chính diệu</span>'}</div>
      <div class="minor-stars">${minor.map((star) => esc(star.name)).join(" · ")}</div>
      ${palace.annualStars.length ? `<div class="annual-stars">${palace.annualStars.map((star) => `<span>${esc(star.name)}</span>`).join("")}</div>` : ""}
      ${palace.monthlyStars.length ? `<div class="monthly-stars">${palace.monthlyStars.map((star) => `<span>${esc(star.name)}</span>`).join("")}</div>` : ""}
      <div class="palace-foot"><span>${flags.map((flag) => esc(flag)).join(" · ")}</span><span class="tuan-triet">${[palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""].filter(Boolean).join(" · ")}</span></div>
    </article>`;
  }

  function renderChart() {
    const chart = state.chart;
    const summary = fortuneSummary(chart);
    const center = `<section class="chart-center"><span class="center-kicker">${esc(chart.normalized.yearCanChi)} - ${chart.input.gender === "male" ? "Nam" : "Nữ"}</span><h3>${esc(chart.input.fullName)}</h3><p>Mệnh ${esc(chart.birthElement)} - ${esc(chart.bureau.label)}</p><div class="center-fortunes"><span><b>Phạm vi</b>${esc(viewScopeLabel(chart))}</span>${summary.map(([label, value]) => `<span><b>${esc(label)}</b>${esc(value)}</span>`).join("")}</div></section>`;
    $("chart-root").innerHTML = `<div class="chart-grid">${chart.palaces.map(renderPalace).join("")}${center}</div><div id="palace-detail-root"></div>`;
    $("chart-root").querySelectorAll("[data-palace]").forEach((node) => {
      const activate = () => { state.selectedPalaceId = Number(node.dataset.palace); renderChart(); };
      node.addEventListener("click", activate);
      node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
    });
    renderPalaceDetail();
  }

  function renderPalaceDetail() {
    const palace = state.chart.palaces.find((item) => item.id === state.selectedPalaceId) || state.chart.palaces[0];
    const groups = Object.keys(GROUP_LABELS).map((group) => ({ group, stars: palace.stars.filter((star) => star.group === group) })).filter((item) => item.stars.length);
    const flags = palaceFlags(palace);
    $("palace-detail-root").innerHTML = `<section class="palace-detail"><div class="palace-detail-head"><div><span class="detail-kicker">Cung đang chọn</span><h3>${esc(palace.name)} tại ${esc(palace.branch)}${palace.isBody ? " - Thân cư" : ""}</h3><p>${esc(palace.element)} - Đại vận ${palace.decadeStart}-${palace.decadeEnd} tuổi</p></div><div class="detail-flags">${flags.map((flag) => `<span>${esc(flag)}</span>`).join("")}${palace.hasTuan ? "<span>Tuần</span>" : ""}${palace.hasTriet ? "<span>Triệt</span>" : ""}</div></div><div class="star-groups">${groups.map(({ group, stars }) => `<div class="star-group group-${group}"><h4>${GROUP_LABELS[group]}</h4><div class="star-list">${stars.map((star) => `<span class="star-chip">${esc(star.name)}${star.brightness ? `<b>${esc(star.brightness)}</b>` : ""}</span>`).join("")}</div></div>`).join("")}${palace.annualStars.length ? `<div class="star-group group-annual"><h4>Sao lưu năm ${state.chart.input.viewYear}</h4><div class="star-list">${palace.annualStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}${palace.monthlyStars.length ? `<div class="star-group group-monthly"><h4>Sao lưu tháng ${state.chart.input.viewMonth}</h4><div class="star-list">${palace.monthlyStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}</div></section>`;
  }

  function orderedTopics(chart) {
    const existing = new Set(chart.interpretations.map((item) => item.topic));
    const periodTopics = Array.from(existing).filter((topic) => topic.startsWith("Vận hạn ") || topic.startsWith("Lưu nguyệt "));
    const desired = ["Tổng quan", "Mệnh - Thân", "12 cung", "Đại vận", "Tiểu vận", ...periodTopics, "Sự nghiệp", "Tài chính", "Tình cảm", "Gia đình - Quan hệ", "Sức khỏe - Nhịp sống"];
    return desired.filter((topic) => existing.has(topic));
  }

  function exportSectionDefinitions(chart) {
    const topics = new Set(chart.interpretations.map((item) => item.topic));
    const monthTopic = chart.input.viewScope === "all_months"
      ? `Lưu nguyệt năm ${chart.input.viewYear}`
      : `Lưu nguyệt tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}`;
    return [
      { id: "cover", label: "Trang bìa" },
      { id: "overview", label: "Tổng quan lá số" },
      { id: "chart", label: "Lá số 12 cung" },
      { id: "menh_than", label: "Mệnh - Thân", topic: "Mệnh - Thân" },
      { id: "cung_12", label: "Luận giải 12 cung", topic: "12 cung" },
      { id: "dai_van", label: "Đại vận", topic: "Đại vận" },
      { id: "tieu_van", label: "Tiểu vận", topic: "Tiểu vận" },
      { id: "van_han", label: `Vận hạn ${chart.input.viewYear}`, topic: `Vận hạn ${chart.input.viewYear}` },
      { id: "luu_nguyet", label: chart.input.viewScope === "all_months" ? `Lưu nguyệt cả năm ${chart.input.viewYear}` : `Lưu nguyệt tháng ${chart.input.viewMonth || ""}${chart.input.viewLeap ? " nhuận" : ""}`.trim(), topic: monthTopic },
      { id: "su_nghiep", label: "Sự nghiệp", topic: "Sự nghiệp" },
      { id: "tai_chinh", label: "Tài chính", topic: "Tài chính" },
      { id: "tinh_cam", label: "Tình cảm", topic: "Tình cảm" },
      { id: "gia_dinh", label: "Gia đình - Quan hệ", topic: "Gia đình - Quan hệ" },
      { id: "suc_khoe", label: "Sức khỏe - Nhịp sống", topic: "Sức khỏe - Nhịp sống" }
    ].map((item) => ({ ...item, available: !item.topic || topics.has(item.topic) })).concat(state.comparison ? [{ id: "so_sanh_gio", label: "So sánh hai khung giờ sinh", available: true }] : []);
  }

  function getPdfExportOptions() {
    if (!state.chart) return { cover: false, overview: false, chart: false, topics: [] };
    const definitions = exportSectionDefinitions(state.chart);
    return {
      cover: state.pdfSections.has("cover"),
      overview: state.pdfSections.has("overview"),
      chart: state.pdfSections.has("chart"),
      topics: definitions.filter((item) => item.available && item.topic && state.pdfSections.has(item.id)).map((item) => item.topic),
      comparison: state.comparison && state.pdfSections.has("so_sanh_gio") ? state.comparison : null
    };
  }

  function selectedPdfCount() {
    if (!state.chart) return 0;
    return exportSectionDefinitions(state.chart).filter((item) => item.available && state.pdfSections.has(item.id)).length;
  }

  function renderPdfOptions() {
    if (!state.chart) return;
    const definitions = exportSectionDefinitions(state.chart);
    $("pdf-options-grid").innerHTML = definitions.map((item) => `<label class="pdf-option${item.available ? "" : " unavailable"}"><input type="checkbox" data-pdf-section="${item.id}" ${item.available && state.pdfSections.has(item.id) ? "checked" : ""} ${item.available ? "" : "disabled"}><span>${esc(item.label)}${item.available ? "" : " - ngoài phạm vi đang xem"}</span></label>`).join("");
    $("pdf-options-grid").querySelectorAll("[data-pdf-section]").forEach((input) => input.addEventListener("change", () => {
      if (input.checked) state.pdfSections.add(input.dataset.pdfSection);
      else state.pdfSections.delete(input.dataset.pdfSection);
      state.pdfPreset = "custom";
      renderPdfOptions();
      renderPrintReport();
    }));
    document.querySelectorAll("[data-pdf-preset]").forEach((button) => button.classList.toggle("active", button.dataset.pdfPreset === state.pdfPreset));
    const count = selectedPdfCount();
    const availableCount = definitions.filter((item) => item.available).length;
    $("pdf-options-summary").textContent = count ? `Đã chọn ${count}/${availableCount} phần khả dụng cho báo cáo.` : "Hãy chọn ít nhất một phần để xuất PDF.";
    $("pdf-button").disabled = count === 0;
    $("print-button").disabled = count === 0;
  }

  function applyPdfPreset(name) {
    const ids = EXPORT_PRESETS[name];
    if (!ids) return;
    state.pdfSections = new Set(ids);
    if (name === "full" && state.comparison) state.pdfSections.add("so_sanh_gio");
    state.pdfPreset = name;
    renderPdfOptions();
    renderPrintReport();
  }
  function branchMidpoint(branch) {
    return branch === 1 ? { hour: 0, minute: 0 } : { hour: branch * 2 - 2, minute: 0 };
  }

  function chartForBirthBranch(branch) {
    if (!state.lastInput || !state.lastNormalized) throw new Error("Hãy lập lá số trước khi so sánh giờ sinh.");
    const midpoint = branchMidpoint(branch);
    const normalized = {
      ...state.lastNormalized,
      hour: midpoint.hour,
      minute: midpoint.minute,
      hourBranch: branch,
      originalTime: `Giờ ${BRANCH_LABELS[branch]} (${branchRange(branch)})`,
      adjustedTime: `Giờ ${BRANCH_LABELS[branch]} (${branchRange(branch)})`,
      timeDisplay: `Giờ ${BRANCH_LABELS[branch]} (${branchRange(branch)})`
    };
    return E.buildTuviChart({ ...state.lastInput, timePrecision: "branch" }, normalized);
  }

  function palaceValue(chart, palaceId) {
    const palace = chart.palaces.find((item) => item.id === palaceId);
    return `${palace.name} tại ${palace.branch}`;
  }

  function majorAt(chart, palaceId) {
    const palace = chart.palaces.find((item) => item.id === palaceId);
    return palace.stars.filter((star) => star.group === "major").map((star) => star.name).join(", ") || "Vô chính diệu";
  }

  function buildHourComparison(branchA, branchB) {
    if (branchA === branchB) throw new Error("Hãy chọn hai khung giờ khác nhau để so sánh.");
    const chartA = chartForBirthBranch(branchA);
    const chartB = chartForBirthBranch(branchB);
    const majorA = Object.fromEntries(chartA.palaces.flatMap((palace) => palace.stars.filter((star) => star.group === "major").map((star) => [star.id, star.palace])));
    const majorB = Object.fromEntries(chartB.palaces.flatMap((palace) => palace.stars.filter((star) => star.group === "major").map((star) => [star.id, star.palace])));
    const movedMajor = Object.keys(majorA).filter((id) => majorA[id] !== majorB[id]).length;
    const rows = [
      ["Cung Mệnh", palaceValue(chartA, chartA.lifePalace), palaceValue(chartB, chartB.lifePalace)],
      ["Cung Thân", palaceValue(chartA, chartA.bodyPalace), palaceValue(chartB, chartB.bodyPalace)],
      ["Mệnh và Cục", `${chartA.birthElement} - ${chartA.bureau.label}`, `${chartB.birthElement} - ${chartB.bureau.label}`],
      ["Chính tinh tại Mệnh", majorAt(chartA, chartA.lifePalace), majorAt(chartB, chartB.lifePalace)],
      ["Chính tinh tại Thân", majorAt(chartA, chartA.bodyPalace), majorAt(chartB, chartB.bodyPalace)],
      ["Vị trí 14 chính tinh", `${movedMajor}/14 sao đổi cung`, `${movedMajor}/14 sao đổi cung`]
    ];
    if (chartA.analysis.activeDecadeLabel) rows.splice(rows.length - 1, 0, [`Đại vận năm ${chartA.input.viewYear}`, chartA.analysis.activeDecadeLabel, chartB.analysis.activeDecadeLabel]);
    if (chartA.analysis.minorFortuneLabel) rows.splice(rows.length - 1, 0, ["Tiểu hạn", chartA.analysis.minorFortuneLabel, chartB.analysis.minorFortuneLabel]);
    if (chartA.analysis.monthlyLabel) rows.splice(rows.length - 1, 0, ["Lưu nguyệt", chartA.analysis.monthlyLabel, chartB.analysis.monthlyLabel]);
    const normalizedRows = rows.map(([label, valueA, valueB]) => ({ label, valueA, valueB, changed: valueA !== valueB || label === "Vị trí 14 chính tinh" }));
    return {
      labelA: `Giờ ${BRANCH_LABELS[branchA]} (${branchRange(branchA)})`,
      labelB: `Giờ ${BRANCH_LABELS[branchB]} (${branchRange(branchB)})`,
      branchA,
      branchB,
      changedCount: normalizedRows.filter((row) => row.changed).length,
      rows: normalizedRows
    };
  }

  function renderHourComparison() {
    const root = $("compare-hours-result");
    if (!state.comparison) {
      root.innerHTML = "<p>Chọn hai khung giờ rồi nhấn so sánh.</p>";
      return;
    }
    const comparison = state.comparison;
    root.innerHTML = `<div class="comparison-summary"><div><span>Khung giờ A</span><strong>${esc(comparison.labelA)}</strong></div><div><span>Khung giờ B</span><strong>${esc(comparison.labelB)}</strong></div><div><span>Khác biệt chính</span><strong>${comparison.changedCount} mục</strong></div></div><div class="comparison-table" role="table"><div class="comparison-row comparison-head" role="row"><span>Hạng mục</span><span>${esc(comparison.labelA)}</span><span>${esc(comparison.labelB)}</span></div>${comparison.rows.map((row) => `<div class="comparison-row ${row.changed ? "changed" : "same"}" role="row"><strong>${esc(row.label)}</strong><span>${esc(row.valueA)}</span><span>${esc(row.valueB)}</span></div>`).join("")}</div><p class="comparison-note">Bảng này dùng để nhận diện lá số thay đổi ở đâu khi giờ sinh chưa chắc chắn. Việc chọn giờ phù hợp cần đối chiếu thêm với các sự kiện đã xảy ra.</p>`;
  }

  function runHourComparison() {
    showError("");
    try {
      state.comparison = buildHourComparison(Number($("compareHourA").value), Number($("compareHourB").value));
      state.pdfSections.add("so_sanh_gio");
      state.pdfPreset = "custom";
      renderHourComparison();
      renderPdfOptions();
      renderPrintReport();
      status("Đã tạo bảng so sánh hai khung giờ sinh.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Không thể so sánh giờ sinh.");
    }
  }


  function togglePdfOptions(force) {
    const panel = $("pdf-options-panel");
    const shouldOpen = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !shouldOpen;
    $("pdf-options-button").setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function toggleHourComparison(force) {
    const panel = $("compare-hours-panel");
    const shouldOpen = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !shouldOpen;
    $("compare-hours-button").setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function interpretationParagraphs(item) {
    if (Array.isArray(item.paragraphs) && item.paragraphs.length) return item.paragraphs;
    return String(item.body || "").split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
  }

  function renderReportCard(item) {
    const paragraphs = interpretationParagraphs(item);
    return `<article class="report-card"><h3>${esc(item.title)}</h3><div class="report-copy">${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</div></article>`;
  }

  function renderReport() {
    const chart = state.chart;
    const topics = orderedTopics(chart);
    if (!topics.includes(state.topic)) state.topic = topics[0];
    const items = chart.interpretations.filter((item) => item.topic === state.topic);
    const summary = [["Phạm vi", viewScopeLabel(chart)], ...fortuneSummary(chart)];
    if (chart.analysis.nominalAge) summary.splice(1, 0, ["Tuổi mụ", `${chart.analysis.nominalAge} tuổi trong năm ${chart.input.viewYear}`]);
    $("report-root").innerHTML = `<div class="report-summary-bar">${summary.map(([label, value]) => `<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join("")}</div><div class="tabs" role="tablist" aria-label="Nhóm luận giải">${topics.map((topic) => `<button class="tab-button ${topic === state.topic ? "active" : ""}" type="button" role="tab" aria-selected="${topic === state.topic}" data-topic="${esc(topic)}">${esc(topic)}</button>`).join("")}</div><div class="report-section">${items.map(renderReportCard).join("")}</div>`;
    $("report-root").querySelectorAll("[data-topic]").forEach((button) => button.addEventListener("click", () => { state.topic = button.dataset.topic; renderReport(); }));
  }

  function renderPrintPalace(palace) {
    const major = palace.stars.filter((star) => star.group === "major").map((star) => `${star.name}${star.brightness ? ` (${star.brightness})` : ""}`).join(", ") || "Vô chính diệu";
    const other = palace.stars.filter((star) => !["major", "cycle"].includes(star.group)).slice(0, 12).map((star) => star.name).join(" · ");
    const moving = [...palace.annualStars, ...palace.monthlyStars].map((star) => star.name).join(" · ");
    return `<article class="print-palace" style="grid-column:${GRID_POSITION[palace.id][0]};grid-row:${GRID_POSITION[palace.id][1]}"><header><strong>${esc(palace.name)}${palace.isBody ? " - Thân" : ""}</strong><span>${esc(palace.branch)}</span></header><small>${esc(palace.element)} | ${palace.decadeStart}-${palace.decadeEnd} tuổi</small><b>${esc(major)}</b><p>${esc(other)}</p>${moving ? `<em>${esc(moving)}</em>` : ""}<footer>${esc(palaceFlags(palace).join(" · "))}</footer></article>`;
  }

  function renderPrintReport() {
    const chart = state.chart;
    if (!chart) return;
    const options = getPdfExportOptions();
    const life = chart.palaces.find((item) => item.id === chart.lifePalace);
    const body = chart.palaces.find((item) => item.id === chart.bodyPalace);
    const sections = [];
    const printScope = viewScopeLabel(chart);
    if (options.cover) sections.push(`<article class="print-page print-cover"><div class="print-brand">MXIAO TỬ VI</div><h1>LÁ SỐ TỬ VI VÀ LUẬN GIẢI CHI TIẾT</h1><h2>${esc(chart.input.fullName)}</h2><dl><div><dt>Dương lịch</dt><dd>${chart.normalized.solar.day}/${chart.normalized.solar.month}/${chart.normalized.solar.year}</dd></div><div><dt>Âm lịch</dt><dd>${chart.normalized.lunar.day}/${chart.normalized.lunar.month}/${chart.normalized.lunar.year}${chart.normalized.lunar.leap ? " nhuận" : ""}</dd></div><div><dt>Giờ sinh</dt><dd>${esc(chart.normalized.timeDisplay || chart.normalized.adjustedTime)}</dd></div><div><dt>Múi giờ</dt><dd>${esc(chart.input.timezone)}</dd></div><div><dt>Phương pháp</dt><dd>${esc(chart.input.calculationMethod)}</dd></div><div><dt>Phạm vi</dt><dd>${esc(printScope)}</dd></div></dl><p>Nội dung thuộc hệ thống Tử Vi truyền thống và chỉ dùng để tham khảo.</p></article>`);
    if (options.overview) {
      const overviewRows = [["Mệnh và Cục", `${chart.birthElement} - ${chart.bureau.label}`], ["Cung Mệnh", `${life.name} tại ${life.branch}`], ["Cung Thân", `${body.name} tại ${body.branch}`], ["Phương pháp", chart.input.calculationMethod], ["Phạm vi", printScope], ...fortuneSummary(chart)];
      sections.push(`<article class="print-page"><header class="print-page-header"><span>MXiao Tử Vi</span><h2>Tổng quan lá số</h2></header><div class="print-summary-grid">${overviewRows.map(([label, value]) => `<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join("")}</div>${chart.interpretations.filter((item) => item.topic === "Tổng quan").map(renderReportCard).join("")}</article>`);
    }
    if (options.chart) sections.push(`<article class="print-page print-chart-page"><header class="print-page-header"><span>${esc(printScope)}</span><h2>Lá số Tử Vi</h2></header><div class="print-chart-grid">${chart.palaces.map(renderPrintPalace).join("")}<section class="print-chart-center"><h3>${esc(chart.input.fullName)}</h3><p>Mệnh ${esc(chart.birthElement)} - ${esc(chart.bureau.label)}</p><p>${esc(printScope)}</p>${fortuneSummary(chart).map(([, value]) => `<p>${esc(value)}</p>`).join("")}</section></div></article>`);
    for (const topic of options.topics) {
      const items = chart.interpretations.filter((item) => item.topic === topic);
      if (!items.length) continue;
      const first = renderReportCard(items[0]);
      const rest = items.slice(1).map(renderReportCard).join("");
      sections.push(`<section class="print-topic"><div class="print-topic-lead"><header class="print-page-header"><span>MXiao Tử Vi</span><h2>${esc(topic)}</h2></header>${first}</div>${rest}</section>`);
    }
    if (options.comparison) {
      const comparison = options.comparison;
      sections.push(`<article class="print-page"><header class="print-page-header"><span>MXiao Tử Vi</span><h2>So sánh hai khung giờ sinh</h2></header><div class="print-comparison-summary"><div><span>Khung giờ A</span><b>${esc(comparison.labelA)}</b></div><div><span>Khung giờ B</span><b>${esc(comparison.labelB)}</b></div><div><span>Khác biệt chính</span><b>${comparison.changedCount} mục</b></div></div><div class="print-comparison-table"><div class="print-comparison-row head"><b>Hạng mục</b><b>${esc(comparison.labelA)}</b><b>${esc(comparison.labelB)}</b></div>${comparison.rows.map((row) => `<div class="print-comparison-row ${row.changed ? "changed" : "same"}"><strong>${esc(row.label)}</strong><span>${esc(row.valueA)}</span><span>${esc(row.valueB)}</span></div>`).join("")}</div><p class="print-comparison-note">Bảng đối chiếu cho biết những cấu trúc thay đổi theo giờ sinh. Cần đối chiếu thêm với sự kiện thực tế để lựa chọn giờ phù hợp.</p></article>`);
    }
    $("print-report").innerHTML = sections.join("");
    $("print-report").setAttribute("aria-hidden", sections.length ? "false" : "true");
  }

  function renderAll() {
    renderChart();
    renderReport();
    renderPdfOptions();
    renderPrintReport();
  }

  function generate() {
    showError("");
    try {
      const input = getInput();
      const normalized = normalizeInput(input);
      state.chart = E.buildTuviChart(input, normalized);
      state.lastInput = input;
      state.lastNormalized = normalized;
      state.comparison = null;
      state.pdfSections.delete("so_sanh_gio");
      state.selectedPalaceId = state.chart.lifePalace;
      state.topic = "Tổng quan";
      $("result-title").textContent = `Lá số của ${input.fullName}`;
      $("result-meta").textContent = `${normalized.solar.day}/${normalized.solar.month}/${normalized.solar.year} - ${normalized.timeDisplay} - ${input.timezone} - ${state.chart.input.calculationMethod} - ${viewScopeLabel(state.chart)}`;
      renderHourComparison();
      renderAll();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Không thể lập lá số.");
    }
  }

  async function downloadPdf() {
    if (!state.chart) return;
    const button = $("pdf-button");
    button.disabled = true;
    button.textContent = "Đang tạo báo cáo...";
    showError("");
    try {
      const options = getPdfExportOptions();
      if (!selectedPdfCount()) throw new Error("Hãy chọn ít nhất một phần để xuất PDF.");
      const pageCount = await P.downloadChartPdf(state.chart, options);
      status(`Đã tải báo cáo PDF ${pageCount} trang A4`);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Không thể tạo báo cáo PDF.");
    } finally {
      button.disabled = false;
      button.textContent = "Tải PDF trực tiếp";
    }
  }

  async function downloadTextPdf() {
    if (!state.chart) return;
    if (!selectedPdfCount()) {
      showError("Hãy chọn ít nhất một phần để xuất PDF.");
      return;
    }
    const button = $("print-button");
    button.disabled = true;
    button.textContent = "Đang tạo PDF văn bản...";
    showError("");
    try {
      const pageCount = await P.downloadSelectablePdf(state.chart, getPdfExportOptions());
      status(`Đã tải PDF văn bản ${pageCount} trang A4`);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Không thể tạo PDF văn bản.");
    } finally {
      button.disabled = false;
      button.textContent = "Tải PDF văn bản";
    }
  }

  function loadDemo() {
    $("fullName").value = "Nguyễn Minh An";
    $("solarDate").value = "1998-05-14";
    $("birthTime").value = "09:30";
    $("birthHourBranch").value = "6";
    $("viewScope").value = "natal_overview";
    $("viewYear").value = "2026";
    $("calculationProfile").value = "VN_TAN_BIEN_1956";
    $("timezoneSearch").value = "";
    state.calendarType = "solar";
    state.gender = "male";
    state.timeMode = "exact";
    setSegment(["calendar-solar", "calendar-lunar"], "calendar-solar");
    setSegment(["gender-male", "gender-female"], "gender-male");
    setSegment(["time-exact", "time-branch"], "time-exact");
    $("solar-date-field").hidden = false;
    $("lunar-date-field").hidden = true;
    $("birth-time-field").hidden = false;
    $("birth-branch-field").hidden = true;
    renderTimezoneOptions("", "Asia/Ho_Chi_Minh");
    updateViewScopeFields();
    $("viewMonth").value = "4";
    generate();
  }

  function init() {
    renderTimezoneOptions("", "Asia/Ho_Chi_Minh");
    $("timezoneSearch").addEventListener("input", () => renderTimezoneOptions($("timezoneSearch").value, $("timezone").value));
    $("timezoneSearch").addEventListener("keydown", (event) => { if (event.key === "Enter") event.preventDefault(); });
    $("timezone").addEventListener("change", () => { updateTimezoneHelp(); updateViewScopeFields(); });
    $("viewScope").addEventListener("change", updateViewScopeFields);
    $("viewYear").addEventListener("input", updateViewScopeFields);
    $("calendar-solar").addEventListener("click", () => { state.calendarType = "solar"; setSegment(["calendar-solar", "calendar-lunar"], "calendar-solar"); $("solar-date-field").hidden = false; $("lunar-date-field").hidden = true; updateTimezoneHelp(); });
    $("calendar-lunar").addEventListener("click", () => { state.calendarType = "lunar"; setSegment(["calendar-solar", "calendar-lunar"], "calendar-lunar"); $("solar-date-field").hidden = true; $("lunar-date-field").hidden = false; updateTimezoneHelp(); });
    $("time-exact").addEventListener("click", () => { state.timeMode = "exact"; setSegment(["time-exact", "time-branch"], "time-exact"); $("birth-time-field").hidden = false; $("birth-branch-field").hidden = true; updateTimezoneHelp(); });
    $("time-branch").addEventListener("click", () => { state.timeMode = "branch"; setSegment(["time-exact", "time-branch"], "time-branch"); $("birth-time-field").hidden = true; $("birth-branch-field").hidden = false; updateTimezoneHelp(); });
    $("gender-male").addEventListener("click", () => { state.gender = "male"; setSegment(["gender-male", "gender-female"], "gender-male"); });
    $("gender-female").addEventListener("click", () => { state.gender = "female"; setSegment(["gender-male", "gender-female"], "gender-female"); });
    $("birth-form").addEventListener("submit", (event) => { event.preventDefault(); generate(); });
    $("demo-button").addEventListener("click", loadDemo);
    $("compare-hours-button").addEventListener("click", () => toggleHourComparison());
    $("compare-hours-close").addEventListener("click", () => toggleHourComparison(false));
    $("run-hour-comparison").addEventListener("click", runHourComparison);
    $("pdf-options-button").addEventListener("click", () => togglePdfOptions());
    $("pdf-options-close").addEventListener("click", () => togglePdfOptions(false));
    $("pdf-select-all").addEventListener("click", () => applyPdfPreset("full"));
    document.querySelectorAll("[data-pdf-preset]").forEach((button) => button.addEventListener("click", () => applyPdfPreset(button.dataset.pdfPreset)));
    $("pdf-button").addEventListener("click", downloadPdf);
    $("print-button").addEventListener("click", downloadTextPdf);
    loadDemo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
