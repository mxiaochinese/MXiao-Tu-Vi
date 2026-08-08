(function(global){
"use strict";
const module={exports:{}}; const exports=module.exports;
const RED = "#bd1523";
const RED_DARK = "#780b14";
const RED_SOFT = "#fff0f2";
const INK = "#211b1d";
const MUTED = "#71676a";
const LINE = "#e7d7db";
const WHITE = "#ffffff";
const GOLD_SOFT = "#fff6dc";
const PAGE_PORTRAIT = { width: 1240, height: 1754, widthPt: 595.28, heightPt: 841.89 };
const PAGE_LANDSCAPE = { width: 1754, height: 1240, widthPt: 841.89, heightPt: 595.28 };
const MAX_PDF_PAGES = 48;
const CANVAS_BODY_FONT_SIZE = 23;
const CANVAS_BODY_LINE_HEIGHT = 32;
const CANVAS_CARD_TITLE_SIZE = 28;
const CANVAS_CARD_TITLE_LINE_HEIGHT = 36;
const PDF_BODY_FONT_SIZE = 11;
const PDF_BODY_LINE_HEIGHT = 15;
const FONT_FAMILY = '"MXiao Gilroy", Arial, "Segoe UI", sans-serif';
const TOPIC_ORDER = ["Tổng quan", "Mệnh - Thân", "12 cung", "Đại vận", "Tiểu vận", "Sự nghiệp", "Tài chính", "Tình cảm", "Gia đình - Quan hệ", "Sức khỏe - Nhịp sống"];

function createCanvas(orientation) {
    if (typeof document === "undefined") throw new Error("Báo cáo PDF cần được tạo trên trình duyệt.");
    const size = orientation === "landscape" ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không hỗ trợ tạo báo cáo PDF.");
    context.fillStyle = WHITE;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}

function getContext(canvas) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không hỗ trợ tạo báo cáo PDF.");
    context.textBaseline = "top";
    context.imageSmoothingEnabled = true;
    return context;
}

function fontSpec(size, weight = 400) {
    return `${weight} ${size}px ${FONT_FAMILY}`;
}

function setFont(context, size, weight = 400) {
    context.font = fontSpec(size, weight);
}

async function ensureFontsReady() {
    if (!document.fonts) return;
    await Promise.all([
        document.fonts.load('400 16px "MXiao Gilroy"'),
        document.fonts.load('700 16px "MXiao Gilroy"')
    ]);
    await document.fonts.ready;
}

function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
}

function wrapLines(context, text, maxWidth) {
    const output = [];
    for (const paragraph of String(text || "").split("\n")) {
        if (!paragraph.trim()) {
            output.push("");
            continue;
        }
        const words = paragraph.trim().split(/\s+/);
        let line = "";
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (!line || context.measureText(candidate).width <= maxWidth) line = candidate;
            else {
                output.push(line);
                line = word;
            }
        }
        if (line) output.push(line);
    }
    return output;
}

function drawLines(context, lines, x, y, lineHeight) {
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    return drawLines(context, wrapLines(context, text, maxWidth), x, y, lineHeight);
}

function addPage(pages, canvas, orientation) {
    const size = orientation === "landscape" ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
    pages.push({ canvas, orientation, widthPt: size.widthPt, heightPt: size.heightPt });
    if (pages.length > MAX_PDF_PAGES) throw new Error(`Báo cáo vượt quá giới hạn ${MAX_PDF_PAGES} trang A4.`);
}

function drawPageHeader(context, title, subtitle) {
    context.fillStyle = RED;
    setFont(context, 38, 800);
    context.fillText(title, 72, 60);
    let y = 112;
    if (subtitle) {
        context.fillStyle = MUTED;
        setFont(context, 17, 400);
        y = drawWrappedText(context, subtitle, 72, y, context.canvas.width - 144, 26) + 12;
    }
    context.fillStyle = LINE;
    context.fillRect(72, y, context.canvas.width - 144, 2);
    return y + 30;
}

function drawFooter(context, chart, pageNumber, totalPages) {
    const y = context.canvas.height - 54;
    context.fillStyle = LINE;
    context.fillRect(72, y - 18, context.canvas.width - 144, 1);
    context.fillStyle = MUTED;
    setFont(context, 13, 500);
    context.fillText(`MXiao Tử Vi | ${chart.input.fullName || "Người xem"}`, 72, y);
    const pageText = `${pageNumber}/${totalPages}`;
    context.fillText(pageText, context.canvas.width - 72 - context.measureText(pageText).width, y);
}

function formatDate(date) {
    return `${date.day}/${date.month}/${date.year}`;
}

function formatLunar(lunar) {
    return `${lunar.day}/${lunar.month}/${lunar.year}${lunar.leap ? " nhuận" : ""}`;
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

function fortuneRows(chart) {
    const rows = [];
    if (chart.analysis.activeDecadeLabel) rows.push(["Đại vận 10 năm", chart.analysis.activeDecadeLabel]);
    if (chart.analysis.annualDecadeLabel) rows.push(["Lưu đại hạn", chart.analysis.annualDecadeLabel]);
    if (chart.analysis.minorFortuneLabel) rows.push(["Tiểu hạn", chart.analysis.minorFortuneLabel]);
    if (chart.analysis.yearBranchPalaceLabel) rows.push(["Lưu Thái Tuế", chart.analysis.yearBranchPalaceLabel]);
    if (chart.analysis.monthlyLabel) rows.push(["Lưu nguyệt", chart.analysis.monthlyLabel]);
    if (chart.input.viewScope === "all_months") rows.push(["Lưu nguyệt", `${chart.analysis.monthlyFortunes.length} tháng âm lịch đã được tính`]);
    return rows;
}

function reportFileSuffix(chart) {
    if (chart.input.viewScope === "natal_overview") return "tong-quan";
    if (chart.input.viewScope === "yearly") return `nam-${chart.input.viewYear}`;
    if (chart.input.viewScope === "all_months") return `nam-${chart.input.viewYear}-tat-ca-thang`;
    return `nam-${chart.input.viewYear}-thang-${chart.input.viewMonth}${chart.input.viewLeap ? "-nhuan" : ""}`;
}

function drawCover(chart) {
    const canvas = createCanvas("portrait");
    const context = getContext(canvas);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#d52231");
    gradient.addColorStop(1, RED_DARK);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 0.13;
    context.strokeStyle = WHITE;
    context.lineWidth = 2;
    for (let index = 0; index < 9; index += 1) {
        context.beginPath();
        context.arc(1030, 230, 85 + index * 46, 0, Math.PI * 2);
        context.stroke();
    }
    context.globalAlpha = 1;
    context.fillStyle = WHITE;
    setFont(context, 22, 800);
    context.fillText("MXIAO TỬ VI", 92, 105);
    setFont(context, 65, 900);
    drawWrappedText(context, "LÁ SỐ TỬ VI VÀ LUẬN GIẢI CHI TIẾT", 92, 350, 930, 82);
    setFont(context, 36, 750);
    context.fillText(chart.input.fullName || "Người xem", 92, 665);
    context.globalAlpha = 0.9;
    setFont(context, 20, 500);
    const meta = [
        `Dương lịch: ${formatDate(chart.normalized.solar)}`,
        `Âm lịch: ${formatLunar(chart.normalized.lunar)}`,
        `Giờ sinh: ${chart.normalized.timeDisplay || chart.normalized.adjustedTime}`,
        `Múi giờ: ${chart.input.timezone}`,
        `Năm sinh: ${chart.normalized.yearCanChi}`,
        `Mệnh: ${chart.birthElement} | ${chart.bureau.label}`,
        `Phạm vi: ${viewScopeLabel(chart)}`,
        ...(chart.analysis.nominalAge ? [`Tuổi mụ: ${chart.analysis.nominalAge} | ${chart.analysis.viewYearCanChi}`] : [])
    ];
    meta.forEach((line, index) => context.fillText(line, 92, 790 + index * 42));
    context.globalAlpha = 1;
    roundedRect(context, 92, 1225, 1056, 210, 28);
    context.fillStyle = "rgba(255,255,255,0.11)";
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.25)";
    context.stroke();
    context.fillStyle = WHITE;
    setFont(context, 18, 650);
    drawWrappedText(context, "Lá số tổng hợp mệnh bàn, vận hạn và luận giải Tử Vi.", 126, 1280, 980, 30);
    context.globalAlpha = 0.75;
    setFont(context, 14, 400);
    drawWrappedText(context, "Nội dung thuộc hệ thống Tử Vi truyền thống và chỉ dùng để tham khảo.", 126, 1380, 980, 24);
    return canvas;
}

function drawSummaryBox(context, x, y, width, height, label, value, accent = false) {
    roundedRect(context, x, y, width, height, 18);
    context.fillStyle = accent ? RED_SOFT : WHITE;
    context.fill();
    context.strokeStyle = accent ? "#e3aab0" : LINE;
    context.stroke();
    context.fillStyle = MUTED;
    setFont(context, 16, 700);
    context.fillText(label.toUpperCase(), x + 20, y + 18);
    context.fillStyle = accent ? RED_DARK : INK;
    setFont(context, 23, 750);
    drawWrappedText(context, value, x + 20, y + 48, width - 40, 30);
}

function drawOverviewPage(chart) {
    const canvas = createCanvas("portrait");
    const context = getContext(canvas);
    let y = drawPageHeader(context, "Tổng quan lá số", `Phạm vi báo cáo: ${viewScopeLabel(chart)}.`);
    const gap = 16;
    const width = (canvas.width - 144 - gap) / 2;
    const summaryHeight = 112;
    const summaryStride = 126;
    const boxes = [
        ["Dương lịch", formatDate(chart.normalized.solar)],
        ["Âm lịch", formatLunar(chart.normalized.lunar)],
        ["Giờ sinh", `${chart.normalized.timeDisplay || chart.normalized.adjustedTime} - ${chart.input.timezone}`],
        ["Phương pháp", chart.input.calculationMethod],
        ["Mệnh và Cục", `${chart.birthElement} - ${chart.bureau.label}`],
        ["Cung Mệnh", `${chart.palaces.find((item) => item.id === chart.lifePalace).name} tại ${chart.palaces.find((item) => item.id === chart.lifePalace).branch}`],
        ["Cung Thân", `${chart.palaces.find((item) => item.id === chart.bodyPalace).name} tại ${chart.palaces.find((item) => item.id === chart.bodyPalace).branch}`]
    ];
    boxes.forEach(([label, value], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        drawSummaryBox(context, 72 + column * (width + gap), y + row * summaryStride, width, summaryHeight, label, value, index === 4 || index === 5);
    });
    y += Math.ceil(boxes.length / 2) * summaryStride + 24;
    context.fillStyle = RED;
    setFont(context, 30, 800);
    context.fillText("Phạm vi luận giải", 72, y);
    y += 52;
    const fortuneBoxes = [["Phạm vi", viewScopeLabel(chart)], ...fortuneRows(chart)];
    fortuneBoxes.forEach(([label, value], index) => {
        drawSummaryBox(context, 72, y + index * 124, canvas.width - 144, 114, label, value, true);
    });
    return canvas;
}

const GRID_POSITION = {
    6: { column: 0, row: 0 }, 7: { column: 1, row: 0 }, 8: { column: 2, row: 0 }, 9: { column: 3, row: 0 },
    5: { column: 0, row: 1 }, 10: { column: 3, row: 1 }, 4: { column: 0, row: 2 }, 11: { column: 3, row: 2 },
    3: { column: 0, row: 3 }, 2: { column: 1, row: 3 }, 1: { column: 2, row: 3 }, 12: { column: 3, row: 3 }
};

function constantsBranch(branch) {
    return ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"][branch] || "";
}

function palaceMarkers(chart, palace) {
    const markers = [];
    if (palace.id === chart.lifePalace) markers.push("Mệnh");
    if (palace.isBody) markers.push("Thân");
    if (palace.id === chart.analysis.activeDecadePalaceId) markers.push("Đại vận");
    if (palace.id === chart.analysis.annualDecadePalaceId) markers.push("Lưu đại hạn");
    if (palace.id === chart.analysis.minorFortunePalaceId) markers.push("Tiểu hạn");
    if (palace.id === chart.analysis.yearBranchPalaceId) markers.push("Lưu Thái Tuế");
    if (palace.id === chart.analysis.monthlyPalaceId) markers.push(`Lưu nguyệt T${chart.input.viewMonth}`);
    return markers;
}

function drawPalaceCell(context, chart, palace, x, y, width, height) {
    const markers = palaceMarkers(chart, palace);
    const highlighted = markers.length > 0;
    roundedRect(context, x, y, width, height, 13);
    context.fillStyle = highlighted ? RED_SOFT : WHITE;
    context.fill();
    context.strokeStyle = highlighted ? RED : LINE;
    context.lineWidth = highlighted ? 2.4 : 1.2;
    context.stroke();
    context.lineWidth = 1;
    context.fillStyle = RED;
    setFont(context, 18, 800);
    context.fillText(`${palace.name}${palace.isBody ? " - Thân" : ""}`, x + 14, y + 13);
    roundedRect(context, x + width - 48, y + 10, 35, 35, 9);
    context.fillStyle = RED_DARK;
    context.fill();
    context.fillStyle = WHITE;
    setFont(context, 17, 800);
    const branchWidth = context.measureText(palace.branch).width;
    context.fillText(palace.branch, x + width - 30.5 - branchWidth / 2, y + 18);
    context.fillStyle = MUTED;
    setFont(context, 11, 600);
    context.fillText(`${palace.element} | ${palace.decadeStart}-${palace.decadeEnd}`, x + 14, y + 44);
    const major = palace.stars.filter((item) => item.group === "major").map((item) => `${item.name}${item.brightness ? ` (${item.brightness})` : ""}`).join(" · ") || "Vô chính diệu";
    context.fillStyle = RED_DARK;
    setFont(context, 13, 800);
    let textY = drawWrappedText(context, major, x + 14, y + 67, width - 28, 17) + 4;
    const transforms = palace.stars.filter((item) => item.group === "transform").map((item) => item.name).join(" · ");
    if (transforms) {
        context.fillStyle = "#76510d";
        setFont(context, 11, 700);
        textY = drawWrappedText(context, transforms, x + 14, textY, width - 28, 15) + 3;
    }
    const others = palace.stars.filter((item) => !["major", "transform", "cycle"].includes(item.group)).slice(0, 10).map((item) => item.name).join(" · ");
    context.fillStyle = INK;
    setFont(context, 10, 400);
    textY = drawWrappedText(context, others, x + 14, textY, width - 28, 13) + 3;
    if (palace.annualStars.length) {
        context.fillStyle = "#7a0912";
        setFont(context, 9, 700);
        textY = drawWrappedText(context, palace.annualStars.map((item) => item.name).join(" · "), x + 14, textY, width - 28, 12) + 2;
    }
    if (palace.monthlyStars.length) {
        context.fillStyle = "#573d79";
        setFont(context, 8, 700);
        textY = drawWrappedText(context, palace.monthlyStars.map((item) => item.name).join(" · "), x + 14, textY, width - 28, 11) + 2;
    }
    context.fillStyle = MUTED;
    setFont(context, 9, 650);
    context.fillText(markers.join(" · "), x + 14, y + height - 23);
    const blockers = [palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""].filter(Boolean).join(" · ");
    if (blockers) {
        context.fillStyle = RED;
        const blockerWidth = context.measureText(blockers).width;
        context.fillText(blockers, x + width - 14 - blockerWidth, y + height - 23);
    }
}

function drawChartPage(chart) {
    const canvas = createCanvas("landscape");
    const context = getContext(canvas);
    const top = drawPageHeader(context, "Lá số Tử Vi", `${viewScopeLabel(chart)}. Những lớp vận thuộc phạm vi đã chọn được đánh dấu trực tiếp trên 12 cung.`);
    const marginX = 55;
    const gap = 8;
    const cellWidth = (canvas.width - marginX * 2 - gap * 3) / 4;
    const cellHeight = 236;
    chart.palaces.forEach((palace) => {
        const position = GRID_POSITION[palace.id];
        drawPalaceCell(context, chart, palace, marginX + position.column * (cellWidth + gap), top + position.row * (cellHeight + gap), cellWidth, cellHeight);
    });
    const centerX = marginX + cellWidth + gap;
    const centerY = top + cellHeight + gap;
    const centerWidth = cellWidth * 2 + gap;
    const centerHeight = cellHeight * 2 + gap;
    roundedRect(context, centerX, centerY, centerWidth, centerHeight, 22);
    const gradient = context.createLinearGradient(centerX, centerY, centerX + centerWidth, centerY + centerHeight);
    gradient.addColorStop(0, "#d52231");
    gradient.addColorStop(1, RED_DARK);
    context.fillStyle = gradient;
    context.fill();
    context.fillStyle = WHITE;
    setFont(context, 18, 700);
    context.fillText(chart.normalized.yearCanChi, centerX + 34, centerY + 35);
    setFont(context, 34, 850);
    drawWrappedText(context, chart.input.fullName || "Người xem", centerX + 34, centerY + 76, centerWidth - 68, 42);
    context.globalAlpha = 0.9;
    setFont(context, 17, 500);
    const centerLines = [`Mệnh ${chart.birthElement} - ${chart.bureau.label}`, `Phạm vi: ${viewScopeLabel(chart)}`, ...fortuneRows(chart).map(([label, value]) => `${label}: ${value}`)];
    centerLines.forEach((line, index) => drawWrappedText(context, line, centerX + 34, centerY + 155 + index * 47, centerWidth - 68, 23));
    context.globalAlpha = 1;
    return canvas;
}

function topicOrder(chart) {
    const present = new Set(chart.interpretations.map((item) => item.topic));
    const periodTopics = Array.from(present).filter((topic) => topic.startsWith("Vận hạn ") || topic.startsWith("Lưu nguyệt "));
    const desired = [...TOPIC_ORDER.slice(0, 5), ...periodTopics, ...TOPIC_ORDER.slice(5)];
    return desired.filter((topic) => present.has(topic));
}

function normalizeExportOptions(chart, options) {
    const availableTopics = topicOrder(chart).filter((topic) => topic !== "Tổng quan");
    const requestedTopics = Array.isArray(options?.topics) ? options.topics : availableTopics;
    const normalized = {
        cover: options?.cover !== false,
        overview: options?.overview !== false,
        chart: options?.chart !== false,
        topics: availableTopics.filter((topic) => requestedTopics.includes(topic)),
        comparison: options?.comparison || null
    };
    if (!normalized.cover && !normalized.overview && !normalized.chart && !normalized.topics.length && !normalized.comparison) throw new Error("Hãy chọn ít nhất một phần để xuất PDF.");
    return normalized;
}

function itemParagraphs(item) {
    if (Array.isArray(item.paragraphs) && item.paragraphs.length)
        return item.paragraphs;
    return String(item.body || "").split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
}

function sentenceUnits(paragraph) {
    const units = String(paragraph || "").match(/[^.!?]+(?:[.!?]+|$)/g) || [];
    return units.map((value) => value.trim()).filter(Boolean);
}

function chunkItemForHeight(item, maxHeight, estimate) {
    const titleFor = (index) => index === 0 ? item.title : `${item.title} - tiếp theo`;
    const normalizedParagraphs = [];
    for (const paragraph of itemParagraphs(item)) {
        const probe = { ...item, title: titleFor(0), paragraphs: [paragraph], body: paragraph };
        if (estimate(probe) <= maxHeight) {
            normalizedParagraphs.push(paragraph);
            continue;
        }
        const sentences = sentenceUnits(paragraph);
        if (sentences.length <= 1)
            throw new Error(`Đoạn văn trong mục "${item.title}" quá dài để trình bày trên một trang A4.`);
        let current = "";
        for (const sentence of sentences) {
            const candidate = current ? `${current} ${sentence}` : sentence;
            const candidateItem = { ...item, title: titleFor(0), paragraphs: [candidate], body: candidate };
            if (estimate(candidateItem) <= maxHeight) {
                current = candidate;
                continue;
            }
            if (!current)
                throw new Error(`Một câu trong mục "${item.title}" quá dài để trình bày trên một trang A4.`);
            normalizedParagraphs.push(current);
            current = sentence;
        }
        if (current) normalizedParagraphs.push(current);
    }
    const chunks = [];
    let currentParagraphs = [];
    for (const paragraph of normalizedParagraphs) {
        const index = chunks.length;
        const candidateParagraphs = [...currentParagraphs, paragraph];
        const candidate = { ...item, title: titleFor(index), paragraphs: candidateParagraphs, body: candidateParagraphs.join("\n\n") };
        if (estimate(candidate) <= maxHeight) {
            currentParagraphs = candidateParagraphs;
            continue;
        }
        if (currentParagraphs.length) {
            const chunkIndex = chunks.length;
            chunks.push({ ...item, title: titleFor(chunkIndex), paragraphs: currentParagraphs, body: currentParagraphs.join("\n\n") });
            currentParagraphs = [paragraph];
        }
        else {
            throw new Error(`Mục "${item.title}" quá dài để trình bày trên một trang A4.`);
        }
    }
    if (currentParagraphs.length) {
        const chunkIndex = chunks.length;
        chunks.push({ ...item, title: titleFor(chunkIndex), paragraphs: currentParagraphs, body: currentParagraphs.join("\n\n") });
    }
    return chunks;
}

function estimateCardHeight(context, item, width) {
    setFont(context, CANVAS_CARD_TITLE_SIZE, 800);
    const titleLines = wrapLines(context, item.title, width - 48).length;
    setFont(context, CANVAS_BODY_FONT_SIZE, 400);
    const paragraphLines = itemParagraphs(item).reduce((sum, paragraph) => sum + wrapLines(context, paragraph, width - 48).length, 0);
    const paragraphGaps = Math.max(0, itemParagraphs(item).length - 1) * 16;
    return 34 + titleLines * CANVAS_CARD_TITLE_LINE_HEIGHT + 18 + paragraphLines * CANVAS_BODY_LINE_HEIGHT + paragraphGaps + 30;
}

function drawCard(context, item, x, y, width) {
    const height = estimateCardHeight(context, item, width);
    roundedRect(context, x, y, width, height, 18);
    context.fillStyle = WHITE;
    context.fill();
    context.strokeStyle = LINE;
    context.stroke();
    let cursor = y + 24;
    context.fillStyle = RED_DARK;
    setFont(context, CANVAS_CARD_TITLE_SIZE, 800);
    cursor = drawWrappedText(context, item.title, x + 24, cursor, width - 48, CANVAS_CARD_TITLE_LINE_HEIGHT) + 16;
    context.fillStyle = INK;
    setFont(context, CANVAS_BODY_FONT_SIZE, 400);
    const paragraphs = itemParagraphs(item);
    paragraphs.forEach((paragraph, index) => {
        cursor = drawWrappedText(context, paragraph, x + 24, cursor, width - 48, CANVAS_BODY_LINE_HEIGHT);
        if (index < paragraphs.length - 1) cursor += 16;
    });
    return height;
}

function drawTopicHeading(context, topic, y) {
    context.fillStyle = RED;
    setFont(context, 34, 800);
    context.fillText(topic, 72, y);
    context.fillStyle = LINE;
    context.fillRect(72, y + 46, context.canvas.width - 144, 1);
    return y + 68;
}

function drawInterpretationPages(chart, selectedTopics) {
    const pages = [];
    const order = topicOrder(chart).filter((topic) => selectedTopics.includes(topic));
    if (!order.length) return pages;
    const bottom = PAGE_PORTRAIT.height - 92;
    let canvas = createCanvas("portrait");
    let context = getContext(canvas);
    let y = drawPageHeader(context, "Luận giải chi tiết", `Phạm vi báo cáo: ${viewScopeLabel(chart)}.`);
    for (const topic of order) {
        const items = chart.interpretations.filter((item) => item.topic === topic);
        if (!items.length) continue;
        const firstHeight = estimateCardHeight(context, items[0], canvas.width - 144);
        if (y + 58 + firstHeight > bottom) {
            pages.push(canvas);
            canvas = createCanvas("portrait");
            context = getContext(canvas);
            y = drawPageHeader(context, "Luận giải chi tiết", `Tiếp theo - ${topic}`);
        }
        y = drawTopicHeading(context, topic, y);
        for (const item of items) {
            const chunks = chunkItemForHeight(item, bottom - 170, (candidate) => estimateCardHeight(context, candidate, canvas.width - 144));
            for (const chunk of chunks) {
                const height = estimateCardHeight(context, chunk, canvas.width - 144);
                if (y + height > bottom) {
                    pages.push(canvas);
                    canvas = createCanvas("portrait");
                    context = getContext(canvas);
                    y = drawPageHeader(context, "Luận giải chi tiết", `Tiếp theo - ${topic}`);
                    y = drawTopicHeading(context, topic, y);
                }
                y += drawCard(context, chunk, 72, y, canvas.width - 144) + 18;
            }
        }
        y += 14;
    }
    pages.push(canvas);
    return pages;
}

function drawComparisonPages(chart, comparison) {
    const pages = [];
    let canvas = createCanvas("portrait");
    let context = getContext(canvas);
    let y = drawPageHeader(context, "So sánh hai khung giờ sinh", "Đối chiếu các cấu trúc thay đổi khi giờ sinh chưa chắc chắn.");
    const gap = 16;
    const width = (canvas.width - 144 - gap) / 2;
    drawSummaryBox(context, 72, y, width, 104, "Khung giờ A", comparison.labelA, true);
    drawSummaryBox(context, 72 + width + gap, y, width, 104, "Khung giờ B", comparison.labelB, true);
    y += 132;
    context.fillStyle = MUTED;
    setFont(context, 16, 600);
    context.fillText(`${comparison.changedCount} hạng mục có khác biệt`, 72, y);
    y += 40;
    for (const row of comparison.rows) {
        setFont(context, 14, 750);
        const titleLines = wrapLines(context, row.label, 220);
        setFont(context, 14, 400);
        const aLines = wrapLines(context, row.valueA, 390);
        const bLines = wrapLines(context, row.valueB, 390);
        const rowHeight = Math.max(64, 24 + Math.max(titleLines.length, aLines.length, bLines.length) * 22);
        if (y + rowHeight > canvas.height - 100) {
            pages.push(canvas);
            canvas = createCanvas("portrait");
            context = getContext(canvas);
            y = drawPageHeader(context, "So sánh hai khung giờ sinh", "Tiếp theo - các cấu trúc còn lại.");
        }
        roundedRect(context, 72, y, canvas.width - 144, rowHeight, 12);
        context.fillStyle = row.changed ? RED_SOFT : WHITE;
        context.fill();
        context.strokeStyle = row.changed ? "#e3aab0" : LINE;
        context.stroke();
        context.fillStyle = RED_DARK;
        setFont(context, 14, 750);
        drawLines(context, titleLines, 88, y + 16, 22);
        context.fillStyle = INK;
        setFont(context, 14, 400);
        drawLines(context, aLines, 325, y + 16, 22);
        drawLines(context, bLines, 740, y + 16, 22);
        y += rowHeight + 10;
    }
    pages.push(canvas);
    return pages;
}

function createReportPages(chart, exportOptions) {
    const options = normalizeExportOptions(chart, exportOptions);
    const pages = [];
    if (options.cover) addPage(pages, drawCover(chart), "portrait");
    if (options.overview) addPage(pages, drawOverviewPage(chart), "portrait");
    if (options.chart) addPage(pages, drawChartPage(chart), "landscape");
    const detailedTopics = options.overview ? ["Tổng quan", ...options.topics] : options.topics;
    drawInterpretationPages(chart, detailedTopics).forEach((canvas) => addPage(pages, canvas, "portrait"));
    if (options.comparison) drawComparisonPages(chart, options.comparison).forEach((canvas) => addPage(pages, canvas, "portrait"));
    if (pages.length > MAX_PDF_PAGES) throw new Error(`Báo cáo có ${pages.length} trang, vượt giới hạn ${MAX_PDF_PAGES} trang A4.`);
    pages.forEach((page, index) => { if (!(options.cover && index === 0)) drawFooter(getContext(page.canvas), chart, index + 1, pages.length); });
    return pages;
}

function canvasToJpeg(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("Không thể dựng trang báo cáo."));
            resolve(new Uint8Array(await blob.arrayBuffer()));
        }, "image/jpeg", 0.94);
    });
}

function concatBytes(parts) {
    const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    parts.forEach((part) => { output.set(part, offset); offset += part.length; });
    return output;
}

function ascii(value) {
    return new TextEncoder().encode(value);
}

function buildPdfBytes(jpegPages) {
    const objectCount = 2 + jpegPages.length * 3;
    const objects = new Map();
    const pageRefs = [];
    jpegPages.forEach((page, index) => {
        const pageId = 3 + index * 3;
        const imageId = pageId + 1;
        const contentId = pageId + 2;
        pageRefs.push(`${pageId} 0 R`);
        const content = `q\n${page.widthPt.toFixed(2)} 0 0 ${page.heightPt.toFixed(2)} 0 0 cm\n/Im${index + 1} Do\nQ\n`;
        objects.set(pageId, ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.widthPt.toFixed(2)} ${page.heightPt.toFixed(2)}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));
        objects.set(imageId, concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`), page.jpeg, ascii("\nendstream")]));
        objects.set(contentId, ascii(`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`));
    });
    objects.set(1, ascii("<< /Type /Catalog /Pages 2 0 R >>"));
    objects.set(2, ascii(`<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${jpegPages.length} >>`));
    const chunks = [new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37,0x0a,0x25,0xe2,0xe3,0xcf,0xd3,0x0a])];
    const offsets = new Array(objectCount + 1).fill(0);
    let length = chunks[0].length;
    for (let id = 1; id <= objectCount; id += 1) {
        const body = objects.get(id);
        if (!body) throw new Error("Không thể hoàn thiện tệp PDF.");
        offsets[id] = length;
        const header = ascii(`${id} 0 obj\n`);
        const footer = ascii("\nendobj\n");
        chunks.push(header, body, footer);
        length += header.length + body.length + footer.length;
    }
    const xrefOffset = length;
    let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= objectCount; id += 1) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    xref += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(ascii(xref));
    return concatBytes(chunks);
}

async function buildPdfBlob(pages) {
    const jpegPages = await Promise.all(pages.map(async (page) => ({
        jpeg: await canvasToJpeg(page.canvas),
        pixelWidth: page.canvas.width,
        pixelHeight: page.canvas.height,
        widthPt: page.widthPt,
        heightPt: page.heightPt
    })));
    return new Blob([buildPdfBytes(jpegPages)], { type: "application/pdf" });
}

function safeFileName(value) {
    return (value || "la-so-tu-vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "la-so-tu-vi";
}

async function downloadChartPdf(chart, exportOptions) {
    await ensureFontsReady();
    const pages = createReportPages(chart, exportOptions);
    const blob = await buildPdfBlob(pages);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(chart.input.fullName)}-la-so-tu-vi-${reportFileSuffix(chart)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    return pages.length;
}


function pdfColor(hex) {
    const value = String(hex || "#000000").replace("#", "");
    const full = value.length === 3 ? value.split("").map((item) => item + item).join("") : value;
    return [parseInt(full.slice(0, 2), 16) / 255, parseInt(full.slice(2, 4), 16) / 255, parseInt(full.slice(4, 6), 16) / 255];
}

let textMeasureContext = null;
function measurePdfText(text, size, weight = 400) {
    if (typeof document === "undefined") return String(text).length * size * 0.52;
    if (!textMeasureContext) textMeasureContext = document.createElement("canvas").getContext("2d");
    textMeasureContext.font = fontSpec(size, weight);
    return textMeasureContext.measureText(String(text)).width;
}

function wrapPdfText(text, maxWidth, size, weight = 400) {
    const lines = [];
    for (const paragraph of String(text || "").split("\n")) {
        if (!paragraph.trim()) {
            lines.push("");
            continue;
        }
        const words = paragraph.trim().split(/\s+/);
        let line = "";
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (!line || measurePdfText(candidate, size, weight) <= maxWidth) line = candidate;
            else {
                lines.push(line);
                line = word;
            }
        }
        if (line) lines.push(line);
    }
    return lines;
}

function newTextPage(orientation = "portrait") {
    const size = orientation === "landscape" ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
    return { orientation, widthPt: size.widthPt, heightPt: size.heightPt, elements: [], imageCanvas: null, bookmark: "", semanticCounter: 0 };
}

function inferSemanticRole(size, weight) {
    if (weight >= 600 && size >= 28) return "H1";
    if (weight >= 600 && size >= 16) return "H2";
    if (weight >= 600 && size >= 11) return "H3";
    return "P";
}

function nextSemanticGroup(page) {
    page.semanticCounter = (page.semanticCounter || 0) + 1;
    return `semantic-${page.semanticCounter}`;
}

function textElement(page, text, x, baselineTop, size, weight = 400, color = INK, semanticRole = null, semanticGroup = null) {
    const role = semanticRole || inferSemanticRole(size, weight);
    page.elements.push({
        type: "text", text: String(text), x, baselineTop, size, weight, color,
        semanticRole: role,
        semanticGroup: role === "Artifact" ? null : (semanticGroup || nextSemanticGroup(page))
    });
}

function rectElement(page, x, top, width, height, fill, stroke = null, lineWidth = 1) {
    page.elements.push({ type: "rect", x, top, width, height, fill, stroke, lineWidth });
}

function lineElement(page, x1, top1, x2, top2, color = LINE, lineWidth = 1) {
    page.elements.push({ type: "line", x1, top1, x2, top2, color, lineWidth });
}

function textBlock(page, text, x, top, maxWidth, size, lineHeight, weight = 400, color = INK, semanticRole = null) {
    const lines = wrapPdfText(text, maxWidth, size, weight);
    const role = semanticRole || inferSemanticRole(size, weight);
    const group = role === "Artifact" ? null : nextSemanticGroup(page);
    lines.forEach((line, index) => textElement(page, line, x, top + size + index * lineHeight, size, weight, color, role, group));
    return top + Math.max(1, lines.length) * lineHeight;
}

function selectableHeader(page, title, subtitle = "") {
    if (!page.bookmark) page.bookmark = title;
    textElement(page, title, 48, 62, 24, 700, RED);
    let y = 78;
    if (subtitle) y = textBlock(page, subtitle, 48, 82, page.widthPt - 96, 10, 14, 400, MUTED) + 8;
    lineElement(page, 48, y, page.widthPt - 48, y, LINE, 0.8);
    return y + 22;
}

function addSummaryLine(page, label, value, top, accent = false) {
    rectElement(page, 48, top, page.widthPt - 96, 54, accent ? RED_SOFT : "#ffffff", accent ? "#e3aab0" : LINE, 0.8);
    textElement(page, label.toUpperCase(), 62, top + 19, 8, 700, MUTED);
    textBlock(page, value, 160, top + 10, page.widthPt - 222, 11, 15, 700, accent ? RED_DARK : INK);
    return top + 64;
}

function rasterizeType3Glyph(character, weight) {
    const designSize = 96;
    const baseline = 116;
    const height = 150;
    const measureCanvas = document.createElement("canvas");
    const measureContext = measureCanvas.getContext("2d");
    measureContext.font = fontSpec(designSize, weight);
    const measured = Math.max(character === " " ? designSize * 0.32 : measureContext.measureText(character).width, 1);
    const width = Math.max(8, Math.ceil(measured + 20));
    if (character === " ") return { advance: Math.round(measured / designSize * 1000), width, height, xOffset: 0, yOffset: 0, glyphWidth: 0, glyphHeight: 0, hex: "" };
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#000000";
    context.font = fontSpec(designSize, weight);
    context.textBaseline = "alphabetic";
    context.fillText(character, 10, baseline);
    const data = context.getImageData(0, 0, width, height).data;
    const rowBytes = Math.ceil(width / 8);
    const bytes = new Uint8Array(rowBytes * height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (data[(y * width + x) * 4 + 3] > 60) bytes[y * rowBytes + (x >> 3)] |= 1 << (7 - (x & 7));
        }
    }
    return {
        advance: Math.max(1, Math.round(measured / designSize * 1000)),
        width,
        height,
        xOffset: Math.round(-10 / designSize * 1000),
        yOffset: Math.round(-(height - baseline) / designSize * 1000),
        glyphWidth: Math.round(width / designSize * 1000),
        glyphHeight: Math.round(height / designSize * 1000),
        hex: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()
    };
}

class PdfStore {
    constructor() { this.objects = [null]; }
    reserve() { this.objects.push(null); return this.objects.length - 1; }
    add(body) { const id = this.reserve(); this.set(id, body); return id; }
    set(id, body) { this.objects[id] = typeof body === "string" ? ascii(body) : body; }
    stream(content, dictionary = "") {
        const bytes = typeof content === "string" ? ascii(content) : content;
        return this.add(concatBytes([ascii(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`), bytes, ascii("\nendstream")]));
    }
}

function buildType3Font(store, characters, weight) {
    const chars = Array.from(new Set(characters)).filter((char) => char !== "\n" && char !== "\r");
    if (!chars.includes(" ")) chars.unshift(" ");
    if (chars.length > 255) throw new Error("Báo cáo sử dụng quá nhiều ký tự khác nhau.");
    const codeMap = new Map();
    const widths = [];
    const charProcs = [];
    const names = [];
    chars.forEach((char, index) => {
        const code = index + 1;
        codeMap.set(char, code);
        const glyph = rasterizeType3Glyph(char, weight);
        widths.push(glyph.advance);
        const name = `g${code}`;
        names.push(name);
        const stream = char === " "
            ? `${glyph.advance} 0 d0\n`
            : `${glyph.advance} 0 d0\nq\n${glyph.glyphWidth} 0 0 ${glyph.glyphHeight} ${glyph.xOffset} ${glyph.yOffset} cm\nBI /W ${glyph.width} /H ${glyph.height} /BPC 1 /IM true /D [1 0] /F /AHx ID\n${glyph.hex}>\nEI\nQ\n`;
        charProcs.push(store.stream(stream));
    });
    let cmap = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /MXiao-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<01> <FF>\nendcodespacerange\n";
    const mappings = chars.map((char, index) => ({ code: index + 1, unicode: char.codePointAt(0) }));
    for (let start = 0; start < mappings.length; start += 90) {
        const group = mappings.slice(start, start + 90);
        cmap += `${group.length} beginbfchar\n`;
        for (const item of group) cmap += `<${item.code.toString(16).padStart(2, "0").toUpperCase()}> <${item.unicode.toString(16).padStart(4, "0").toUpperCase()}>\n`;
        cmap += "endbfchar\n";
    }
    cmap += "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n";
    const toUnicodeId = store.stream(cmap);
    const charProcEntries = names.map((name, index) => `/${name} ${charProcs[index]} 0 R`).join(" ");
    const differences = names.map((name) => `/${name}`).join(" ");
    const fontId = store.add(`<< /Type /Font /Subtype /Type3 /Name /F${weight} /FontBBox [-200 -400 1600 1300] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs << ${charProcEntries} >> /Encoding << /Type /Encoding /Differences [1 ${differences}] >> /FirstChar 1 /LastChar ${chars.length} /Widths [${widths.join(" ")}] /Resources << >> /ToUnicode ${toUnicodeId} 0 R >>`);
    return { id: fontId, codeMap };
}

function encodeType3Text(text, codeMap) {
    let hex = "";
    for (const char of Array.from(String(text))) {
        const code = codeMap.get(char) || codeMap.get(" ");
        hex += code.toString(16).padStart(2, "0").toUpperCase();
    }
    return `<${hex}>`;
}

function pdfUtf16Hex(value) {
    const bytes = [0xFE, 0xFF];
    for (const char of String(value || "")) {
        const code = char.codePointAt(0);
        if (code <= 0xFFFF) bytes.push((code >> 8) & 0xFF, code & 0xFF);
        else {
            const shifted = code - 0x10000;
            const high = 0xD800 + (shifted >> 10);
            const low = 0xDC00 + (shifted & 0x3FF);
            bytes.push((high >> 8) & 0xFF, high & 0xFF, (low >> 8) & 0xFF, low & 0xFF);
        }
    }
    return `<${bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join("")}>`;
}

function pdfDateNow() {
    const value = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    return `D:${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(value.getUTCSeconds())}Z`;
}

function buildPdfOutlines(store, pages, pageIds) {
    if (!pages.length) return null;
    const rootId = store.reserve();
    const itemIds = pages.map(() => store.reserve());
    pages.forEach((page, index) => {
        const previous = index > 0 ? ` /Prev ${itemIds[index - 1]} 0 R` : "";
        const next = index < pages.length - 1 ? ` /Next ${itemIds[index + 1]} 0 R` : "";
        const title = page.bookmark || `Trang ${index + 1}`;
        store.set(itemIds[index], `<< /Title ${pdfUtf16Hex(title)} /Parent ${rootId} 0 R /Dest [${pageIds[index]} 0 R /Fit]${previous}${next} >>`);
    });
    store.set(rootId, `<< /Type /Outlines /First ${itemIds[0]} 0 R /Last ${itemIds[itemIds.length - 1]} 0 R /Count ${itemIds.length} >>`);
    return rootId;
}

function buildPageTagPlan(page) {
    const items = [];
    const groups = new Map();
    let mcid = 0;
    if (page.imageCanvas) {
        items.push({ type: "figure", role: "Figure", mcids: [mcid], alt: "Lá số Tử Vi gồm mười hai cung" });
        mcid += 1;
    }
    page.elements.forEach((element, index) => {
        if (element.type !== "text" || !element.text || element.semanticRole === "Artifact") return;
        const groupKey = element.semanticGroup || `element-${index}`;
        if (!groups.has(groupKey)) {
            const group = { type: "text", role: element.semanticRole || inferSemanticRole(element.size, element.weight), mcids: [], text: [] };
            groups.set(groupKey, group);
            items.push(group);
        }
        const group = groups.get(groupKey);
        group.mcids.push(mcid);
        group.text.push(element.text);
        element.tagMcid = mcid;
        mcid += 1;
    });
    return { items, mcidCount: mcid, figureMcid: page.imageCanvas ? 0 : null };
}

function contentForTextPage(page, fonts, imageName = null, tagPlan = null) {
    const ops = [];
    if (imageName) {
        const imageBody = `q
${page.widthPt.toFixed(2)} 0 0 ${page.heightPt.toFixed(2)} 0 0 cm
/${imageName} Do
Q`;
        ops.push(tagPlan ? `/Figure <</MCID ${tagPlan.figureMcid}>> BDC
${imageBody}
EMC` : imageBody);
    }
    for (const element of page.elements) {
        if (element.type === "rect") {
            const [r, g, b] = pdfColor(element.fill || WHITE);
            const y = page.heightPt - element.top - element.height;
            const command = element.stroke
                ? (() => { const [sr, sg, sb] = pdfColor(element.stroke); return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} rg
${sr.toFixed(4)} ${sg.toFixed(4)} ${sb.toFixed(4)} RG
${element.lineWidth || 1} w
${element.x.toFixed(2)} ${y.toFixed(2)} ${element.width.toFixed(2)} ${element.height.toFixed(2)} re B`; })()
                : `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} rg
${element.x.toFixed(2)} ${y.toFixed(2)} ${element.width.toFixed(2)} ${element.height.toFixed(2)} re f`;
            ops.push(tagPlan ? `/Artifact BMC
${command}
EMC` : command);
        } else if (element.type === "line") {
            const [r, g, b] = pdfColor(element.color);
            const command = `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} RG
${element.lineWidth || 1} w
${element.x1.toFixed(2)} ${(page.heightPt - element.top1).toFixed(2)} m
${element.x2.toFixed(2)} ${(page.heightPt - element.top2).toFixed(2)} l S`;
            ops.push(tagPlan ? `/Artifact BMC
${command}
EMC` : command);
        } else if (element.type === "text" && element.text) {
            const font = element.weight >= 600 ? fonts.bold : fonts.normal;
            const [r, g, b] = pdfColor(element.color);
            const command = `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} rg
BT
/${element.weight >= 600 ? "FB" : "FN"} ${element.size.toFixed(2)} Tf
1 0 0 1 ${element.x.toFixed(2)} ${(page.heightPt - element.baselineTop).toFixed(2)} Tm
${encodeType3Text(element.text, font.codeMap)} Tj
ET`;
            if (!tagPlan || element.semanticRole === "Artifact") ops.push(tagPlan ? `/Artifact BMC
${command}
EMC` : command);
            else ops.push(`/${element.semanticRole || "P"} <</MCID ${element.tagMcid}>> BDC
${command}
EMC`);
        }
    }
    return ops.join("\n") + "\n";
}

function buildTaggedStructure(store, pages, pageIds, tagPlans) {
    const rootId = store.reserve();
    const parentTreeId = store.reserve();
    const sectionIds = pages.map(() => store.reserve());
    const pageChildIds = tagPlans.map((plan) => plan.items.map(() => store.reserve()));
    const parentEntries = [];
    pages.forEach((page, pageIndex) => {
        const plan = tagPlans[pageIndex];
        const mcidParents = new Array(plan.mcidCount);
        plan.items.forEach((item, itemIndex) => {
            const childId = pageChildIds[pageIndex][itemIndex];
            item.mcids.forEach((mcid) => { mcidParents[mcid] = childId; });
            const kids = item.mcids.length === 1
                ? `<< /Type /MCR /Pg ${pageIds[pageIndex]} 0 R /MCID ${item.mcids[0]} >>`
                : `[${item.mcids.map((mcid) => `<< /Type /MCR /Pg ${pageIds[pageIndex]} 0 R /MCID ${mcid} >>`).join(" ")}]`;
            const alt = item.alt ? ` /Alt ${pdfUtf16Hex(item.alt)}` : "";
            store.set(childId, `<< /Type /StructElem /S /${item.role} /P ${sectionIds[pageIndex]} 0 R /Pg ${pageIds[pageIndex]} 0 R /K ${kids}${alt} >>`);
        });
        store.set(sectionIds[pageIndex], `<< /Type /StructElem /S /Sect /P ${rootId} 0 R /Pg ${pageIds[pageIndex]} 0 R /K [${pageChildIds[pageIndex].map((id) => `${id} 0 R`).join(" ")}] >>`);
        parentEntries.push(`${pageIndex} [${mcidParents.map((id) => `${id} 0 R`).join(" ")}]`);
    });
    store.set(parentTreeId, `<< /Nums [${parentEntries.join(" ")}] >>`);
    store.set(rootId, `<< /Type /StructTreeRoot /K [${sectionIds.map((id) => `${id} 0 R`).join(" ")}] /ParentTree ${parentTreeId} 0 R /ParentTreeNextKey ${pages.length} >>`);
    return rootId;
}

function xmlEscape(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildPdfUaXmpMetadata(metadata = {}) {
    const now = new Date().toISOString();
    const title = metadata.title || "Lá số Tử Vi và luận giải chi tiết";
    const author = metadata.author || "MXiao Tử Vi";
    return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${xmlEscape(author)}">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
<dc:format>application/pdf</dc:format><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(title)}</rdf:li><rdf:li xml:lang="vi-VN">${xmlEscape(title)}</rdf:li></rdf:Alt></dc:title><dc:creator><rdf:Seq><rdf:li>${xmlEscape(author)}</rdf:li></rdf:Seq></dc:creator><dc:language><rdf:Bag><rdf:li>vi-VN</rdf:li></rdf:Bag></dc:language><xmp:CreatorTool>${xmlEscape(author)}</xmp:CreatorTool><xmp:CreateDate>${now}</xmp:CreateDate><xmp:ModifyDate>${now}</xmp:ModifyDate><pdf:Producer>${xmlEscape(author)}</pdf:Producer><pdfuaid:part>1</pdfuaid:part>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
}

function serializePdfStore(store, rootId, infoId = null) {
    const objectCount = store.objects.length - 1;
    const chunks = [new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37,0x0a,0x25,0xe2,0xe3,0xcf,0xd3,0x0a])];
    const offsets = new Array(objectCount + 1).fill(0);
    let length = chunks[0].length;
    for (let id = 1; id <= objectCount; id += 1) {
        const body = store.objects[id];
        if (!body) throw new Error(`Thiếu đối tượng PDF ${id}.`);
        offsets[id] = length;
        const header = ascii(`${id} 0 obj\n`);
        const footer = ascii("\nendobj\n");
        chunks.push(header, body, footer);
        length += header.length + body.length + footer.length;
    }
    const xrefOffset = length;
    let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= objectCount; id += 1) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    xref += `trailer\n<< /Size ${objectCount + 1} /Root ${rootId} 0 R${infoId ? ` /Info ${infoId} 0 R` : ""} >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(ascii(xref));
    return concatBytes(chunks);
}

async function buildSelectablePdfBlob(pages, metadata = {}) {
    const normalChars = [];
    const boldChars = [];
    pages.forEach((page) => page.elements.filter((item) => item.type === "text").forEach((item) => {
        const target = item.weight >= 600 ? boldChars : normalChars;
        target.push(...Array.from(item.text));
    }));
    const store = new PdfStore();
    const catalogId = store.reserve();
    const pagesId = store.reserve();
    const normal = buildType3Font(store, normalChars, 400);
    const bold = buildType3Font(store, boldChars, 700);
    const pageIds = pages.map(() => store.reserve());
    const tagPlans = pages.map((page) => buildPageTagPlan(page));
    for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        let imageId = null;
        let imageName = null;
        if (page.imageCanvas) {
            const jpeg = await canvasToJpeg(page.imageCanvas);
            imageName = `Im${index + 1}`;
            imageId = store.add(concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${page.imageCanvas.width} /Height ${page.imageCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, ascii("\nendstream")]));
        }
        const content = contentForTextPage(page, { normal, bold }, imageName, tagPlans[index]);
        const contentId = store.stream(content);
        const resources = `<< /Font << /FN ${normal.id} 0 R /FB ${bold.id} 0 R >>${imageId ? ` /XObject << /${imageName} ${imageId} 0 R >>` : ""} >>`;
        store.set(pageIds[index], `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.widthPt.toFixed(2)} ${page.heightPt.toFixed(2)}] /Resources ${resources} /Contents ${contentId} 0 R /StructParents ${index} /Tabs /S >>`);
    }
    store.set(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
    const structureId = buildTaggedStructure(store, pages, pageIds, tagPlans);
    const outlinesId = buildPdfOutlines(store, pages, pageIds);
    const now = pdfDateNow();
    const info = {
        title: metadata.title || "Lá số Tử Vi và luận giải chi tiết",
        author: metadata.author || "MXiao Tử Vi",
        subject: metadata.subject || "Báo cáo lá số Tử Vi theo nội dung người dùng lựa chọn",
        keywords: metadata.keywords || "Tử Vi, lá số, luận giải, vận hạn"
    };
    const infoId = store.add(`<< /Title ${pdfUtf16Hex(info.title)} /Author ${pdfUtf16Hex(info.author)} /Subject ${pdfUtf16Hex(info.subject)} /Keywords ${pdfUtf16Hex(info.keywords)} /Creator ${pdfUtf16Hex(info.author)} /Producer ${pdfUtf16Hex(info.author)} /CreationDate (${now}) /ModDate (${now}) >>`);
    const metadataId = store.stream(buildPdfUaXmpMetadata(info), "/Type /Metadata /Subtype /XML");
    store.set(catalogId, `<< /Type /Catalog /Version /1.7 /Pages ${pagesId} 0 R /Lang ${pdfUtf16Hex("vi-VN")} /ViewerPreferences << /DisplayDocTitle true >> /StructTreeRoot ${structureId} 0 R /MarkInfo << /Marked true >> /Metadata ${metadataId} 0 R${outlinesId ? ` /Outlines ${outlinesId} 0 R /PageMode /UseOutlines` : ""} >>`);
    return new Blob([serializePdfStore(store, catalogId, infoId)], { type: "application/pdf" });
}

function astrologyPositionLabel(item) {
    return `${item.sign.name} ${Math.floor(item.degree)}°${String(Math.round((item.degree - Math.floor(item.degree)) * 60)).padStart(2, "0")}′${item.retrograde ? " ℞" : ""}`;
}

function astrologyFooter(page, chart, number, total) {
    const top = page.heightPt - 34;
    lineElement(page, 48, top - 10, page.widthPt - 48, top - 10, LINE, 0.6);
    textElement(page, `MXiao Huyền Học | ${chart.profile.name || "Người xem"}`, 48, top + 3, 8, 400, MUTED, "Artifact");
    const label = `${number}/${total}`;
    textElement(page, label, page.widthPt - 48 - measurePdfText(label, 8, 400), top + 3, 8, 400, MUTED, "Artifact");
}

function buildAstrologyCover(chart) {
    const page = newTextPage("portrait");
    page.bookmark = "Bìa báo cáo";
    rectElement(page, 0, 0, page.widthPt, page.heightPt, RED_DARK);
    textElement(page, "MXIAO HUYỀN HỌC", 54, 72, 14, 700, WHITE, "Artifact");
    textBlock(page, "BẢN ĐỒ SAO CÁ NHÂN", 54, 155, page.widthPt - 108, 34, 43, 700, WHITE, "H1");
    textElement(page, chart.profile.name || "Người xem", 54, 320, 22, 700, WHITE, "H2");
    const meta = [
        `Ngày sinh: ${chart.profile.birthDate}`,
        `Giờ sinh: ${chart.profile.birthTimeLocal || "Không biết giờ sinh"}`,
        `Nơi sinh: ${chart.profile.birthPlaceLabel}`,
        `Hoàng đạo: Tropical`,
        `Hệ thống Nhà: ${chart.settings.houseSystem ? chart.settings.houseSystem.replace("whole_sign", "Whole Sign").replace("equal", "Equal House").replace("placidus", "Placidus") : "Không áp dụng"}`
    ];
    meta.forEach((line, index) => textElement(page, line, 54, 400 + index * 27, 11, 400, WHITE));
    rectElement(page, 54, 600, page.widthPt - 108, 118, "#8d1019", "#d6747d", 0.8);
    textBlock(page, "Chiêm tinh Tây phương", 72, 622, page.widthPt - 144, 11, 17, 700, WHITE);
    textBlock(page, "Nội dung tham khảo và tự chiêm nghiệm.", 72, 674, page.widthPt - 144, 9, 14, 400, WHITE);
    return page;
}

function astrologyOverviewParagraphs(chart) {
    const sun = chart.planets.find((item) => item.id === "sun");
    const moon = chart.planets.find((item) => item.id === "moon");
    const result = [];
    if (sun && moon) result.push(`Mặt Trời ở ${sun.sign.name} và Mặt Trăng ở ${moon.sign.name} tạo nên sự kết hợp giữa ý thức bản thân và nhu cầu cảm xúc.`);
    if (chart.angles) {
        const asc = chart.planets.length && chart.angles.asc;
        const ascPosition = asc == null ? null : { signIndex: Math.floor(((asc % 360) + 360) % 360 / 30) };
        const signNames = ["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải","Sư Tử","Xử Nữ","Thiên Bình","Bọ Cạp","Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"];
        result.push(`Cung Mọc nằm tại ${signNames[ascPosition.signIndex]}, thể hiện cách bạn tiếp cận trải nghiệm mới; Thiên Đỉnh và 12 Nhà bổ sung các lĩnh vực đời sống được nhấn mạnh.`);
    } else result.push("Giờ sinh chưa chắc chắn nên Cung Mọc, Thiên Đỉnh và 12 Nhà không xuất hiện trong báo cáo.");
    if (chart.patterns.length) result.push(`Các hành tinh tạo thành cấu trúc nổi bật: ${chart.patterns.map((item) => item.name).join(", ")}.`);
    const tight = chart.aspects.slice(0, 5);
    if (tight.length) result.push(`Các góc hợp gần nhất gồm ${tight.map((item) => `${item.aName} ${item.name.toLowerCase()} ${item.bName} (${item.orb.toFixed(2)}°)`).join("; ")}.`);
    return result;
}

function buildAstrologyOverview(chart) {
    const page = newTextPage("portrait");
    let y = selectableHeader(page, "Tổng quan Bản đồ sao", chart.status === "exact" ? "Mặt Trời, Mặt Trăng, Cung Mọc và Thiên Đỉnh" : "Các vị trí hành tinh chính");
    const sun = chart.planets.find((item) => item.id === "sun");
    const moon = chart.planets.find((item) => item.id === "moon");
    if (sun) y = addSummaryLine(page, "Mặt Trời", astrologyPositionLabel(sun), y, true);
    if (moon) y = addSummaryLine(page, "Mặt Trăng", astrologyPositionLabel(moon), y, true);
    if (chart.angles) {
        const signNames = ["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải","Sư Tử","Xử Nữ","Thiên Bình","Bọ Cạp","Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"];
        const angleLabel = (value) => `${Math.floor(((value % 30) + 30) % 30)}° ${signNames[Math.floor((((value % 360) + 360) % 360) / 30)]}`;
        y = addSummaryLine(page, "Cung Mọc", angleLabel(chart.angles.asc), y, false);
        y = addSummaryLine(page, "Thiên Đỉnh", angleLabel(chart.angles.mc), y, false);
    }
    y += 8;
    astrologyOverviewParagraphs(chart).forEach((paragraph) => { y = textBlock(page, paragraph, 48, y, page.widthPt - 96, PDF_BODY_FONT_SIZE, PDF_BODY_LINE_HEIGHT, 400, INK) + 10; });
    return page;
}

function buildAstrologyRowsPages(chart, kind) {
    const titles = { planets: "Bảng vị trí hành tinh", aspects: "Bảng góc hợp chính", houses: "12 Nhà và đường chủ tinh", balance: "Nguyên tố và tính chất" };
    let rows = [];
    if (kind === "planets") rows = chart.planets.map((item) => `${item.name}: ${astrologyPositionLabel(item)}${item.house ? `, Nhà ${item.house}` : ""}${item.stability && item.stability !== "stable" ? ` - chưa ổn định (${item.possibleSigns.join(" / ")})` : ""}`);
    if (kind === "aspects") rows = chart.aspects.map((item) => `${item.aName} ${item.name.toLowerCase()} ${item.bName} - độ lệch ${item.orb.toFixed(2)}°${item.state === "applying" ? ", đang tiến tới" : item.state === "separating" ? ", đang tách ra" : ""}`);
    if (kind === "houses") rows = chart.houses.map((house) => `Nhà ${house.number}: bắt đầu tại ${house.sign.name}; chủ tinh ${house.rulerName}${house.rulerHouse ? ` ở Nhà ${house.rulerHouse}` : ""}; ${house.planets.length ? `${house.planets.length} thiên thể trong Nhà` : "không có hành tinh, chủ đề của Nhà thể hiện qua cung và chủ tinh"}.`);
    if (kind === "balance") rows = [...Object.entries(chart.balances.element).map(([key, value]) => `Nguyên tố ${key}: ${value} hành tinh`), ...Object.entries(chart.balances.modality).map(([key, value]) => `Tính chất ${key}: ${value} hành tinh`)];
    const pages = [];
    let page = newTextPage("portrait");
    let y = selectableHeader(page, titles[kind]);
    const bottom = page.heightPt - 62;
    rows.forEach((row) => {
        const height = 18 + wrapPdfText(row, page.widthPt - 124, 11, 400).length * 16;
        if (y + height > bottom) {
            pages.push(page);
            page = newTextPage("portrait");
            y = selectableHeader(page, titles[kind], "Tiếp theo");
        }
        rectElement(page, 48, y, page.widthPt - 96, height, "#ffffff", LINE, 0.7);
        textBlock(page, row, 62, y + 9, page.widthPt - 124, 11, 16, 400, INK);
        y += height + 7;
    });
    pages.push(page);
    return pages;
}

function buildAstrologySelectablePages(chart, chartCanvas, options = {}) {
    const selected = new Set(options.sections || ["overview", "wheel", "planets", "aspects", "houses", "balance"]);
    const pages = [buildAstrologyCover(chart)];
    if (selected.has("overview")) pages.push(buildAstrologyOverview(chart));
    if (selected.has("wheel") && chartCanvas) {
        const page = newTextPage("landscape");
        page.bookmark = "Vòng Bản đồ sao";
        page.imageCanvas = chartCanvas;
        pages.push(page);
    }
    for (const kind of ["planets", "aspects", "houses", "balance"]) {
        if (selected.has(kind) && (kind !== "houses" || chart.houses.length)) pages.push(...buildAstrologyRowsPages(chart, kind));
    }
    if (pages.length > MAX_PDF_PAGES) throw new Error(`Báo cáo Bản đồ sao có ${pages.length} trang, vượt giới hạn ${MAX_PDF_PAGES} trang A4.`);
    pages.forEach((page, index) => { if (index && !page.imageCanvas) astrologyFooter(page, chart, index + 1, pages.length); });
    return pages;
}

async function downloadAstrologyPdf(chart, chartCanvas, options = {}) {
    await ensureFontsReady();
    const pages = buildAstrologySelectablePages(chart, chartCanvas, options);
    const blob = await buildSelectablePdfBlob(pages, { title: "Bản đồ sao cá nhân", author: "MXiao Huyền Học", subject: "Báo cáo Bản đồ sao cá nhân", keywords: "Bản đồ sao, Natal Chart, Chiêm tinh Tây phương" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(chart.profile.name)}-ban-do-sao.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    return pages.length;
}

module.exports = { MAX_PDF_PAGES, CANVAS_BODY_FONT_SIZE, PDF_BODY_FONT_SIZE, normalizeExportOptions, createReportPages, buildPdfBlob, downloadChartPdf, buildSelectablePdfBlob, buildAstrologySelectablePages, downloadAstrologyPdf };

global.MXiaoPdf=Object.freeze(module.exports);
})(typeof globalThis!=='undefined'?globalThis:window);
