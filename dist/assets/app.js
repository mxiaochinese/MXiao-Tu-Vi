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
  const EXPORT_SECTION_IDS = ["cover", "overview", "chart", "menh_than", "cung_12", "dai_van", "tieu_van", "van_han", "luu_nguyet", "luu_nhat", "luu_thoi", "su_nghiep", "tai_chinh", "tinh_cam", "gia_dinh", "suc_khoe"];
  const EXPORT_PRESETS = {
    full: EXPORT_SECTION_IDS,
    summary: ["cover", "overview", "chart", "menh_than", "van_han"],
    fortune: ["cover", "overview", "chart", "dai_van", "tieu_van", "van_han", "luu_nguyet", "luu_nhat", "luu_thoi"],
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

  function resolveViewMoment(timezone, viewYear, viewMonth, viewDay, viewHourBranch, viewLeap) {
    let offset = offsetHours({ year: viewYear, month: 6, day: 15, hour: 12, minute: 0 }, timezone);
    let solar = C.lunarToSolar(viewDay, viewMonth, viewYear, viewLeap, offset);
    offset = offsetHours({ ...solar, hour: 12, minute: 0 }, timezone);
    solar = C.lunarToSolar(viewDay, viewMonth, viewYear, viewLeap, offset);
    const roundtrip = C.solarToLunar(solar.day, solar.month, solar.year, offset);
    if (roundtrip.year !== viewYear || roundtrip.month !== viewMonth || roundtrip.day !== viewDay || roundtrip.leap !== viewLeap) throw new Error("Ngày âm lịch muốn xem hoặc lựa chọn tháng nhuận không tồn tại.");
    const day = E.getDayStemBranch(solar.day, solar.month, solar.year);
    return {
      viewSolarDate: solar,
      viewDayStem: day.stem,
      viewDayBranch: day.branch,
      viewDayCanChi: day.label,
      viewHourBranch
    };
  }

  function getInput() {
    const viewYear = Number($("viewYear").value);
    const viewMonth = Number($("viewMonth").value);
    const viewDay = Number($("viewDay").value);
    const viewHourBranch = Number($("viewHourBranch").value);
    const viewLeap = $("viewLeap").checked;
    const leapFortuneMode = $("leapFortuneMode").value;
    if (!Number.isInteger(viewYear) || viewYear < 1900 || viewYear > 2199) throw new Error("Năm muốn xem phải nằm trong khoảng 1900 đến 2199.");
    if (!Number.isInteger(viewMonth) || viewMonth < 1 || viewMonth > 12) throw new Error("Tháng muốn xem phải từ 1 đến 12.");
    if (!Number.isInteger(viewDay) || viewDay < 1 || viewDay > 30) throw new Error("Ngày âm lịch muốn xem phải từ 1 đến 30.");
    if (!Number.isInteger(viewHourBranch) || viewHourBranch < 1 || viewHourBranch > 12) throw new Error("Khung giờ muốn xem không hợp lệ.");
    const timezone = selectedTimezone();
    const viewMoment = resolveViewMoment(timezone, viewYear, viewMonth, viewDay, viewHourBranch, viewLeap);
    return {
      fullName: $("fullName").value.trim() || "Người xem",
      gender: state.gender,
      calendarType: state.calendarType,
      lunarLeap: $("lunarLeap").checked,
      timezone,
      viewYear,
      viewMonth,
      viewLeap,
      leapFortuneMode,
      viewDay,
      viewHourBranch,
      ...viewMoment,
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
    if (palace.id === chart.analysis.dailyPalaceId) flags.push(`Lưu nhật N${chart.input.viewDay}`);
    if (palace.id === chart.analysis.hourlyPalaceId) flags.push(`Lưu thời ${BRANCH_LABELS[chart.input.viewHourBranch]}`);
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
      palace.id === chart.analysis.monthlyPalaceId ? "monthly-fortune" : "",
      palace.id === chart.analysis.dailyPalaceId ? "daily-fortune" : "",
      palace.id === chart.analysis.hourlyPalaceId ? "hourly-fortune" : ""
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
      ${palace.dailyStars.length ? `<div class="daily-stars">${palace.dailyStars.map((star) => `<span>${esc(star.name)}</span>`).join("")}</div>` : ""}
      ${palace.hourlyStars.length ? `<div class="hourly-stars">${palace.hourlyStars.map((star) => `<span>${esc(star.name)}</span>`).join("")}</div>` : ""}
      <div class="palace-foot"><span>${flags.map((flag) => esc(flag)).join(" · ")}</span><span class="tuan-triet">${[palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""].filter(Boolean).join(" · ")}</span></div>
    </article>`;
  }

  function renderChart() {
    const chart = state.chart;
    const center = `<section class="chart-center"><span class="center-kicker">${esc(chart.normalized.yearCanChi)} - ${chart.input.gender === "male" ? "Nam" : "Nữ"}</span><h3>${esc(chart.input.fullName)}</h3><p>Mệnh ${esc(chart.birthElement)} - ${esc(chart.bureau.label)}</p><div class="center-fortunes"><span><b>Đại vận</b>${esc(chart.analysis.activeDecadeLabel)}</span><span><b>Lưu đại hạn ${chart.input.viewYear}</b>${esc(chart.analysis.annualDecadeLabel)}</span><span><b>Tiểu hạn ${chart.input.viewYear}</b>${esc(chart.analysis.minorFortuneLabel)}</span><span><b>Lưu nguyệt tháng ${chart.input.viewMonth}</b>${esc(chart.analysis.monthlyLabel)}</span><span><b>Lưu nhật ngày ${chart.input.viewDay}</b>${esc(chart.analysis.dailyLabel)}</span><span><b>Lưu thời ${esc(BRANCH_LABELS[chart.input.viewHourBranch])}</b>${esc(chart.analysis.hourlyLabel)}</span></div></section>`;
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
    $("palace-detail-root").innerHTML = `<section class="palace-detail"><div class="palace-detail-head"><div><span class="detail-kicker">Cung đang chọn</span><h3>${esc(palace.name)} tại ${esc(palace.branch)}${palace.isBody ? " - Thân cư" : ""}</h3><p>${esc(palace.element)} - Đại vận ${palace.decadeStart}-${palace.decadeEnd} tuổi</p></div><div class="detail-flags">${flags.map((flag) => `<span>${esc(flag)}</span>`).join("")}${palace.hasTuan ? "<span>Tuần</span>" : ""}${palace.hasTriet ? "<span>Triệt</span>" : ""}</div></div><div class="star-groups">${groups.map(({ group, stars }) => `<div class="star-group group-${group}"><h4>${GROUP_LABELS[group]}</h4><div class="star-list">${stars.map((star) => `<span class="star-chip">${esc(star.name)}${star.brightness ? `<b>${esc(star.brightness)}</b>` : ""}</span>`).join("")}</div></div>`).join("")}${palace.annualStars.length ? `<div class="star-group group-annual"><h4>Sao lưu năm ${state.chart.input.viewYear}</h4><div class="star-list">${palace.annualStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}${palace.monthlyStars.length ? `<div class="star-group group-monthly"><h4>Sao lưu tháng ${state.chart.input.viewMonth}</h4><div class="star-list">${palace.monthlyStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}${palace.dailyStars.length ? `<div class="star-group group-daily"><h4>Sao lưu ngày ${state.chart.input.viewDay}</h4><div class="star-list">${palace.dailyStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}${palace.hourlyStars.length ? `<div class="star-group group-hourly"><h4>Sao lưu giờ ${esc(BRANCH_LABELS[state.chart.input.viewHourBranch])}</h4><div class="star-list">${palace.hourlyStars.map((star) => `<span class="star-chip">${esc(star.name)}</span>`).join("")}</div></div>` : ""}</div></section>`;
  }

  function orderedTopics(chart) {
    const desired = ["Tổng quan", "Mệnh - Thân", "12 cung", "Đại vận", "Tiểu vận", `Vận hạn ${chart.input.viewYear}`, `Lưu nguyệt tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}`, `Lưu nhật ngày ${chart.input.viewDay}`, `Lưu thời giờ ${chart.input.viewHourBranch}`, "Sự nghiệp", "Tài chính", "Tình cảm", "Gia đình - Quan hệ", "Sức khỏe - Nhịp sống"];
    const existing = new Set(chart.interpretations.map((item) => item.topic));
    return desired.filter((topic) => existing.has(topic));
  }

  function exportSectionDefinitions(chart) {
    return [
      { id: "cover", label: "Trang bìa" },
      { id: "overview", label: "Tổng quan lá số" },
      { id: "chart", label: "Lá số 12 cung" },
      { id: "menh_than", label: "Mệnh - Thân", topic: "Mệnh - Thân" },
      { id: "cung_12", label: "Luận giải 12 cung", topic: "12 cung" },
      { id: "dai_van", label: "Đại vận", topic: "Đại vận" },
      { id: "tieu_van", label: "Tiểu vận", topic: "Tiểu vận" },
      { id: "van_han", label: `Vận hạn ${chart.input.viewYear}`, topic: `Vận hạn ${chart.input.viewYear}` },
      { id: "luu_nguyet", label: `Lưu nguyệt tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}`, topic: `Lưu nguyệt tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}` },
      { id: "luu_nhat", label: `Lưu nhật ngày ${chart.input.viewDay}`, topic: `Lưu nhật ngày ${chart.input.viewDay}` },
      { id: "luu_thoi", label: `Lưu thời giờ ${BRANCH_LABELS[chart.input.viewHourBranch]}`, topic: `Lưu thời giờ ${chart.input.viewHourBranch}` },
      { id: "su_nghiep", label: "Sự nghiệp", topic: "Sự nghiệp" },
      { id: "tai_chinh", label: "Tài chính", topic: "Tài chính" },
      { id: "tinh_cam", label: "Tình cảm", topic: "Tình cảm" },
      { id: "gia_dinh", label: "Gia đình - Quan hệ", topic: "Gia đình - Quan hệ" },
      { id: "suc_khoe", label: "Sức khỏe - Nhịp sống", topic: "Sức khỏe - Nhịp sống" }
    ].concat(state.comparison ? [{ id: "so_sanh_gio", label: "So sánh hai khung giờ sinh" }] : []);
  }

  function getPdfExportOptions() {
    if (!state.chart) return { cover: false, overview: false, chart: false, topics: [] };
    const definitions = exportSectionDefinitions(state.chart);
    return {
      cover: state.pdfSections.has("cover"),
      overview: state.pdfSections.has("overview"),
      chart: state.pdfSections.has("chart"),
      topics: definitions.filter((item) => item.topic && state.pdfSections.has(item.id)).map((item) => item.topic),
      comparison: state.comparison && state.pdfSections.has("so_sanh_gio") ? state.comparison : null
    };
  }

  function selectedPdfCount() {
    if (!state.chart) return 0;
    return exportSectionDefinitions(state.chart).filter((item) => state.pdfSections.has(item.id)).length;
  }

  function renderPdfOptions() {
    if (!state.chart) return;
    const definitions = exportSectionDefinitions(state.chart);
    $("pdf-options-grid").innerHTML = definitions.map((item) => `<label class="pdf-option"><input type="checkbox" data-pdf-section="${item.id}" ${state.pdfSections.has(item.id) ? "checked" : ""}><span>${esc(item.label)}</span></label>`).join("");
    $("pdf-options-grid").querySelectorAll("[data-pdf-section]").forEach((input) => input.addEventListener("change", () => {
      if (input.checked) state.pdfSections.add(input.dataset.pdfSection);
      else state.pdfSections.delete(input.dataset.pdfSection);
      state.pdfPreset = "custom";
      renderPdfOptions();
      renderPrintReport();
    }));
    document.querySelectorAll("[data-pdf-preset]").forEach((button) => button.classList.toggle("active", button.dataset.pdfPreset === state.pdfPreset));
    const count = selectedPdfCount();
    $("pdf-options-summary").textContent = count ? `Đã chọn ${count}/${definitions.length} phần cho báo cáo.` : "Hãy chọn ít nhất một phần để xuất PDF.";
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
      [`Đại vận năm ${chartA.input.viewYear}`, chartA.analysis.activeDecadeLabel, chartB.analysis.activeDecadeLabel],
      ["Tiểu hạn", chartA.analysis.minorFortuneLabel, chartB.analysis.minorFortuneLabel],
      ["Lưu nguyệt", chartA.analysis.monthlyLabel, chartB.analysis.monthlyLabel],
      ["Lưu nhật", chartA.analysis.dailyLabel, chartB.analysis.dailyLabel],
      ["Lưu thời", chartA.analysis.hourlyLabel, chartB.analysis.hourlyLabel],
      ["Vị trí 14 chính tinh", `${movedMajor}/14 sao đổi cung`, `${movedMajor}/14 sao đổi cung`]
    ].map(([label, valueA, valueB]) => ({ label, valueA, valueB, changed: valueA !== valueB || label === "Vị trí 14 chính tinh" }));
    return {
      labelA: `Giờ ${BRANCH_LABELS[branchA]} (${branchRange(branchA)})`,
      labelB: `Giờ ${BRANCH_LABELS[branchB]} (${branchRange(branchB)})`,
      branchA,
      branchB,
      changedCount: rows.filter((row) => row.changed).length,
      rows
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
    $("report-root").innerHTML = `<div class="report-summary-bar"><div><strong>${chart.analysis.nominalAge}</strong><span>tuổi mụ năm ${chart.input.viewYear}</span></div><div><strong>${esc(chart.analysis.activeDecadeLabel)}</strong><span>đại vận</span></div><div><strong>${esc(chart.analysis.annualDecadeLabel)}</strong><span>lưu đại hạn</span></div><div><strong>${esc(chart.analysis.minorFortuneLabel)}</strong><span>tiểu hạn</span></div><div><strong>${esc(chart.analysis.monthlyLabel)}</strong><span>lưu nguyệt</span></div><div><strong>${esc(chart.analysis.dailyLabel)}</strong><span>lưu nhật</span></div><div><strong>${esc(chart.analysis.hourlyLabel)}</strong><span>lưu thời</span></div></div><div class="tabs" role="tablist" aria-label="Nhóm luận giải">${topics.map((topic) => `<button class="tab-button ${topic === state.topic ? "active" : ""}" type="button" role="tab" aria-selected="${topic === state.topic}" data-topic="${esc(topic)}">${esc(topic)}</button>`).join("")}</div><div class="report-section">${items.map(renderReportCard).join("")}</div>`;
    $("report-root").querySelectorAll("[data-topic]").forEach((button) => button.addEventListener("click", () => { state.topic = button.dataset.topic; renderReport(); }));
  }

  function renderPrintPalace(palace) {
    const major = palace.stars.filter((star) => star.group === "major").map((star) => `${star.name}${star.brightness ? ` (${star.brightness})` : ""}`).join(", ") || "Vô chính diệu";
    const other = palace.stars.filter((star) => !["major", "cycle"].includes(star.group)).slice(0, 12).map((star) => star.name).join(" · ");
    const moving = [...palace.annualStars, ...palace.monthlyStars, ...palace.dailyStars, ...palace.hourlyStars].map((star) => star.name).join(" · ");
    return `<article class="print-palace" style="grid-column:${GRID_POSITION[palace.id][0]};grid-row:${GRID_POSITION[palace.id][1]}"><header><strong>${esc(palace.name)}${palace.isBody ? " - Thân" : ""}</strong><span>${esc(palace.branch)}</span></header><small>${esc(palace.element)} | ${palace.decadeStart}-${palace.decadeEnd} tuổi</small><b>${esc(major)}</b><p>${esc(other)}</p>${moving ? `<em>${esc(moving)}</em>` : ""}<footer>${esc(palaceFlags(palace).join(" · "))}</footer></article>`;
  }

  function renderPrintReport() {
    const chart = state.chart;
    if (!chart) return;
    const options = getPdfExportOptions();
    const life = chart.palaces.find((item) => item.id === chart.lifePalace);
    const body = chart.palaces.find((item) => item.id === chart.bodyPalace);
    const sections = [];
    if (options.cover) sections.push(`<article class="print-page print-cover"><div class="print-brand">MXIAO TỬ VI</div><h1>LÁ SỐ TỬ VI VÀ LUẬN GIẢI CHI TIẾT</h1><h2>${esc(chart.input.fullName)}</h2><dl><div><dt>Dương lịch</dt><dd>${chart.normalized.solar.day}/${chart.normalized.solar.month}/${chart.normalized.solar.year}</dd></div><div><dt>Âm lịch</dt><dd>${chart.normalized.lunar.day}/${chart.normalized.lunar.month}/${chart.normalized.lunar.year}${chart.normalized.lunar.leap ? " nhuận" : ""}</dd></div><div><dt>Giờ sinh</dt><dd>${esc(chart.normalized.timeDisplay || chart.normalized.adjustedTime)}</dd></div><div><dt>Múi giờ</dt><dd>${esc(chart.input.timezone)}</dd></div><div><dt>Phương pháp</dt><dd>${esc(chart.input.calculationMethod)}</dd></div><div><dt>Thời điểm xem</dt><dd>Năm ${chart.input.viewYear}, tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}, ngày ${chart.input.viewDay} âm lịch, giờ ${esc(BRANCH_LABELS[chart.input.viewHourBranch])}</dd></div></dl><p>Nội dung thuộc hệ thống Tử Vi truyền thống và chỉ dùng để tham khảo.</p></article>`);
    if (options.overview) sections.push(`<article class="print-page"><header class="print-page-header"><span>MXiao Tử Vi</span><h2>Tổng quan lá số</h2></header><div class="print-summary-grid"><div><span>Mệnh và Cục</span><b>${esc(chart.birthElement)} - ${esc(chart.bureau.label)}</b></div><div><span>Cung Mệnh</span><b>${esc(life.name)} tại ${esc(life.branch)}</b></div><div><span>Cung Thân</span><b>${esc(body.name)} tại ${esc(body.branch)}</b></div><div><span>Tuổi mụ</span><b>${chart.analysis.nominalAge}</b></div><div><span>Phương pháp</span><b>${esc(chart.input.calculationMethod)}</b></div><div><span>Đại vận</span><b>${esc(chart.analysis.activeDecadeLabel)}</b></div><div><span>Lưu đại hạn</span><b>${esc(chart.analysis.annualDecadeLabel)}</b></div><div><span>Tiểu hạn</span><b>${esc(chart.analysis.minorFortuneLabel)}</b></div><div><span>Lưu nguyệt</span><b>${esc(chart.analysis.monthlyLabel)}</b></div><div><span>Lưu nhật</span><b>${esc(chart.analysis.dailyLabel)}</b></div><div><span>Lưu thời</span><b>${esc(chart.analysis.hourlyLabel)}</b></div></div>${chart.interpretations.filter((item) => item.topic === "Tổng quan").map(renderReportCard).join("")}</article>`);
    if (options.chart) sections.push(`<article class="print-page print-chart-page"><header class="print-page-header"><span>Năm ${chart.input.viewYear}, tháng ${chart.input.viewMonth}${chart.input.viewLeap ? " nhuận" : ""}, ngày ${chart.input.viewDay} âm lịch, giờ ${esc(BRANCH_LABELS[chart.input.viewHourBranch])}</span><h2>Lá số Tử Vi</h2></header><div class="print-chart-grid">${chart.palaces.map(renderPrintPalace).join("")}<section class="print-chart-center"><h3>${esc(chart.input.fullName)}</h3><p>Mệnh ${esc(chart.birthElement)} - ${esc(chart.bureau.label)}</p><p>${esc(chart.analysis.activeDecadeLabel)}</p><p>${esc(chart.analysis.minorFortuneLabel)}</p><p>${esc(chart.analysis.monthlyLabel)}</p><p>${esc(chart.analysis.dailyLabel)}</p><p>${esc(chart.analysis.hourlyLabel)}</p></section></div></article>`);
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
      $("result-meta").textContent = `${normalized.solar.day}/${normalized.solar.month}/${normalized.solar.year} - ${normalized.timeDisplay} - ${input.timezone} - ${state.chart.input.calculationMethod} - Xem năm ${input.viewYear}, tháng ${input.viewMonth}${input.viewLeap ? " nhuận" : ""}, ngày ${input.viewDay} âm lịch, giờ ${BRANCH_LABELS[input.viewHourBranch]}`;
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
    $("viewYear").value = "2026";
    $("viewMonth").value = "4";
    $("viewLeap").checked = false;
    $("leapFortuneMode").value = "split-half-next";
    $("viewDay").value = "15";
    $("viewHourBranch").value = "7";
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
    generate();
  }

  function init() {
    renderTimezoneOptions("", "Asia/Ho_Chi_Minh");
    $("timezoneSearch").addEventListener("input", () => renderTimezoneOptions($("timezoneSearch").value, $("timezone").value));
    $("timezoneSearch").addEventListener("keydown", (event) => { if (event.key === "Enter") event.preventDefault(); });
    $("timezone").addEventListener("change", updateTimezoneHelp);
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
