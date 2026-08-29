(function () {
  "use strict";

  const E = window.MXiaoAstrologyEngine;
  const P = window.MXiaoPdf;
  const S = window.MXiaoWholePerson;
  const LOCATIONS = Array.isArray(window.MXiaoAstrologyLocations) ? window.MXiaoAstrologyLocations : [];
  if (!E || !P) throw new Error("Bản đồ sao tạm thời không khả dụng.");

  const state = { activeTool: "tu-vi", timeAccuracy: "exact", chart: null, location: null };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const pad = (value) => String(value).padStart(2, "0");

  function selectTool(tool, updateUrl = true) {
    state.activeTool = ["tu-vi", "ban-do-sao", "than-so-hoc"].includes(tool) ? tool : "tu-vi";
    $("tuvi-tool").hidden = state.activeTool !== "tu-vi";
    $("astrology-tool").hidden = state.activeTool !== "ban-do-sao";
    $("numerology-tool").hidden = state.activeTool !== "than-so-hoc";
    $("tool-tuvi").classList.toggle("active", state.activeTool === "tu-vi");
    $("tool-astrology").classList.toggle("active", state.activeTool === "ban-do-sao");
    $("tool-numerology").classList.toggle("active", state.activeTool === "than-so-hoc");
    $("tool-tuvi").setAttribute("aria-selected", String(state.activeTool === "tu-vi"));
    $("tool-astrology").setAttribute("aria-selected", String(state.activeTool === "ban-do-sao"));
    $("tool-numerology").setAttribute("aria-selected", String(state.activeTool === "than-so-hoc"));
    document.title = state.activeTool === "ban-do-sao" ? "Bản đồ sao cá nhân | MXiao Huyền Học" : state.activeTool === "than-so-hoc" ? "Thần số học | MXiao Huyền Học" : "Tử Vi | MXiao Huyền Học";
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("tool", state.activeTool);
      history.replaceState(null, "", url);
    }
    window.dispatchEvent(new CustomEvent("mxiao:toolchange", { detail: { tool: state.activeTool } }));
  }

  function setTimeAccuracy(mode) {
    state.timeAccuracy = mode;
    ["exact", "range", "unknown"].forEach((item) => {
      $("astro-time-" + item).classList.toggle("active", item === mode);
      $("astro-time-" + item).setAttribute("aria-pressed", String(item === mode));
    });
    $("astro-exact-field").hidden = mode !== "exact";
    $("astro-range-field").hidden = mode !== "range";
    $("astro-time-note").textContent = mode === "unknown"
      ? "Không hiển thị Cung Mọc, Thiên Đỉnh và 12 Nhà khi không biết giờ sinh."
      : mode === "range"
        ? "Chỉ hiển thị những vị trí ổn định trong khoảng giờ đã nhập."
        : "Sử dụng giờ và phút đã nhập.";
  }

  function renderLocationOptions(query = "") {
    const needle = normalize(query);
    const matches = LOCATIONS.filter((item) => !needle || normalize(item.label).includes(needle)).slice(0, 12);
    const select = $("astro-location-results");
    select.innerHTML = matches.map((item) => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join("");
    select.hidden = !matches.length;
    if (!matches.length) state.location = null;
    return matches;
  }

  function selectLocation(id) {
    const location = LOCATIONS.find((item) => item.id === id);
    if (!location) return;
    state.location = location;
    $("astro-location-search").value = location.label;
    $("astro-location-results").value = location.id;
    $("astro-location-results").hidden = true;
    $("astro-location-summary").textContent = `${location.label} - ${location.timezone}`;
  }

  function getInput() {
    if (!state.location) throw new Error("Hãy chọn nơi sinh từ danh sách kết quả.");
    return {
      fullName: $("astro-name").value.trim() || "Người xem",
      birthDate: $("astro-date").value,
      birthTime: $("astro-time").value,
      timeAccuracy: state.timeAccuracy,
      timeFrom: $("astro-time-from").value,
      timeTo: $("astro-time-to").value,
      location: state.location,
      houseSystem: $("astro-house-system").value
    };
  }

  function showError(message) {
    $("astro-form-error").textContent = message || "";
    $("astro-form-error").hidden = !message;
  }

  function degreeLabel(item) {
    return `${E.formatDegree(item.degree)} ${item.sign.name}${item.retrograde ? " ℞" : ""}`;
  }

  function polar(cx, cy, radius, degree) {
    const angle = (degree - 90) * Math.PI / 180;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  }

  function arcPath(cx, cy, radius, start, end) {
    const a = polar(cx, cy, radius, start);
    const b = polar(cx, cy, radius, end);
    return `M ${a[0]} ${a[1]} A ${radius} ${radius} 0 0 1 ${b[0]} ${b[1]}`;
  }

  function wheelSvg(chart) {
    const size = 720;
    const center = size / 2;
    const outer = 320;
    const zodiacInner = 255;
    const houseInner = 185;
    const orientation = chart.angles ? chart.angles.asc : 0;
    const rotate = (longitude) => E.mod(180 - orientation + longitude);
    const signColors = ["#d85151", "#9a7041", "#4c86a8", "#427c69"];
    const signRings = E.SIGNS.map((sign) => {
      const start = rotate(sign.index * 30);
      const end = rotate(sign.index * 30 + 30);
      const label = polar(center, center, 288, start + 15);
      return `<path d="${arcPath(center, center, outer, start, end)}" fill="none" stroke="${signColors[sign.index % 4]}" stroke-width="18" opacity=".9"/><text x="${label[0]}" y="${label[1]}" text-anchor="middle" dominant-baseline="middle">${esc(sign.name)}</text>`;
    }).join("");
    const zodiacLines = Array.from({ length: 12 }, (_, index) => {
      const outerPoint = polar(center, center, outer - 10, rotate(index * 30));
      const innerPoint = polar(center, center, zodiacInner, rotate(index * 30));
      return `<line x1="${outerPoint[0]}" y1="${outerPoint[1]}" x2="${innerPoint[0]}" y2="${innerPoint[1]}"/>`;
    }).join("");
    const houseLines = chart.houseCusps.map((cusp, index) => {
      const outside = polar(center, center, zodiacInner, rotate(cusp));
      const inside = polar(center, center, houseInner, rotate(cusp));
      const next = chart.houseCusps[(index + 1) % 12];
      const span = E.mod(next - cusp);
      const label = polar(center, center, 215, rotate(cusp + span / 2));
      return `<line class="house-line" x1="${outside[0]}" y1="${outside[1]}" x2="${inside[0]}" y2="${inside[1]}"/><text class="house-number" x="${label[0]}" y="${label[1]}" text-anchor="middle" dominant-baseline="middle">${index + 1}</text>`;
    }).join("");
    const aspectLines = chart.aspects.filter((item) => item.orb <= 4).map((aspect) => {
      const a = chart.planets.find((item) => item.id === aspect.a);
      const b = chart.planets.find((item) => item.id === aspect.b);
      if (!a || !b) return "";
      const pa = polar(center, center, 168, rotate(a.longitude));
      const pb = polar(center, center, 168, rotate(b.longitude));
      const cls = aspect.id === "square" || aspect.id === "opposition" ? "tense" : "flow";
      return `<line class="aspect-line ${cls}" x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}"/>`;
    }).join("");
    const sortedPlanets = [...chart.planets].filter((item) => item.id !== "south_node" && item.stability !== "unstable").sort((a, b) => a.longitude - b.longitude);
    const labels = sortedPlanets.map((planet, index) => {
      let lane = 0;
      if (index && E.angularDistance(planet.longitude, sortedPlanets[index - 1].longitude) < 7) lane = index % 3;
      const point = polar(center, center, 170 - lane * 25, rotate(planet.longitude));
      return `<g class="planet-node" tabindex="0" data-planet="${esc(planet.id)}"><circle cx="${point[0]}" cy="${point[1]}" r="15"/><text x="${point[0]}" y="${point[1] + 1}" text-anchor="middle" dominant-baseline="middle">${esc(planet.symbol)}</text><title>${esc(planet.name)}: ${esc(degreeLabel(planet))}</title></g>`;
    }).join("");
    const angleMarkers = chart.angles ? [["ASC", chart.angles.asc], ["MC", chart.angles.mc], ["DSC", chart.angles.dsc], ["IC", chart.angles.ic]].map(([label, longitude]) => {
      const point = polar(center, center, zodiacInner - 5, rotate(longitude));
      return `<text class="angle-label" x="${point[0]}" y="${point[1]}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
    }).join("") : "";
    const innerNote = chart.angles ? "Tropical · " + chart.settings.houseSystem.replace("whole_sign", "Whole Sign").replace("equal", "Equal House").replace("placidus", "Placidus") : "Không dùng giờ sinh · Không có ASC/MC/Nhà";
    return `<svg class="natal-wheel" viewBox="0 0 ${size} ${size}" role="img" aria-label="Vòng Bản đồ sao của ${esc(chart.profile.name)}"><circle cx="${center}" cy="${center}" r="${outer}" class="wheel-bg"/><circle cx="${center}" cy="${center}" r="${zodiacInner}"/><circle cx="${center}" cy="${center}" r="${houseInner}"/>${signRings}<g class="zodiac-lines">${zodiacLines}</g><g>${houseLines}</g><g>${aspectLines}</g>${labels}${angleMarkers}<text class="wheel-name" x="${center}" y="${center - 8}" text-anchor="middle">${esc(chart.profile.name)}</text><text class="wheel-note" x="${center}" y="${center + 18}" text-anchor="middle">${esc(innerNote)}</text></svg>`;
  }

  function quickCards(chart) {
    const sun = chart.planets.find((item) => item.id === "sun");
    const moon = chart.planets.find((item) => item.id === "moon");
    const items = [
      ["Mặt Trời", sun ? degreeLabel(sun) : "Chưa xác định"],
      ["Mặt Trăng", moon ? (moon.stability === "stable" || !moon.stability ? degreeLabel(moon) : `Có thể ở ${moon.possibleSigns.join(" hoặc ")}`) : "Chưa xác định"]
    ];
    if (chart.angles) {
      items.push(["Cung Mọc", `${E.formatDegree(E.signPosition(chart.angles.asc).degree)} ${E.signPosition(chart.angles.asc).sign.name}`]);
      items.push(["Thiên Đỉnh", `${E.formatDegree(E.signPosition(chart.angles.mc).degree)} ${E.signPosition(chart.angles.mc).sign.name}`]);
    }
    return items.map(([label, value]) => `<div class="astro-quick-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
  }

  function overviewParagraphs(chart) {
    const sun = chart.planets.find((item) => item.id === "sun");
    const moon = chart.planets.find((item) => item.id === "moon");
    const asc = chart.angles ? E.signPosition(chart.angles.asc) : null;
    const paragraphs = [];
    if (sun && moon) {
      const relation = chart.aspects.find((item) => [item.a, item.b].includes("sun") && [item.a, item.b].includes("moon"));
      paragraphs.push(`Mặt Trời ở ${sun.sign.name} đặt trọng tâm bản sắc vào cách biểu hiện mang tính ${sun.sign.modality.toLowerCase()} và thiên về nguyên tố ${sun.sign.element}. Mặt Trăng ở ${moon.sign.name}${moon.stability && moon.stability !== "stable" ? " chưa ổn định trong khoảng giờ được xét" : ""} cho thấy lớp phản ứng cảm xúc vận hành theo một nhịp khác. ${relation ? `Hai chức năng này tạo góc ${relation.name.toLowerCase()} với độ lệch ${relation.orb.toFixed(2)}°, làm nổi bật mối liên hệ giữa ý thức bản thân và nhu cầu cảm xúc.` : "Mặt Trời và Mặt Trăng không tạo góc hợp chính đủ gần; ý thức bản thân và phản ứng cảm xúc vì thế thể hiện qua những mối liên hệ khác trong lá số."}`);
    }
    if (asc) {
      const ruler = chart.planets.find((item) => item.id === asc.sign.ruler);
      paragraphs.push(`Cung Mọc ở ${asc.sign.name} đặt ${ruler?.name || asc.sign.ruler} làm chủ tinh lá số theo hệ chủ tinh truyền thống. ${ruler ? `${ruler.name} nằm ở ${ruler.sign.name}, Nhà ${ruler.house}; vị trí này kết nối cách bạn bước vào trải nghiệm với lĩnh vực được nhấn mạnh trong lá số.` : ""}`);
    } else {
      paragraphs.push("Do giờ sinh chưa đủ chắc chắn, kết quả không tạo Cung Mọc, Thiên Đỉnh hoặc 12 Nhà. Chỉ những vị trí hành tinh ổn định xuyên suốt khoảng khảo sát mới được dùng trong phần đọc chính.");
    }
    if (chart.patterns.length) paragraphs.push(`Các hành tinh tạo thành cấu trúc nổi bật: ${chart.patterns.map((item) => item.name).join(", ")}.`);
    const tight = chart.aspects.slice(0, 3);
    if (tight.length) paragraphs.push(`Các liên hệ gần nhất gồm ${tight.map((item) => `${item.aName} ${item.name.toLowerCase()} ${item.bName} (${item.orb.toFixed(2)}°)`).join("; ")}. Những mối liên hệ này cho thấy các chủ đề nổi bật, nhưng không khẳng định chắc chắn một sự kiện.`);
    return paragraphs;
  }

  function narrativeHtml(chart) {
    if (!chart.narrative?.sections?.length) return overviewParagraphs(chart).map((text) => `<p>${esc(text)}</p>`).join("");
    const sections = [...chart.narrative.sections];
    if (chart.wholePersonProfile && S) {
      const content = S.overviewContent(chart.wholePersonProfile);
      const paragraphs = [content.portrait, content.identity, ...content.strengths.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`), ...content.tensions.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`)];
      const summaryIndex = sections.findIndex((section) => section.id === "summary");
      const summary = { id: "summary", title: "Chân dung tổng hợp", paragraphs: paragraphs.filter(Boolean).map((text) => ({ text })) };
      if (summaryIndex >= 0) sections[summaryIndex] = summary; else sections.unshift(summary);
    }
    return sections.map((section) => `<section class="astro-narrative-section"><h3>${esc(section.title)}</h3>${section.paragraphs.map((item) => `<p>${esc(item.text)}</p>`).join("")}</section>`).join("");
  }

  async function synthesizeOverview(chart) {
    if (!S || !chart) return;
    const input = S.astrologyInput(chart);
    if (!input.evidence.length) return;
    const profile = await S.requestWholePerson(input);
    if (state.chart !== chart || !profile) return;
    chart.wholePersonProfile = profile;
    const content = S.overviewContent(profile);
    const paragraphs = [content.portrait, content.identity, ...content.strengths.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`), ...content.tensions.map((item) => `${item.title}. ${item.paragraphs.join(" ")}`)].filter(Boolean);
    const summaryIndex = chart.narrative.sections.findIndex((section) => section.id === "summary");
    const summary = { id: "summary", title: "Chân dung tổng hợp", paragraphs: paragraphs.map((text) => ({ text })) };
    if (summaryIndex >= 0) chart.narrative.sections[summaryIndex] = summary; else chart.narrative.sections.unshift(summary);
    $("astro-overview").innerHTML = narrativeHtml(chart);
  }

  function planetTable(chart) {
    return `<div class="astro-table-wrap"><table><thead><tr><th>Thiên thể</th><th>Cung</th><th>Độ</th>${chart.angles ? "<th>Nhà</th>" : ""}<th>Trạng thái</th></tr></thead><tbody>${chart.planets.map((item) => `<tr><th>${esc(item.symbol)} ${esc(item.name)}</th><td>${esc(item.sign.name)}</td><td>${esc(E.formatDegree(item.degree))}</td>${chart.angles ? `<td>${item.house || "Không áp dụng"}</td>` : ""}<td>${item.stability && item.stability !== "stable" ? `Chưa ổn định: ${esc(item.possibleSigns.join(" / "))}` : item.retrograde ? "Nghịch hành" : "Thuận hành"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function aspectTable(chart) {
    return `<div class="astro-table-wrap"><table><thead><tr><th>A</th><th>Góc hợp</th><th>B</th><th>Độ lệch</th><th>Trạng thái</th></tr></thead><tbody>${chart.aspects.map((item) => `<tr><td>${esc(item.aName)}</td><td>${esc(item.name)}</td><td>${esc(item.bName)}</td><td>${item.orb.toFixed(2)}°</td><td>${item.state === "applying" ? "Đang tiến tới" : item.state === "separating" ? "Đang tách ra" : "Không áp dụng"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function houseTable(chart) {
    if (!chart.houses.length) return "";
    return `<div class="astro-table-wrap"><table><thead><tr><th>Nhà</th><th>Điểm đầu Nhà</th><th>Chủ tinh</th><th>Chủ tinh ở Nhà</th><th>Hành tinh trong Nhà</th></tr></thead><tbody>${chart.houses.map((house) => `<tr><th>${house.number}</th><td>${esc(E.formatDegree(E.signPosition(house.cusp).degree))} ${esc(house.sign.name)}</td><td>${esc(house.rulerName)}</td><td>${house.rulerHouse || "Không áp dụng"}</td><td>${house.planets.map((id) => chart.planets.find((item) => item.id === id)?.name).filter(Boolean).map(esc).join(", ") || "Không có hành tinh"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderChart(chart) {
    const limited = chart.status !== "exact";
    $("astro-result").hidden = false;
    $("astro-result-title").textContent = chart.profile.name;
    $("astro-result-meta").textContent = `${chart.profile.birthDate}${chart.profile.birthTimeLocal ? ` · ${chart.profile.birthTimeLocal}` : " · Không biết giờ sinh"} · ${chart.profile.birthPlaceLabel}`;
    $("astro-limit-badge").hidden = !limited;
    $("astro-quick-grid").innerHTML = quickCards(chart);
    $("astro-wheel-root").innerHTML = wheelSvg(chart);
    $("astro-overview").innerHTML = narrativeHtml(chart);
    $("astro-planets").innerHTML = planetTable(chart);
    $("astro-aspects").innerHTML = aspectTable(chart);
    $("astro-houses-section").hidden = !chart.houses.length;
    $("astro-houses").innerHTML = houseTable(chart);
    const housesOption = document.querySelector('[data-astro-pdf="houses"]');
    housesOption.disabled = !chart.houses.length;
    housesOption.closest('.pdf-option').classList.toggle('unavailable', !chart.houses.length);
    $("astro-balance").innerHTML = `<div><h4>Nguyên tố</h4>${Object.entries(chart.balances.element).map(([key, value]) => `<span>${esc(key)} <strong>${value}</strong></span>`).join("")}</div><div><h4>Tính chất</h4>${Object.entries(chart.balances.modality).map(([key, value]) => `<span>${esc(key)} <strong>${value}</strong></span>`).join("")}</div>`;
    $("astro-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetAstrology() {
    $("astrology-form").reset();
    $("astro-name").value = "Nguyễn Minh An";
    $("astro-date").value = "1998-05-14";
    $("astro-time").value = "09:30";
    setTimeAccuracy("exact");
    selectLocation("vn-hcm");
    state.chart = null;
    $("astro-result").hidden = true;
    showError("");
  }

  function svgToCanvas(svg) {
    return new Promise((resolve, reject) => {
      const clone = svg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `.natal-wheel{font-family:"MXiao Gilroy",Arial,sans-serif}.natal-wheel .wheel-bg{fill:#fffdfd;stroke:#ead7d9;stroke-width:2}.natal-wheel circle:not(.planet-node circle){fill:none;stroke:#dbc5c8;stroke-width:1.2}.natal-wheel text{fill:#6e6063;font-size:12px;font-weight:700}.natal-wheel line{stroke:#d8c4c7;stroke-width:1}.natal-wheel .house-line{stroke:#a94b56;stroke-width:1.3}.natal-wheel .house-number{fill:#a90f1c;font-size:12px}.natal-wheel .aspect-line{stroke-width:1.4;opacity:.45}.natal-wheel .aspect-line.flow{stroke:#2d8473}.natal-wheel .aspect-line.tense{stroke:#c93948}.natal-wheel .planet-node circle{fill:#fff;stroke:#bd1523;stroke-width:2}.natal-wheel .planet-node text{fill:#a90f1c;font-size:18px}.natal-wheel .angle-label{fill:#fff;stroke:#a90f1c;stroke-width:4px;paint-order:stroke;font-size:12px;font-weight:800}.natal-wheel .wheel-name{fill:#a90f1c;font-size:21px;font-weight:800}.natal-wheel .wheel-note{fill:#6e6063;font-size:12px}`;
      clone.insertBefore(style, clone.firstChild);
      const markup = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1600;
        canvas.height = 1120;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const side = 1040;
        context.drawImage(image, (canvas.width - side) / 2, 34, side, side);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không thể dựng vòng Bản đồ sao cho PDF.")); };
      image.src = url;
    });
  }

  function selectedPdfSections() {
    return Array.from(document.querySelectorAll('[data-astro-pdf]:checked:not(:disabled)')).map((input) => input.dataset.astroPdf);
  }

  $("tool-tuvi").addEventListener("click", () => selectTool("tu-vi"));
  $("tool-astrology").addEventListener("click", () => selectTool("ban-do-sao"));
  $("tool-numerology").addEventListener("click", () => selectTool("than-so-hoc"));
  ["exact", "range", "unknown"].forEach((mode) => $("astro-time-" + mode).addEventListener("click", () => setTimeAccuracy(mode)));
  $("astro-location-search").addEventListener("input", (event) => renderLocationOptions(event.target.value));
  $("astro-location-search").addEventListener("focus", (event) => renderLocationOptions(event.target.value));
  $("astro-location-results").addEventListener("change", (event) => selectLocation(event.target.value));
  $("astro-location-search").addEventListener("change", () => {
    const exact = LOCATIONS.find((item) => normalize(item.label) === normalize($("astro-location-search").value));
    if (exact) selectLocation(exact.id);
  });
  $("astro-reset").addEventListener("click", resetAstrology);
  $("astro-pdf-options-button").addEventListener("click", () => {
    const panel = $("astro-pdf-options");
    panel.hidden = !panel.hidden;
    $("astro-pdf-options-button").setAttribute("aria-expanded", String(!panel.hidden));
  });
  $("astro-pdf-options-close").addEventListener("click", () => {
    $("astro-pdf-options").hidden = true;
    $("astro-pdf-options-button").setAttribute("aria-expanded", "false");
  });
  $("astro-pdf-button").addEventListener("click", async () => {
    if (!state.chart) return;
    const sections = selectedPdfSections();
    if (!sections.length) {
      showError("Hãy chọn ít nhất một phần cho PDF Bản đồ sao.");
      return;
    }
    try {
      $("astro-pdf-button").disabled = true;
      $("astro-toolbar-status").textContent = "Đang tạo PDF...";
      const canvas = sections.includes("wheel") ? await svgToCanvas($("astro-wheel-root").querySelector("svg")) : null;
      const pages = await P.downloadAstrologyPdf(state.chart, canvas, { sections });
      $("astro-toolbar-status").textContent = `Đã tạo ${pages} trang A4.`;
    } catch (error) {
      showError(error.message || "Không thể tạo PDF Bản đồ sao.");
      $("astro-toolbar-status").textContent = "";
    } finally {
      $("astro-pdf-button").disabled = false;
    }
  });
  $("astrology-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      showError("");
      state.chart = E.buildNatalChart(getInput());
      renderChart(state.chart);
      void synthesizeOverview(state.chart);
    } catch (error) {
      showError(error.message || "Không thể lập Bản đồ sao.");
    }
  });
  renderLocationOptions();
  setTimeAccuracy("exact");
  selectLocation("vn-hcm");
  const requested = new URLSearchParams(window.location.search).get("tool");
  selectTool(["ban-do-sao", "than-so-hoc"].includes(requested) ? requested : "tu-vi", false);
})();
