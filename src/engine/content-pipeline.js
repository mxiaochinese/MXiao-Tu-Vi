"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAtomicInsight = createAtomicInsight;
exports.resolveInsightConflicts = resolveInsightConflicts;
exports.synthesizeInsights = synthesizeInsights;
exports.finalizeInterpretations = finalizeInterpretations;
exports.textSimilarity = textSimilarity;

const INTERNAL_TERMS = /\b(?:ruleId|evidence|confidence|relationType|primaryPalace|supportingRuleIds|conflictingRuleIds|dataset|fixture|sourceId|profileVersion)\b/giu;
const ABSOLUTE_WORDING = [
    [/chắc chắn sẽ/giu, "có xu hướng"],
    [/bắt buộc sẽ/giu, "dễ"],
    [/không thể tránh/giu, "khó tránh hoàn toàn"],
    [/định mệnh/giu, "khuynh hướng dài hạn"]
];
const STOP_WORDS = new Set("của và là có trong tại một những các cho được với khi vào từ theo này đó nên vì về còn hơn như qua đang sẽ để hoặc giữa do trên dưới".split(" "));

function cleanSentence(value) {
    let text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text)
        return "";
    ABSOLUTE_WORDING.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
    });
    text = text.replace(INTERNAL_TERMS, "");
    text = text.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
    if (!/[.!?]$/u.test(text))
        text += ".";
    return text;
}

function normalizeTokens(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function textSimilarity(a, b) {
    const left = new Set(normalizeTokens(a));
    const right = new Set(normalizeTokens(b));
    if (!left.size || !right.size)
        return 0;
    let intersection = 0;
    left.forEach((token) => {
        if (right.has(token))
            intersection += 1;
    });
    return intersection / Math.min(left.size, right.size);
}

function createAtomicInsight(definition) {
    const insight = {
        ruleId: String(definition.ruleId || "").trim(),
        topic: String(definition.topic || "").trim(),
        polarity: definition.polarity || "neutral",
        strength: Number.isFinite(definition.strength) ? definition.strength : 1,
        confidence: ["low", "medium", "high"].includes(definition.confidence) ? definition.confidence : "medium",
        evidence: Array.isArray(definition.evidence) ? definition.evidence.filter(Boolean) : [],
        claim: cleanSentence(definition.claim),
        explanation: cleanSentence(definition.explanation),
        manifestations: (definition.manifestations || []).map(cleanSentence).filter(Boolean),
        conditions: (definition.conditions || []).map(cleanSentence).filter(Boolean),
        advice: cleanSentence(definition.advice),
        primaryPalace: definition.primaryPalace || null,
        relatedPalaces: Array.isArray(definition.relatedPalaces) ? definition.relatedPalaces.filter(Boolean) : [],
        relationType: definition.relationType || null
    };
    if (!insight.ruleId || !insight.topic || !insight.evidence.length || !insight.claim || !insight.explanation)
        throw new Error("Insight nội bộ phải có định danh, chủ đề, căn cứ, nhận định và giải thích.");
    return insight;
}

function deduplicateInsights(insights) {
    const kept = [];
    [...insights].sort((a, b) => b.strength - a.strength).forEach((insight) => {
        const duplicate = kept.some((candidate) => candidate.topic === insight.topic && textSimilarity(candidate.claim, insight.claim) >= 0.78);
        if (!duplicate)
            kept.push(insight);
    });
    return kept;
}

function resolveInsightConflicts(insights) {
    const clean = deduplicateInsights(insights);
    const supportive = clean.filter((item) => item.polarity === "supportive");
    const challenging = clean.filter((item) => item.polarity === "challenging");
    const other = clean.filter((item) => !["supportive", "challenging"].includes(item.polarity));
    if (!supportive.length || !challenging.length)
        return clean;
    const support = supportive[0];
    const challenge = challenging[0];
    const mixed = createAtomicInsight({
        ruleId: `${support.ruleId}+${challenge.ruleId}`,
        topic: support.topic,
        polarity: "mixed",
        strength: Math.max(support.strength, challenge.strength) + 0.25,
        confidence: support.confidence === "high" && challenge.confidence === "high" ? "high" : "medium",
        evidence: [...support.evidence, ...challenge.evidence],
        claim: `${support.claim.replace(/[.!?]+$/u, "")}, nhưng ${challenge.claim.charAt(0).toLowerCase()}${challenge.claim.slice(1)}`,
        explanation: `${support.explanation} Ở chiều ngược lại, ${challenge.explanation}`,
        manifestations: [...support.manifestations, ...challenge.manifestations],
        conditions: [...support.conditions, ...challenge.conditions],
        advice: support.advice || challenge.advice,
        primaryPalace: support.primaryPalace || challenge.primaryPalace,
        relatedPalaces: [...new Set([...support.relatedPalaces, ...challenge.relatedPalaces])],
        relationType: support.relationType || challenge.relationType
    });
    return [mixed, ...other, ...supportive.slice(1), ...challenging.slice(1)];
}

function joinSentences(parts) {
    const sentences = [];
    parts.flat().filter(Boolean).forEach((part) => {
        const clean = cleanSentence(part);
        if (!clean)
            return;
        if (!sentences.some((existing) => textSimilarity(existing, clean) >= 0.82))
            sentences.push(clean);
    });
    return sentences.join(" ");
}

function synthesizeInsights(insights, options = {}) {
    const maxParagraphs = options.maxParagraphs || 3;
    const confidenceRank = { high: 3, medium: 2, low: 1 };
    const resolved = resolveInsightConflicts(insights)
        .sort((a, b) => confidenceRank[b.confidence] - confidenceRank[a.confidence] || b.strength - a.strength)
        .slice(0, maxParagraphs);
    return resolved.map((insight, index) => {
        const manifestation = insight.polarity === "mixed" && insight.manifestations.length > 1
            ? joinSentences([insight.manifestations[0], insight.manifestations[insight.manifestations.length - 1]])
            : insight.manifestations[index % Math.max(1, insight.manifestations.length)] || insight.manifestations[0];
        const condition = insight.polarity === "mixed" && insight.conditions.length > 1
            ? joinSentences([insight.conditions[0], insight.conditions[insight.conditions.length - 1]])
            : insight.conditions[index % Math.max(1, insight.conditions.length)] || insight.conditions[0];
        const conditionLeads = ["Xu hướng này rõ hơn khi", "Mặt biểu hiện còn phụ thuộc việc", "Độ ổn định thay đổi khi"];
        const conditionBody = String(condition || "").replace(/[.!?]+$/u, "");
        const conditionText = !conditionBody
            ? ""
            : /^(?:mặt|khả năng|đây|ảnh hưởng|lớp|sự|tứ hóa|khi|nếu)/iu.test(conditionBody)
                ? `${conditionBody.charAt(0).toUpperCase()}${conditionBody.slice(1)}`
                : `${conditionLeads[index % conditionLeads.length]} ${conditionBody.charAt(0).toLowerCase()}${conditionBody.slice(1)}`;
        return joinSentences([
            insight.claim,
            insight.explanation,
            manifestation,
            conditionText,
            insight.advice
        ]);
    }).filter(Boolean);
}

function splitSentences(paragraph) {
    return String(paragraph || "").match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || [];
}

function variedOpening(paragraph, index) {
    const replacements = [
        ["Cung ", "Xét về "],
        ["Trong ", "Ở lớp "],
        ["Điều này ", "Từ đó, "],
        ["Vì vậy, ", "Theo cấu trúc này, "]
    ];
    if (index % 3 === 0)
        return paragraph;
    const [from, to] = replacements[index % replacements.length];
    return paragraph.startsWith(from) ? `${to}${paragraph.slice(from.length)}` : paragraph;
}

function finalizeInterpretations(items) {
    const seenParagraphs = [];
    let paragraphIndex = 0;
    return items.map((item) => {
        const paragraphs = [];
        (item.paragraphs || []).forEach((paragraph) => {
            const kept = [];
            const localSentences = [];
            splitSentences(cleanSentence(paragraph)).forEach((sentence) => {
                const clean = cleanSentence(sentence);
                const duplicate = localSentences.some((existing) => {
                    const ratio = Math.min(existing.length, clean.length) / Math.max(existing.length, clean.length);
                    return ratio >= 0.82 && textSimilarity(existing, clean) >= 0.96;
                });
                if (!duplicate) {
                    kept.push(clean);
                    localSentences.push(clean);
                }
            });
            const combined = variedOpening(kept.join(" "), paragraphIndex++).trim();
            const repeatedParagraph = !/\d+\s*[-–]\s*\d+\s+tuổi/u.test(combined) && seenParagraphs.some((existing) => {
                const ratio = Math.min(existing.length, combined.length) / Math.max(existing.length, combined.length);
                return ratio >= 0.85 && textSimilarity(existing, combined) >= 0.96;
            });
            if (combined.length >= 70 && !repeatedParagraph) {
                paragraphs.push(combined);
                seenParagraphs.push(combined);
            }
        });
        if (!paragraphs.length && item.paragraphs?.length) {
            const fallback = cleanSentence(`${item.title} được đặt trong chủ đề ${item.topic}. ${item.paragraphs[0]}`);
            paragraphs.push(fallback);
            seenParagraphs.push(fallback);
        }
        return { id: item.id, topic: item.topic, title: item.title, paragraphs, body: paragraphs.join("\n\n") };
    });
}
