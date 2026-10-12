"use strict";

const SYSTEMS = Object.freeze(["tu_vi", "astrology", "numerology"]);
const SOURCE_TYPES = Object.freeze(["calculation", "rule", "relationship", "fortune", "derived_validated"]);
const PROMPT_VERSION = "wp-1.0";
const CONTRACT_VERSION = "1.0";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  const text = canonicalJson(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function paragraphList(item) {
  if (Array.isArray(item?.paragraphs)) return item.paragraphs.map((entry) => cleanText(entry?.text ?? entry)).filter(Boolean);
  return cleanText(item?.body).split(/\n\s*\n/).map(cleanText).filter(Boolean);
}

function evidenceItem(system, id, topic, label, interpretation, options = {}) {
  return {
    id,
    system,
    topic,
    sourceType: options.sourceType || "derived_validated",
    label: cleanText(label),
    fact: cleanText(options.fact || label),
    interpretation: cleanText(interpretation),
    polarity: options.polarity || "mixed",
    strength: options.strength ?? 0.72,
    confidence: options.confidence || "high",
    ...(options.relatedEvidenceIds?.length ? { relatedEvidenceIds: options.relatedEvidenceIds } : {})
  };
}

function baseInput(system, evidence, scope, fingerprintSource) {
  const fingerprint = stableHash(fingerprintSource);
  return {
    reportId: `${system}-${fingerprint}`,
    system,
    subject: {},
    scope,
    evidence,
    priorityTopics: ["identity", "behavior", "work", "relationship", "development"],
    constraints: {
      maxCoreClaims: 5,
      maxStrengths: 4,
      maxTensions: 3,
      maxBehaviorPatterns: 4,
      language: "vi",
      forbidNewFacts: true,
      requireEvidenceIds: true
    }
  };
}

function topicForTuvi(topic) {
  const value = cleanText(topic).toLowerCase();
  if (value.includes("tổng quan") || value.includes("mệnh") || value.includes("thân")) return "identity";
  if (value.includes("nghiệp") || value.includes("quan")) return "work";
  if (value.includes("tình") || value.includes("phu") || value.includes("thê")) return "relationship";
  if (value.includes("tài") || value.includes("tiền")) return "resource";
  if (value.includes("vận")) return "development";
  return "behavior";
}

function tuviInput(chart) {
  const evidence = [];
  (chart?.interpretations || []).forEach((item) => {
    paragraphList(item).forEach((paragraph, index) => {
      evidence.push(evidenceItem(
        "tu_vi",
        `tuvi.${cleanText(item.id || item.title).replace(/[^a-zA-Z0-9_.-]+/g, "-").toLowerCase()}.${index + 1}`,
        topicForTuvi(item.topic),
        item.title || item.topic || "Luận giải đã xác nhận",
        paragraph,
        { sourceType: item.topic === "Vận hạn" ? "fortune" : "rule", strength: item.topic === "Tổng quan" ? 0.9 : 0.76 }
      ));
    });
  });
  const selected = evidence.slice(0, 48);
  return baseInput("tu_vi", selected, "overview", {
    calculationMethod: chart?.input?.calculationMethod,
    bureau: chart?.bureau,
    lifePalace: chart?.lifePalace,
    bodyPalace: chart?.bodyPalace,
    evidence: selected.map((item) => [item.id, item.interpretation])
  });
}

function astrologyInput(chart) {
  const evidence = [];
  (chart?.narrative?.sections || []).forEach((section) => {
    (section.paragraphs || []).forEach((entry, index) => {
      const relatedEvidenceIds = Array.isArray(entry.evidence_ids) ? entry.evidence_ids.map((id) => `astrology.source.${id}`) : [];
      evidence.push(evidenceItem(
        "astrology",
        `astrology.${section.id}.${index + 1}`,
        section.id === "summary" || section.id === "big_three" ? "identity" : section.id.replace(/^domain_/, ""),
        section.title,
        entry.text,
        { sourceType: "relationship", strength: section.id === "summary" ? 0.9 : 0.78, relatedEvidenceIds }
      ));
    });
  });
  const selected = evidence.slice(0, 48);
  return baseInput("astrology", selected, "overview", {
    engineVersion: chart?.engineVersion,
    status: chart?.status,
    narrativeVersion: chart?.narrative?.version,
    evidence: selected.map((item) => [item.id, item.interpretation])
  });
}

function numerologyInput(profile, narrative) {
  const excluded = new Set(["calculation", "year"]);
  const evidence = [];
  (narrative?.sections || []).filter((section) => !excluded.has(section.id)).forEach((section) => {
    (section.paragraphs || []).forEach((paragraph, index) => {
      evidence.push(evidenceItem(
        "numerology",
        `numerology.${section.id}.${index + 1}`,
        section.id === "overview" || section.id === "core" ? "identity" : section.id,
        section.title,
        paragraph,
        { sourceType: section.id === "bridges" ? "relationship" : "derived_validated", strength: section.id === "overview" ? 0.9 : 0.75 }
      ));
    });
  });
  const selected = evidence.slice(0, 48);
  return baseInput("numerology", selected, "overview", {
    calculationVersion: profile?.calculation_version,
    status: profile?.status,
    evidence: selected.map((item) => [item.id, item.interpretation])
  });
}

function validProfile(profile, allowedEvidenceIds) {
  if (!profile || profile.version !== CONTRACT_VERSION || !cleanText(profile.oneSentencePortrait)) return false;
  const allowed = new Set(allowedEvidenceIds);
  const groups = [
    profile.coreIdentity?.evidenceIds,
    ...(profile.dominantStrengths || []).map((item) => item.evidenceIds),
    ...(profile.coreTensions || []).flatMap((item) => [item.supportingEvidenceIds, item.conflictingEvidenceIds]),
    ...(profile.behavioralPatterns || []).map((item) => item.evidenceIds),
    ...(profile.keyClaims || []).flatMap((item) => [item.supportingEvidenceIds, item.counterEvidenceIds])
  ];
  return groups.flat().filter(Boolean).every((id) => allowed.has(id));
}

async function requestWholePerson(input, options = {}) {
  const configuredEndpoint = options.endpoint || globalThis.MXIAO_SYNTHESIS_ENDPOINT;
  const hostname = globalThis.location?.hostname || "";
  const productionHost = hostname === "mxiao.edu.vn" || hostname === "www.mxiao.edu.vn" || hostname.endsWith(".vercel.app");
  const enabled = Boolean(configuredEndpoint) || globalThis.MXIAO_SYNTHESIS_ENABLED === true || productionHost;
  if (!enabled) return null;
  const endpoint = configuredEndpoint || (productionHost ? "https://mxiao.edu.vn/api/huyen-hoc/synthesis" : "");
  if (!endpoint) return null;
  const controller = new AbortController();
  // The structured WholePersonProfile call can take close to a minute when
  // Gemini is under load; keep the client timeout aligned with the API route.
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 55000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
      credentials: "same-origin"
    });
    if (response.status === 204) return null;
    if (!response.ok) return null;
    const payload = await response.json();
    return validProfile(payload.profile, input.evidence.map((item) => item.id)) ? payload.profile : null;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function overviewContent(profile) {
  const strengths = (profile?.dominantStrengths || []).slice(0, 4).map((item) => ({
    title: item.title,
    paragraphs: [item.summary, ...(item.realLifeManifestations || []).slice(0, 2)]
  }));
  const tensions = (profile?.coreTensions || []).slice(0, 3).map((item) => ({
    title: item.title,
    paragraphs: [item.synthesis, ...(item.realLifeManifestations || []).slice(0, 2)]
  }));
  return {
    portrait: profile.oneSentencePortrait,
    identity: profile.coreIdentity.summary,
    strengths,
    tensions
  };
}

module.exports = {
  CONTRACT_VERSION,
  PROMPT_VERSION,
  SOURCE_TYPES,
  SYSTEMS,
  astrologyInput,
  canonicalJson,
  numerologyInput,
  overviewContent,
  requestWholePerson,
  stableHash,
  tuviInput,
  validProfile
};
