"use strict";

const NARRATIVE_VERSION = "mxiao-astrology-narrative-1.7.0";

const DOMAIN_BODIES = {
  self: ["sun", "moon"],
  communication: ["mercury", "jupiter", "saturn"],
  love: ["moon", "venus", "mars", "saturn", "uranus", "neptune", "pluto"],
  career: ["sun", "saturn", "jupiter"],
  money: ["venus", "jupiter", "saturn"],
  family: ["moon", "saturn"],
  growth: ["jupiter", "saturn", "north_node", "south_node"],
  social: ["jupiter", "uranus"]
};

const DOMAIN_HOUSES = {
  self: [1], communication: [3, 9], love: [5, 7], career: [2, 6, 10],
  money: [2, 8], family: [4], growth: [9, 12], social: [11]
};

const DEFAULT_DOMAINS = ["love", "career", "communication", "family", "money"];

const DOMAIN_PLAN = {
  love: {
    title: "Tình cảm và sự gắn bó",
    bodies: ["moon", "venus", "mars", "saturn"],
    houses: [5, 7],
    lead: "Đời sống tình cảm được tạo bởi nhiều nhịp khác nhau: cách cần được gần gũi, cách trao tình cảm và cách chủ động khi có hấp dẫn.",
    focus: "độ tin cậy, khoảng tự do và cách hai người duy trì đối thoại"
  },
  career: {
    title: "Công việc và vai trò xã hội",
    bodies: ["sun", "mercury", "mars", "jupiter", "saturn"],
    houses: [2, 6, 10],
    lead: "Công việc phù hợp phụ thuộc vào loại vấn đề được giải quyết, quyền chịu trách nhiệm và tiêu chuẩn bạn có thể thực sự làm chủ. Tên nghề chỉ là lớp mô tả bên ngoài.",
    focus: "môi trường làm việc, dạng nhiệm vụ và mức tự chủ"
  },
  communication: {
    title: "Tư duy, học tập và giao tiếp",
    bodies: ["mercury", "moon", "jupiter", "saturn"],
    houses: [3, 9],
    lead: "Cách tư duy hiện ra rõ nhất ở nhịp thu nhận thông tin, cách sắp xếp ý và thời điểm bạn thấy một kết luận đã đủ chắc để nói ra.",
    focus: "khả năng học, trao đổi và chuyển một ý tưởng thành lời rõ ràng"
  },
  family: {
    title: "Gia đình và nền tảng riêng tư",
    bodies: ["moon", "venus", "saturn"],
    houses: [4],
    lead: "Không gian riêng tư cho thấy điều gì giúp bạn hạ nhịp, lấy lại cảm giác thuộc về và thôi phải giữ vai trò bên ngoài.",
    focus: "nhu cầu an toàn, ranh giới riêng và cách hồi phục"
  },
  money: {
    title: "Tiền bạc, nguồn lực và giá trị cá nhân",
    bodies: ["venus", "jupiter", "saturn"],
    houses: [2, 8],
    lead: "Câu chuyện nguồn lực nằm ở cách bạn nhận ra giá trị, quyết định điều gì đáng đầu tư và phân biệt nền tảng bền với thuận lợi nhất thời.",
    focus: "cách tạo, giữ, chia sẻ và định giá nguồn lực"
  }
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lowerFirst(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function joinNatural(values) {
  const items = unique(values);
  if (items.length < 2) return items[0] || "";
  if (items.length === 2) return `${items[0]} và ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} và ${items.at(-1)}`;
}

function signKey(item) {
  return String(item?.sign?.english || "").toLowerCase().replace(/\s+/g, "_");
}

function corpusIndex(corpus) {
  return {
    signs: new Map((corpus?.planet_in_sign || []).map((item) => [`${item.planet}:${item.sign}`, item])),
    houses: new Map((corpus?.planet_in_house || []).map((item) => [`${item.planet}:${item.house}`, item])),
    pairs: new Map((corpus?.planet_pair_dynamics || []).flatMap((item) => [
      [`${item.planet_a}:${item.planet_b}`, item], [`${item.planet_b}:${item.planet_a}`, item]
    ])),
    aspects: new Map((corpus?.aspect_operators || []).map((item) => [item.aspect, item])),
    domains: corpus?.domain_synthesis || {},
    blueprint: corpus?.report_blueprint || []
  };
}

function domainsFor(bodyId, houseNumber) {
  return Object.keys(DOMAIN_BODIES).filter((domain) =>
    DOMAIN_BODIES[domain].includes(bodyId) || DOMAIN_HOUSES[domain].includes(houseNumber)
  );
}

function aspectSignificance(aspect, planetMap, chartRulerId) {
  const a = planetMap.get(aspect.a);
  const b = planetMap.get(aspect.b);
  let score = 0;
  if ([a, b].some((item) => item?.tier === "luminary")) score += 3;
  if ([a, b].some((item) => item?.tier === "personal")) score += 2;
  if ([aspect.a, aspect.b].includes(chartRulerId)) score += 2;
  if (aspect.orb <= 1) score += 2;
  else if (aspect.orb <= 3) score += 1;
  if (a?.tier === "outer" && b?.tier === "outer") score -= 3;
  if ([a?.tier, b?.tier].includes("social") && [a?.tier, b?.tier].includes("outer")) score -= 2;
  return score;
}

function createEvidence(chart) {
  const planetMap = new Map(chart.planets.map((item) => [item.id, item]));
  const ascSign = chart.angles ? chart.signPosition(chart.angles.asc).sign : null;
  const chartRulerId = ascSign?.ruler || null;
  const evidence = [];

  chart.planets.forEach((planet) => {
    const isNode = planet.id === "north_node" || planet.id === "south_node";
    const rootId = isNode ? "secondary:lunar_node_axis" : `placement:${planet.id}`;
    evidence.push({
      id: `${rootId}:${planet.id}`,
      evidence_root_id: rootId,
      derived_from: planet.id === "south_node" ? "placement:north_node" : null,
      dependency_group: rootId,
      independence_key: rootId,
      evidence_class: isNode ? "secondary_axis" : "placement_state",
      bodies: [planet.id],
      houses: planet.house ? [planet.house] : [],
      domains: domainsFor(planet.id, planet.house),
      significance: planet.tier === "luminary" ? 3 : planet.tier === "personal" ? 2 : planet.id === chartRulerId ? 2 : planet.tier === "outer" ? -1 : 1,
      stable: !planet.stability || planet.stability === "stable"
    });
  });

  chart.aspects.forEach((aspect) => {
    const relation = [aspect.a, aspect.b].sort().join(":");
    const angleRelation = [aspect.a, aspect.b].some((id) => id === "asc" || id === "mc");
    const bodyDomains = unique([
      ...domainsFor(aspect.a, planetMap.get(aspect.a)?.house),
      ...domainsFor(aspect.b, planetMap.get(aspect.b)?.house)
    ]);
    const rootId = `${angleRelation ? "angle" : "aspect"}:${relation}:${aspect.id}`;
    evidence.push({
      id: rootId,
      evidence_root_id: rootId,
      derived_from: null,
      dependency_group: aspect.patternDependencyGroup || rootId,
      independence_key: aspect.patternDependencyGroup || rootId,
      evidence_class: angleRelation ? "angle_proximity" : "aspect_relation",
      bodies: [aspect.a, aspect.b],
      houses: unique([planetMap.get(aspect.a)?.house, planetMap.get(aspect.b)?.house]),
      domains: bodyDomains,
      significance: aspectSignificance(aspect, planetMap, chartRulerId),
      stable: true
    });
  });

  (chart.houseRulerGraph?.edges || []).forEach((edge) => {
    const rootId = `ruler:house_${edge.from}:house_${edge.to}`;
    evidence.push({
      id: rootId,
      evidence_root_id: rootId,
      derived_from: `placement:${edge.rulerId}`,
      dependency_group: edge.cycleId || rootId,
      independence_key: edge.cycleId || rootId,
      evidence_class: "house_ruler_relation",
      bodies: [edge.rulerId],
      houses: [edge.from, edge.to],
      domains: unique([...domainsFor(edge.rulerId, edge.from), ...domainsFor(edge.rulerId, edge.to)]),
      significance: DOMAIN_HOUSES.career.includes(edge.from) || DOMAIN_HOUSES.love.includes(edge.from) ? 2 : 1,
      stable: true
    });
  });

  chart.patterns.forEach((pattern) => {
    const rootId = `pattern:${pattern.id}`;
    const dependencyGroup = pattern.dependencyGroup || rootId;
    evidence.push({
      id: rootId,
      evidence_root_id: rootId,
      derived_from: pattern.members.map((id) => `placement:${id}`),
      dependency_group: dependencyGroup,
      independence_key: dependencyGroup,
      evidence_class: "aspect_pattern",
      bodies: pattern.members,
      houses: unique(pattern.members.map((id) => planetMap.get(id)?.house)),
      domains: unique(pattern.members.flatMap((id) => domainsFor(id, planetMap.get(id)?.house))),
      significance: pattern.priority === "high" ? 4 : 1,
      stable: true
    });
  });

  evidence.push({
    id: "balance:element_modality",
    evidence_root_id: "balance:element_modality",
    derived_from: chart.planets.filter((item) => !["north_node", "south_node"].includes(item.id)).map((item) => `placement:${item.id}`),
    dependency_group: "balance:element_modality",
    independence_key: "balance:element_modality",
    evidence_class: "element_modality_balance",
    bodies: [], houses: [], domains: ["self"], significance: 1, stable: true
  });
  return { evidence, planetMap, chartRulerId };
}

function supportFor(evidence, domain, limit = 5) {
  const selected = evidence
    .filter((item) => item.stable && item.domains.includes(domain))
    .sort((a, b) => b.significance - a.significance);
  const groups = new Set();
  const output = [];
  for (const item of selected) {
    if (groups.has(item.independence_key)) continue;
    groups.add(item.independence_key);
    output.push(item);
    if (output.length >= limit) break;
  }
  return output;
}

function confidenceTag(items) {
  const roots = unique(items.map((item) => item.independence_key)).length;
  const families = unique(items.map((item) => item.evidence_class)).length;
  if (roots >= 3 && families >= 2) return "strong";
  if (roots >= 2 && families >= 2) return "moderate";
  return "limited";
}

function paragraph(text, items) {
  return {
    text: String(text || "").replace(/[–—]/g, ",").replace(/\s+/g, " ").trim(),
    evidence_ids: unique(items.map((item) => item.id)),
    confidence_tag: confidenceTag(items)
  };
}

function planetSemantics(index, planet) {
  return index.signs.get(`${planet.id}:${signKey(planet)}`)?.writer_semantics || null;
}

function houseSemantics(index, planet) {
  return planet?.house ? index.houses.get(`${planet.id}:${planet.house}`)?.writer_semantics || null : null;
}

function mainPersonalAspect(chart, ids = [], requireBoth = false) {
  return chart.aspects
    .filter((item) => !["asc", "mc", "north_node", "south_node"].includes(item.a) && !["asc", "mc", "north_node", "south_node"].includes(item.b))
    .filter((item) => !ids.length || (requireBoth ? ids.includes(item.a) && ids.includes(item.b) : ids.includes(item.a) || ids.includes(item.b)))
    .sort((a, b) => (b.significance ?? 0) - (a.significance ?? 0) || a.orb - b.orb)[0] || null;
}

function aspectSentence(aspect, index) {
  if (!aspect) return "";
  const pair = index.pairs.get(`${aspect.a}:${aspect.b}`);
  const operation = index.aspects.get(aspect.id);
  const axis = pair?.axis || `chức năng của ${aspect.aName} và ${aspect.bName}`;
  const operationText = String(operation?.operator || "cần được đọc trong mối liên hệ với nhau").replace(/^hai chức năng/i, "hai phương diện");
  const qualifier = aspect.outOfSign ? " Dù nằm ở hai kiểu biểu hiện khác nhau, quan hệ hình học này vẫn còn trong biên độ được xét." : "";
  return `${aspect.aName} tạo ${lowerFirst(aspect.name)} với ${aspect.bName}; với ${axis}, ${lowerFirst(operationText)}.${qualifier}`;
}

function rulerLinkSentence(chart, houseNumber) {
  const edge = chart.houseRulerGraph?.edges?.find((item) => item.from === houseNumber);
  if (!edge) return "";
  if (edge.from === edge.to) return `Chủ tinh Nhà ${edge.from} cũng nằm tại chính Nhà này, làm chủ đề của Nhà ${edge.from} tập trung rõ nhưng không vì thế được nhân lên thành một kết luận tuyệt đối.`;
  const cycle = chart.houseRulerGraph.cycles.find((item) => item.id === edge.cycleId);
  if (cycle) return `Đường chủ tinh tạo liên hệ qua lại giữa Nhà ${joinNatural(cycle.houses.map(String))}; các lĩnh vực này thường cần được xem như một mạch chung thay vì tách riêng.`;
  return `Chủ tinh Nhà ${edge.from} nằm ở Nhà ${edge.to}, nối cách xử lý chủ đề Nhà ${edge.from} với trải nghiệm của Nhà ${edge.to}.`;
}

function buildSummary(chart, index, evidence, planetMap, chartRulerId) {
  const sun = planetMap.get("sun");
  const moon = planetMap.get("moon");
  const asc = chart.angles ? chart.signPosition(chart.angles.asc) : null;
  const sunStyle = planetSemantics(index, sun)?.sign_style;
  const moonStyle = planetSemantics(index, moon)?.sign_style;
  const selfSupport = supportFor(evidence, "self", 5);
  const paragraphs = [];
  const moonConditional = moon?.stability && moon.stability !== "stable";
  const opening = asc
    ? `Lá số cho thấy một cách vận hành vừa ${sunStyle || "chủ động theo hướng riêng"}, vừa cần nhịp cảm xúc ${moonStyle || "phù hợp với cảm giác an toàn"}. Cung Mọc ${asc.sign.name} bổ sung cách tiếp cận ban đầu mang màu sắc ${lowerFirst(index.signs.get(`sun:${String(asc.sign.english || "").toLowerCase()}`)?.writer_semantics?.sign_style || asc.sign.modality.toLowerCase())}. Ba lớp này không phải ba chân dung tách rời: chúng mô tả điều bạn muốn xây dựng, cách bạn phản ứng và cách bạn bước vào hoàn cảnh mới.`
    : `Lá số theo ngày sinh cho thấy ý thức bản thân có xu hướng ${sunStyle || "đi theo một hướng riêng"}, trong khi nhịp cảm xúc ${moonConditional ? "có thể thay đổi theo thời điểm sinh trong ngày" : `thiên về cách phản ứng ${moonStyle || "gắn với cảm giác an toàn"}`}. Vì chưa có giờ sinh chắc chắn, phần đọc chính không suy diễn Cung Mọc, Thiên Đỉnh hoặc 12 Nhà.`;
  paragraphs.push(paragraph(opening, selfSupport));

  const topAspects = chart.aspects
    .filter((item) => !["asc", "mc", "north_node"].includes(item.a) && !["asc", "mc", "north_node"].includes(item.b))
    .sort((a, b) => b.significance - a.significance || a.orb - b.orb)
    .slice(0, 2);
  if (topAspects.length) {
    const items = evidence.filter((item) => topAspects.some((aspect) => item.id === `aspect:${[aspect.a, aspect.b].sort().join(":")}:${aspect.id}`));
    const themes = topAspects.map((item) => index.pairs.get(`${item.a}:${item.b}`)?.axis || `${item.aName} và ${item.bName}`);
    const resources = topAspects.map((item) => index.aspects.get(item.id)?.resource).filter(Boolean);
    paragraphs.push(paragraph(`Hai mạch nổi bật liên quan đến ${joinNatural(themes)}. Chúng có thể tạo nguồn lực về ${joinNatural(resources)}, đồng thời yêu cầu bạn nhận ra lúc các chức năng đang hỗ trợ nhau và lúc chúng đang tranh cùng một nhịp. Đây là định hướng để quan sát xuyên suốt nhiều lĩnh vực, không phải lời khẳng định về một sự kiện sẽ xảy ra.`, [...selfSupport, ...items]));
  }

  if (chart.patterns.length || chartRulerId) {
    const chartRuler = planetMap.get(chartRulerId);
    const patternText = chart.patterns.length ? `Cấu trúc ${chart.patterns.slice(0, 2).map((item) => item.name).join(" và ")} làm một số chủ đề lặp lại rõ hơn.` : "";
    const rulerText = chartRuler ? `Chủ tinh Cung Mọc là ${chartRuler.name}, nằm ở ${chartRuler.sign.name}${chartRuler.house ? ` tại Nhà ${chartRuler.house}` : ""}; vị trí này giúp xác định nơi cách tiếp cận ban đầu dễ được đưa vào hành động.` : "";
    paragraphs.push(paragraph(`${patternText} ${rulerText}`, supportFor(evidence, "self", 6)));
  }
  return { id: "summary", title: "Tổng quan lá số", paragraphs };
}

function buildBigThree(chart, index, evidence, planetMap) {
  const sun = planetMap.get("sun");
  const moon = planetMap.get("moon");
  const asc = chart.angles ? chart.signPosition(chart.angles.asc) : null;
  const items = supportFor(evidence, "self", 6);
  const sunSem = planetSemantics(index, sun);
  const moonSem = planetSemantics(index, moon);
  const paragraphs = [];
  if (sunSem) paragraphs.push(paragraph(`Hướng tự biểu đạt của bạn thường đi qua cách ${sunSem.sign_style}. Khi được dùng có chủ đích, nhịp này hỗ trợ khả năng ${sunSem.constructive_style}; điểm cần quan sát là xu hướng ${sunSem.risk_style}.`, items));
  if (moonSem) {
    const conditional = moon.stability && moon.stability !== "stable";
    paragraphs.push(paragraph(`${conditional ? "Vị trí Mặt Trăng thay đổi trong khoảng giờ được khảo sát, nên mô tả sau chỉ là khả năng: " : "Ở lớp phản ứng cảm xúc, "}${lowerFirst(moonSem.sign_style)} thường giúp bạn nhận ra điều gì tạo cảm giác an toàn. Mặt thuận là ${moonSem.constructive_style}; khi chịu sức ép, có thể xuất hiện khuynh hướng ${moonSem.risk_style}.`, items));
  }
  if (asc) {
    const ruler = planetMap.get(asc.sign.ruler);
    paragraphs.push(paragraph(`Cung Mọc ${asc.sign.name} cho thấy bạn thường bước vào hoàn cảnh mới theo nhịp ${asc.sign.modality.toLowerCase()} và dùng phẩm chất ${asc.sign.element.toLowerCase()} để định vị mình. Chủ tinh ${ruler?.name || asc.sign.ruler}${ruler?.house ? ` ở Nhà ${ruler.house}` : ""} cho biết cách khởi đầu này dễ tập trung vào ${lowerFirst(houseSemantics(index, ruler)?.house_arena || "lĩnh vực mà chủ tinh đang hiện diện")}.`, items));
  }
  const relation = chart.aspects.find((item) => [item.a, item.b].includes("sun") && [item.a, item.b].includes("moon"));
  paragraphs.push(paragraph(`${relation ? aspectSentence(relation, index) : "Mặt Trời và Mặt Trăng không tạo góc hợp chính đủ gần, nên sự phối hợp giữa ý hướng và cảm xúc được thể hiện qua các liên hệ khác trong lá số."} Điều hữu ích là quan sát lúc cách hành động, nhu cầu an toàn và ấn tượng ban đầu cùng hướng về một mục tiêu, cũng như lúc một lớp cần điều chỉnh để hai lớp còn lại có chỗ vận hành.`, items));
  return { id: "big_three", title: asc ? "Ba trụ cột: Mặt Trời, Mặt Trăng và Cung Mọc" : "Mặt Trời và Mặt Trăng", paragraphs };
}

function buildCoreDynamics(chart, index, evidence) {
  const top = chart.aspects
    .filter((item) => !["asc", "mc", "north_node"].includes(item.a) && !["asc", "mc", "north_node"].includes(item.b))
    .sort((a, b) => b.significance - a.significance || a.orb - b.orb)
    .slice(0, 3);
  const paragraphs = [];
  if (top.length) {
    const sentences = top.map((item) => aspectSentence(item, index));
    paragraphs.push(paragraph(`${sentences.join(" ")} Khi đọc cùng nhau, các góc này cho thấy những chức năng nào hỗ trợ nhau tự nhiên và những chức năng nào cần học cách nhường nhịp.`, evidence.filter((item) => top.some((aspect) => item.bodies.includes(aspect.a) && item.bodies.includes(aspect.b))).slice(0, 6)));
  }
  if (chart.patterns.length) {
    const patterns = chart.patterns.filter((item) => item.priority === "high").slice(0, 3);
    if (patterns.length) paragraphs.push(paragraph(`${patterns.map((item) => item.name).join(" và ")} cho thấy một chủ đề có thể xuất hiện ở nhiều bối cảnh. Ý nghĩa cụ thể vẫn cần được đọc qua cách từng hành tinh phối hợp và lĩnh vực đời sống nơi chúng biểu hiện.`, evidence.filter((item) => patterns.some((pattern) => item.id === `pattern:${pattern.id}`))));
  }
  if (chart.houseRulerGraph?.cycles?.length) {
    const cycle = chart.houseRulerGraph.cycles[0];
    const text = cycle.houses.length === 1
      ? `Chủ tinh Nhà ${cycle.houses[0]} trở về chính Nhà này, làm lĩnh vực đó có tính tập trung cao. Điều đáng quan sát là cả khả năng đào sâu lẫn xu hướng khép kín trong cùng một chủ đề.`
      : `Đường chủ tinh tạo một mạch qua lại giữa Nhà ${joinNatural(cycle.houses.map(String))}. Các lĩnh vực này gắn kết với nhau: thay đổi ở một phía thường làm phía kia cần sắp xếp lại cách vận hành.`;
    paragraphs.push(paragraph(text, evidence.filter((item) => item.dependency_group === cycle.id)));
  }
  if (!paragraphs.length) paragraphs.push(paragraph("Không có một cấu hình đơn lẻ đủ mạnh để lấn át toàn bộ lá số. Cách đọc phù hợp hơn là theo dõi các chủ đề vừa phải lặp lại ở nhiều phần, thay vì cố tìm một nhãn bao trùm.", supportFor(evidence, "self", 3)));
  return { id: "core_dynamics", title: "Những cấu trúc nổi bật", paragraphs };
}

function domainText(domain, chart, index, planetMap) {
  const p = (id) => planetMap.get(id);
  const style = (id) => planetSemantics(index, p(id))?.sign_style || "linh hoạt theo hoàn cảnh";
  const aspect = mainPersonalAspect(chart, DOMAIN_BODIES[domain], domain === "love");
  const aspectText = aspect ? ` ${aspectSentence(aspect, index)}` : "";
  if (domain === "love") return `Trong sự gắn bó, nhu cầu cảm xúc thiên về cách ${style("moon")}, trong khi cách trao nhận tình cảm thường mang nhịp ${style("venus")} và động lực chủ động mang màu sắc ${style("mars")}. Ba lớp này cần được phối hợp theo tình huống, vì không lớp nào tự nó quyết định kiểu quan hệ của bạn.${aspectText} ${rulerLinkSentence(chart, 7)}`;
  if (domain === "career") {
    const mc = chart.angles ? chart.signPosition(chart.angles.mc).sign.name : null;
    return `${mc ? `Thiên Đỉnh ${mc} mô tả cách vai trò xã hội dễ được nhận diện, còn Nhà 10 cho biết cấu trúc lĩnh vực sự nghiệp theo hệ Nhà đã chọn.` : "Do chưa có giờ sinh chắc chắn, phần này chỉ đọc phong cách làm việc từ các hành tinh ổn định và không suy ra Nhà 10 hoặc Thiên Đỉnh."} Điều đáng chú ý là môi trường, dạng nhiệm vụ và mức tự chủ phù hợp, không phải một chức danh nghề nghiệp cố định.${aspectText} ${rulerLinkSentence(chart, 10)}`;
  }
  if (domain === "communication") return `Tư duy và giao tiếp có xu hướng ${style("mercury")}. Cách xử lý thông tin này phát huy tốt khi bạn có đủ khoảng trống để sắp xếp ý, kiểm tra điều mình muốn nói và điều chỉnh nhịp theo người đối diện.${aspectText} ${rulerLinkSentence(chart, 3)}`;
  if (domain === "family") return `Trong nền tảng riêng tư, nhịp ${style("moon")} cho thấy cách bạn tìm cảm giác an toàn và hồi phục. Phần đọc này mô tả nhu cầu và cách phản ứng, không suy diễn thành một sự kiện tuổi thơ hay kết luận về thành viên gia đình.${aspectText} ${rulerLinkSentence(chart, 4)}`;
  if (domain === "money") return `Với tiền bạc và nguồn lực, trọng tâm là cách tạo, giữ và chia sẻ những gì có giá trị, chứ không phải dự đoán giàu nghèo. Nhịp ${style("venus")} cho biết cách bạn nhận diện giá trị, còn các liên hệ với Sao Mộc hoặc Sao Thổ giúp thấy lúc nào cần mở rộng và lúc nào cần đặt giới hạn.${aspectText} ${rulerLinkSentence(chart, 2)} ${rulerLinkSentence(chart, 8)}`;
  return "";
}

function buildDomains(chart, index, evidence, planetMap) {
  return DEFAULT_DOMAINS.map((domain) => {
    const support = supportFor(evidence, domain, 6);
    const title = index.domains[domain]?.vi || domain;
    return { id: `domain_${domain}`, title, paragraphs: [paragraph(domainText(domain, chart, index, planetMap), support)] };
  });
}

function buildDevelopment(chart, index, evidence) {
  const tension = chart.aspects
    .filter((item) => item.id === "square" || item.id === "opposition")
    .filter((item) => !["north_node", "south_node", "asc", "mc"].includes(item.a) && !["north_node", "south_node", "asc", "mc"].includes(item.b))
    .sort((a, b) => b.significance - a.significance || a.orb - b.orb)
    .slice(0, 2);
  const flow = chart.aspects
    .filter((item) => item.id === "trine" || item.id === "sextile")
    .filter((item) => !["north_node", "south_node", "asc", "mc"].includes(item.a) && !["north_node", "south_node", "asc", "mc"].includes(item.b))
    .sort((a, b) => b.significance - a.significance || a.orb - b.orb)[0];
  const items = evidence.filter((item) => [...tension, flow].filter(Boolean).some((aspect) => item.bodies.includes(aspect.a) && item.bodies.includes(aspect.b))).slice(0, 6);
  const tensionText = tension.length
    ? `Điểm phát triển rõ nhất nằm ở cách điều phối các mạch ${tension.map((item) => index.pairs.get(`${item.a}:${item.b}`)?.axis || `${item.aName} và ${item.bName}`).join("; ")}. Các góc căng cho thấy hai phía cùng cần có chỗ vận hành. Việc nhận ra thời điểm, giới hạn và cách chuyển nhịp phù hợp quan trọng hơn cố loại bỏ một phía.`
    : "Lá số không tạo một lực kéo căng đủ rõ để gán thành bài toán trung tâm. Hướng phát triển phù hợp hơn là nhận ra lúc một thế mạnh quen thuộc đang được dùng quá tự động và thử mở thêm một cách phản ứng khác.";
  const resourceText = flow ? `Nguồn hỗ trợ có thể đến từ ${index.pairs.get(`${flow.a}:${flow.b}`)?.axis || `${flow.aName} và ${flow.bName}`}, vì ${lowerFirst(index.aspects.get(flow.id)?.operator || "hai chức năng có khả năng phối hợp")}. Khi được dùng có ý thức, mạch thuận này giúp bạn xử lý phần căng mà không biến việc phát triển thành tự phê bình.` : "Việc phát triển nên dựa trên quan sát lặp lại trong đời sống thực, không trên một nhãn cố định từ lá số.";
  return { id: "development", title: "Điểm phát triển và cách tích hợp", paragraphs: [paragraph(tensionText, items), paragraph(resourceText, items)] };
}

function planetLabel(planet) {
  if (!planet) return "";
  return `${planet.name} ${planet.sign.name}${planet.house ? ` ở Nhà ${planet.house}` : ""}`;
}

function relevantAspects(chart, bodyIds, modes = null) {
  return chart.aspects
    .filter((item) => bodyIds.includes(item.a) || bodyIds.includes(item.b))
    .filter((item) => !["asc", "mc", "north_node", "south_node"].includes(item.a) && !["asc", "mc", "north_node", "south_node"].includes(item.b))
    .filter((item) => !modes || modes.includes(item.id))
    .sort((a, b) => (b.significance ?? 0) - (a.significance ?? 0) || a.orb - b.orb);
}

function evidenceForAspects(evidence, aspects, fallback = []) {
  const selected = evidence.filter((item) => aspects.some((aspect) =>
    item.evidence_class === "aspect_relation" && item.bodies.includes(aspect.a) && item.bodies.includes(aspect.b)
  ));
  return selected.length ? unique([...fallback, ...selected]) : fallback;
}

function evidenceObjects(items) {
  const byId = new Map();
  items.flat().filter(Boolean).forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

function semanticFor(index, planet) {
  return {
    sign: planetSemantics(index, planet) || {},
    house: houseSemantics(index, planet) || {}
  };
}

function aspectDetail(aspect, index, emphasis = "balanced") {
  if (!aspect) return "";
  const pair = index.pairs.get(`${aspect.a}:${aspect.b}`);
  const operation = index.aspects.get(aspect.id);
  const relation = pair?.axis || `${aspect.aName} và ${aspect.bName}`;
  const effect = emphasis === "resource" ? operation?.resource : emphasis === "tension" ? operation?.tension : operation?.operator;
  const signNote = aspect.outOfSign ? " Hai hành tinh đứng ở hai kiểu biểu hiện khác nhau, nên sự phối hợp có thêm một lớp lệch nhịp." : "";
  return `${aspect.aName} và ${aspect.bName} tạo ${lowerFirst(aspect.name)}, đưa ${relation} vào cùng một mạch. ${effect ? `${String(effect).charAt(0).toUpperCase()}${String(effect).slice(1)}.` : "Hai chức năng vì thế cần được đọc cùng nhau."}${signNote}`;
}

function aspectInContext(aspect, index, context, emphasis = "balanced", opening = "") {
  if (!aspect) return "";
  const pair = index.pairs.get(`${aspect.a}:${aspect.b}`);
  const operation = index.aspects.get(aspect.id);
  const relation = pair?.axis || `${aspect.aName} và ${aspect.bName}`;
  const effect = emphasis === "resource" ? operation?.resource : emphasis === "tension" ? operation?.tension : operation?.operator;
  const signNote = aspect.outOfSign ? " Hai cung không đi theo cùng một nhịp, nên hai chức năng có thể biểu lộ khác nhau dù vẫn liên hệ chặt." : "";
  const start = opening ? `${opening} ${aspect.aName}` : `Trong ${context}, ${aspect.aName}`;
  const effectText = effect || "hai chức năng cần được sắp nhịp theo hoàn cảnh";
  const effectSentence = emphasis === "resource"
    ? `Điểm thuận ở ${context} nằm ở ${lowerFirst(effectText)}.`
    : emphasis === "tension"
      ? `Phần dễ căng ở ${context} là ${lowerFirst(effectText)}.`
      : `${String(effectText).charAt(0).toUpperCase()}${String(effectText).slice(1)}.`;
  return `${start} ${lowerFirst(aspect.name)} ${aspect.bName} làm ${relation} trở thành một đường nối trực tiếp. ${effectSentence}${signNote}`;
}

function placementMechanism(planet, index) {
  const semantic = semanticFor(index, planet);
  const place = planetLabel(planet);
  if (!planet.house) return `${place} vận hành theo cách ${semantic.sign.sign_style || "đáp lại hoàn cảnh theo nhịp riêng"}.`;
  return `${place} đưa ${semantic.sign.planet_function || "chức năng của hành tinh"} vào ${lowerFirst(semantic.house.house_arena || `chủ đề Nhà ${planet.house}`)}. Cung ${planet.sign.name} làm chức năng ấy biểu hiện theo cách ${semantic.sign.sign_style || "phù hợp với hoàn cảnh"}.`;
}

function rulerLinkNatural(chart, houseNumber) {
  const house = chart.houses?.find((item) => item.number === houseNumber);
  const edge = chart.houseRulerGraph?.edges?.find((item) => item.from === houseNumber);
  if (!house || !edge) return "";
  if (edge.from === edge.to) return `Nhà ${houseNumber} bắt đầu ở ${house.sign.name}, và ${edge.rulerName} trở về chính Nhà này. Chủ đề ở đây có độ tập trung cao, thường được giải quyết bằng cách đi thẳng vào bản thân lĩnh vực thay vì tìm một đường vòng qua nơi khác.`;
  const cycle = chart.houseRulerGraph?.cycles?.find((item) => item.id === edge.cycleId);
  if (cycle?.houses?.length > 1) return `Chủ tinh tạo một vòng liên hệ giữa Nhà ${joinNatural(cycle.houses.map(String))}. Hai lĩnh vực này phản hồi qua lại: thay đổi ở một phía thường buộc phía kia sắp xếp lại cách vận hành.`;
  return `Nhà ${houseNumber} mở ở ${house.sign.name}, còn chủ tinh ${edge.rulerName} nằm tại Nhà ${edge.to}. Vì vậy, câu chuyện của Nhà ${houseNumber} thường tìm được lối đi qua trải nghiệm của Nhà ${edge.to}, thay vì chỉ quanh quẩn trong phạm vi ban đầu.`;
}

function buildSummaryV16(chart, index, evidence, planetMap, chartRulerId) {
  const sun = planetMap.get("sun");
  const moon = planetMap.get("moon");
  const asc = chart.angles ? chart.signPosition(chart.angles.asc) : null;
  const support = supportFor(evidence, "self", 7);
  const top = relevantAspects(chart, ["sun", "moon", "mercury", "venus", "mars", chartRulerId].filter(Boolean)).slice(0, 3);
  const paragraphs = [];
  const sunSem = semanticFor(index, sun);
  const moonSem = semanticFor(index, moon);

  if (asc) {
    paragraphs.push(paragraph(`Ấn tượng chung của lá số là sự gặp nhau giữa một ý hướng ${sunSem.sign.sign_style || "có đường đi riêng"} và nhịp cảm xúc ${moonSem.sign.sign_style || "phản ứng theo cảm giác an toàn"}. Cung Mọc ${asc.sign.name} quyết định cách hai lớp ấy xuất hiện ra bên ngoài: bạn thường bước vào tình huống mới bằng phẩm chất ${lowerFirst(asc.sign.element)} và nhịp ${lowerFirst(asc.sign.modality)}. Đây là một hệ có nhiều tốc độ, không phải ba nét tính cách đứng cạnh nhau.`, support));
  } else {
    paragraphs.push(paragraph(`Dữ liệu ngày sinh cho thấy ý thức bản thân vận hành theo cách ${sunSem.sign.sign_style || "có hướng đi riêng"}. Mặt Trăng ${moon.stability && moon.stability !== "stable" ? "có thể đổi vị trí trong khoảng giờ sinh, nên phần cảm xúc chỉ được đọc ở mức điều kiện" : `tạo một nhịp ${moonSem.sign.sign_style || "gắn với cảm giác an toàn"}`}. Không có giờ sinh chắc chắn, bản luận giải dừng ở những yếu tố ổn định và không dựng thêm Cung Mọc, Thiên Đỉnh hay các Nhà.`, support));
  }

  if (top[0]) paragraphs.push(paragraph(`${aspectDetail(top[0], index)} Đây là một trong những đường nối có sức nặng nhất vì nó chạm trực tiếp tới cách bạn lựa chọn, phản ứng hoặc đưa ý định thành hành động. Trong đời sống thực, mạch này thường lộ rõ ở thời điểm phải vừa giữ điều mình coi trọng, vừa đáp lại yêu cầu đang diễn ra trước mắt.`, evidenceForAspects(evidence, [top[0]], support)));
  if (top[1]) paragraphs.push(paragraph(`${aspectDetail(top[1], index, ["square", "opposition"].includes(top[1].id) ? "tension" : "resource")} Mối liên hệ này bổ sung một nhịp khác cho phần mở đầu. Ý chí tự nó chưa quyết định toàn bộ cách vận hành; chất lượng kết quả còn phụ thuộc vào việc hai chức năng có được dùng đúng thời điểm và đúng vai trò hay không.`, evidenceForAspects(evidence, [top[1]], support)));
  if (top[2]) {
    const mode = ["square", "opposition"].includes(top[2].id) ? "tension" : "resource";
    paragraphs.push(paragraph(`${aspectInContext(top[2], index, "bức tranh tổng thể", mode, "Một mạch khác đến từ")} Ảnh hưởng của nó thường kín hơn hai đường nối đầu, nhưng lại rõ vào lúc bạn cần duy trì một lựa chọn sau khi hứng khởi ban đầu đã qua.`, evidenceForAspects(evidence, [top[2]], support)));
  }

  const highPatterns = chart.patterns.filter((item) => item.priority === "high").slice(0, 2);
  if (highPatterns.length) {
    const names = highPatterns.map((item) => item.name);
    const patternItems = evidence.filter((item) => highPatterns.some((patternItem) => item.id === `pattern:${patternItem.id}`));
    paragraphs.push(paragraph(`${joinNatural(names)} gom nhiều yếu tố vào cùng một vùng chú ý. Vì vậy, cùng một chủ đề dễ quay lại trong nhiều hoàn cảnh: lúc bắt đầu một việc, khi phải chọn mức cam kết và khi cần quyết định đâu là phần xứng đáng được đầu tư sâu.`, evidenceObjects([support, patternItems])));
  } else {
    paragraphs.push(paragraph(`Không có một cấu hình lớn đủ mạnh để lấn át toàn bộ lá số. Trọng tâm vì thế nằm ở vài đường nối chặt giữa các hành tinh và cách chúng đổi sắc theo từng lĩnh vực. Kiểu lá số này được hiểu rõ hơn qua sự lặp lại có chọn lọc, không qua một nhãn duy nhất bao trùm mọi hành vi.`, support));
  }

  if (chartRulerId && chart.angles) {
    const ruler = planetMap.get(chartRulerId);
    paragraphs.push(paragraph(`Chủ tinh Cung Mọc là ${planetLabel(ruler)}. Vị trí này cho biết phản ứng ban đầu cuối cùng thường được đưa về ${lowerFirst(houseSemantics(index, ruler)?.house_arena || "lĩnh vực mà chủ tinh đang hiện diện")}. Khi phần khởi động và phần duy trì đi cùng nhau, bạn có thể vừa phản ứng đúng lúc vừa giữ được một hướng đủ lâu để tạo kết quả.`, support));
  }

  paragraphs.push(paragraph(`Điểm xuyên suốt không phải là buộc mọi phần của mình chạy cùng một nhịp. Mặt Trời giữ hướng, Mặt Trăng báo nhu cầu an toàn, còn các hành tinh cá nhân cho biết bạn suy nghĩ, gắn bó và hành động bằng cách nào. Khi mỗi chức năng được dùng đúng việc, những nét tưởng như trái nhau lại tạo thành một chu trình khá mạch lạc.`, support));
  return { id: "summary", title: "Tổng quan lá số", paragraphs };
}

function buildBigThreeV16(chart, index, evidence, planetMap) {
  const sun = planetMap.get("sun");
  const moon = planetMap.get("moon");
  const asc = chart.angles ? chart.signPosition(chart.angles.asc) : null;
  const items = supportFor(evidence, "self", 7);
  const sunSem = semanticFor(index, sun);
  const moonSem = semanticFor(index, moon);
  const paragraphs = [];

  paragraphs.push(paragraph(`${placementMechanism(sun, index)} Với Mặt Trời, trọng tâm là cảm giác mình đang xây một đời sống có hướng. Năng lực tự nhiên nằm ở ${sunSem.sign.constructive_style || "khả năng giữ một hướng phát triển"}; phần dễ làm nhịp này nặng đi là ${sunSem.sign.risk_style || "cố giữ một cách biểu hiện quá lâu"}.`, items));
  if (sun.house) paragraphs.push(paragraph(`Nhà ${sun.house} làm ý thức về bản thân gắn mạnh với ${lowerFirst(sunSem.house.house_arena || "lĩnh vực tương ứng")}. Thành quả ở đây dễ chạm trực tiếp vào lòng tự trọng, nên phản hồi có thể được tiếp nhận rất sâu. Năng lực ở vị trí này gồm ${sunSem.house.planet_constructive_capacity || "tự định hướng"}; nó phát huy tốt nhất khi tiêu chuẩn giúp công việc tiến lên thay vì biến mọi sai số thành một đánh giá về chính mình.`, items));

  const moonConditional = moon.stability && moon.stability !== "stable";
  paragraphs.push(paragraph(`${moonConditional ? "Mặt Trăng thay đổi trong khoảng giờ được xét, nên đoạn này mô tả một khả năng thay vì kết luận cố định. " : ""}${placementMechanism(moon, index)} Đây là lớp phản ứng đến trước phần lý giải: điều gì khiến bạn thấy yên, điều gì làm đầu óc tiếp tục bận và kiểu trao đổi nào giúp cảm xúc có đường đi.`, items));
  if (moon.house) paragraphs.push(paragraph(`Tại Nhà ${moon.house}, nhu cầu cảm xúc tìm chỗ đứng trong ${lowerFirst(moonSem.house.house_arena || "lĩnh vực của Nhà")}. Mặt thuận là ${moonSem.sign.constructive_style || "khả năng đáp lại hoàn cảnh"}. Khi áp lực kéo dài, xu hướng ${moonSem.sign.risk_style || "phản ứng theo thói quen"} có thể xuất hiện rõ hơn, nhất là nếu nhu cầu chưa được gọi đúng tên.`, items));

  if (asc) {
    const ruler = planetMap.get(asc.sign.ruler);
    const rulerSem = semanticFor(index, ruler);
    paragraphs.push(paragraph(`Cung Mọc ${asc.sign.name} tạo lớp tiếp xúc đầu tiên với hoàn cảnh. Bạn dễ quan sát, quyết định hoặc tự bảo vệ theo phẩm chất ${lowerFirst(asc.sign.element)} và nhịp ${lowerFirst(asc.sign.modality)} trước khi những phần phức tạp hơn kịp lộ ra. Người khác thường gặp lớp này sớm hơn Mặt Trời và Mặt Trăng.`, items));
    paragraphs.push(paragraph(`${planetLabel(ruler)} là chủ tinh của Cung Mọc. Vì nằm trong ${lowerFirst(rulerSem.house.house_arena || "một lĩnh vực cụ thể của đời sống")}, chủ tinh kéo cách bạn bắt đầu về vùng này rất nhanh. Nó giải thích vì sao cùng một Cung Mọc có thể biểu hiện khác nhau: dấu hiệu bên ngoài chỉ là cửa vào, còn chủ tinh mới cho biết cửa ấy thường dẫn tới đâu.`, items));
    const rulerAspect = chart.aspects
      .filter((item) => [item.a, item.b].includes(ruler.id) && ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].some((id) => [item.a, item.b].includes(id) && id !== ruler.id))
      .sort((a, b) => (b.significance ?? 0) - (a.significance ?? 0) || a.orb - b.orb)[0];
    if (rulerAspect) paragraphs.push(paragraph(`${aspectInContext(rulerAspect, index, "cách bạn bước vào hoàn cảnh", ["square", "opposition"].includes(rulerAspect.id) ? "tension" : "resource", "Chủ tinh còn nối với")} Vì vậy, ấn tượng ban đầu không đứng yên ở vẻ ngoài; nó nhanh chóng kéo theo cách bạn xử lý nhu cầu, phản hồi người khác hoặc giữ trách nhiệm với lựa chọn vừa mở ra.`, evidenceForAspects(evidence, [rulerAspect], items)));
  }

  const sunMoon = chart.aspects.find((item) => [item.a, item.b].includes("sun") && [item.a, item.b].includes("moon"));
  if (sunMoon) paragraphs.push(paragraph(`${aspectDetail(sunMoon, index)} Trong lựa chọn cá nhân, góc này ảnh hưởng tới khoảng cách giữa điều bạn muốn theo đuổi và điều cơ thể hoặc cảm xúc cần để thấy ổn. Độ hòa hợp không nằm ở việc hai phía giống nhau, mà ở khả năng nhận ra bên nào đang cầm nhịp trong từng thời điểm.`, evidenceForAspects(evidence, [sunMoon], items)));
  else paragraphs.push(paragraph(`Mặt Trời và Mặt Trăng không tạo góc hợp chính đủ gần. Hai lớp này vẫn liên hệ qua các hành tinh và chủ đề khác, nhưng không có một đường nối duy nhất buộc chúng phải luôn hòa thuận hoặc luôn căng. Cách phối hợp sẽ thay đổi rõ hơn theo bối cảnh.`, items));

  paragraphs.push(paragraph(`${asc ? "Đặt cả ba trụ cạnh nhau" : "Đặt Mặt Trời và Mặt Trăng cạnh nhau"}, có thể thấy phần chủ động và phần cảm xúc không nhất thiết khởi hành cùng lúc. Trong công việc, Mặt Trời thường giữ mục tiêu lâu hơn; trong quan hệ gần, Mặt Trăng phản hồi nhanh hơn với chất lượng tương tác. Hiểu sự khác biệt này giúp giải thích những lúc bạn rất rõ hướng nhưng vẫn cần thêm thời gian để thấy thật sự yên với lựa chọn.`, items));
  return { id: "big_three", title: asc ? "Ba trụ cột: Mặt Trời, Mặt Trăng và Cung Mọc" : "Mặt Trời và Mặt Trăng", paragraphs };
}

function buildCoreDynamicsV16(chart, index, evidence) {
  const top = relevantAspects(chart, ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]).slice(0, 4);
  const paragraphs = [];
  top.slice(0, 3).forEach((aspect, position) => {
    const mode = ["square", "opposition"].includes(aspect.id) ? "tension" : "resource";
    const endings = [
      "Mạch này thường dễ nhận ra trong quyết định có ý nghĩa, khi hai nhu cầu cùng hợp lý nhưng không thể cùng đứng ở vị trí dẫn đường.",
      "Giá trị thực tế nằm ở khả năng chuyển đổi giữa hai chức năng, để một phía không phải gánh luôn công việc của phía còn lại.",
      "Nguồn thuận này phát huy rõ nhất khi cảm xúc cần một khung đủ vững để không bị cuốn theo thay đổi nhất thời."
    ];
    const openings = ["Mạch đầu tiên cho thấy", "Một đường nối khác nằm ở", "Ở lớp sâu hơn"];
    paragraphs.push(paragraph(`${aspectInContext(aspect, index, "cấu trúc chung", mode, openings[position])} ${endings[position]}`, evidenceForAspects(evidence, [aspect], supportFor(evidence, "self", 3))));
  });

  const patterns = chart.patterns.filter((item) => item.priority === "high").slice(0, 2);
  if (patterns.length) {
    const members = unique(patterns.flatMap((item) => item.members));
    const patternItems = evidence.filter((item) => patterns.some((patternItem) => item.id === `pattern:${patternItem.id}`));
    paragraphs.push(paragraph(`${joinNatural(patterns.map((item) => item.name))} nối ${joinNatural(members.map((id) => chart.planets.find((planet) => planet.id === id)?.name).filter(Boolean))} thành một vùng tập trung. Sự tập trung này khiến cách các hành tinh phối hợp trở nên quan trọng hơn từng vị trí đứng riêng.`, evidenceObjects([patternItems, supportFor(evidence, "self", 4)])));
  }

  const cycle = chart.houseRulerGraph?.cycles?.find((item) => item.houses.length > 1) || chart.houseRulerGraph?.cycles?.[0];
  if (cycle) {
    const cycleItems = evidence.filter((item) => item.dependency_group === cycle.id);
    paragraphs.push(paragraph(cycle.houses.length > 1
      ? `Đường chủ tinh tạo một vòng qua lại giữa Nhà ${joinNatural(cycle.houses.map(String))}. Kinh nghiệm ở một Nhà thường đặt điều kiện cho Nhà kia, rồi kết quả quay về thay đổi điểm xuất phát. Vì thế, hai lĩnh vực dễ được cảm nhận như một câu chuyện liền mạch.`
      : `Chủ tinh Nhà ${cycle.houses[0]} trở về chính Nhà đó, làm lĩnh vực này có tính tự quy chiếu. Khi thuận, bạn có thể đi rất sâu và xây kinh nghiệm vững; khi kẹt, cùng một cách xử lý dễ lặp lại mà thiếu dữ liệu mới từ bên ngoài.`, cycleItems.length ? cycleItems : supportFor(evidence, "self", 3)));
  }

  if (!paragraphs.length) paragraphs.push(paragraph("Lá số không có một cấu trúc duy nhất đủ mạnh để trở thành lời giải cho mọi vấn đề. Những nét bền hơn nằm ở vài liên hệ vừa phải nhưng lặp lại đúng chỗ, mỗi liên hệ đảm nhiệm một phần khác nhau của đời sống.", supportFor(evidence, "self", 3)));
  return { id: "core_dynamics", title: "Những cấu trúc nổi bật", paragraphs };
}

function domainParagraphs(domain, chart, index, evidence, planetMap) {
  const plan = DOMAIN_PLAN[domain];
  const support = supportFor(evidence, domain, 7);
  const bodies = plan.bodies.map((id) => planetMap.get(id)).filter(Boolean);
  const coreBodies = bodies.slice(0, domain === "career" ? 3 : 2);
  const domainAspects = (modes) => relevantAspects(chart, plan.bodies, modes)
    .filter((item) => plan.bodies.includes(item.a) && plan.bodies.includes(item.b));
  const flow = domainAspects(["trine", "sextile", "conjunction"])[0];
  const tension = domainAspects(["square", "opposition"])[0];
  const paragraphs = [];

  const coreDescriptions = coreBodies.map((item, position) => {
    const semantic = semanticFor(index, item);
    const arena = item.house ? ` trong ${lowerFirst(semantic.house.house_arena || `Nhà ${item.house}`)}` : "";
    const opening = position === 0 ? `Ở ${lowerFirst(plan.title)}` : `Cũng trong ${lowerFirst(plan.title)}`;
    return `${opening}, ${item.name} ${item.sign.name}${item.house ? ` ở Nhà ${item.house}` : ""} đem cách ${semantic.sign.sign_style || "đáp lại hoàn cảnh"}${arena}.`;
  });
  paragraphs.push(paragraph(`${plan.lead} ${coreDescriptions.join(" ")} Trọng tâm nằm ở ${plan.focus}.`, support));

  if (flow) {
    paragraphs.push(paragraph(`${aspectInContext(flow, index, lowerFirst(plan.title), "resource")} Nguồn thuận này giúp một chức năng mở đường cho chức năng kia, nhờ đó ${plan.focus} không bị mắc ở phản ứng đầu tiên khi hoàn cảnh thay đổi.`, evidenceForAspects(evidence, [flow], support)));
  } else {
    const primary = semanticFor(index, coreBodies[0]);
    paragraphs.push(paragraph(`Nguồn lực rõ hơn đến từ khả năng ${primary.sign.constructive_style || "giữ một nhịp phù hợp"}. Trong lĩnh vực này, phẩm chất ấy hữu ích vì nó giúp bạn không phải thay đổi toàn bộ cách vận hành mỗi khi hoàn cảnh đổi. Điểm mạnh nằm ở sự nhất quán có chọn lọc, không phải cố định bằng mọi giá.`, support));
  }

  if (tension) {
    paragraphs.push(paragraph(`${aspectInContext(tension, index, lowerFirst(plan.title), "tension")} Áp lực thường tăng khi cả hai phía đều muốn được giải quyết ngay. Nếu một chức năng phủ lên chức năng kia, ${plan.focus} có thể tạm yên nhưng sẽ quay lại dưới một hình thức khác.`, evidenceForAspects(evidence, [tension], support)));
  } else {
    const secondary = semanticFor(index, coreBodies[1] || coreBodies[0]);
    paragraphs.push(paragraph(`Ở ${lowerFirst(plan.title)}, điểm dễ lệch không đến từ một góc căng nổi trội, mà từ việc dùng quá lâu cùng một cách phản ứng. Xu hướng ${secondary.sign.risk_style || "bám vào phản ứng quen thuộc"} dễ rõ hơn khi thiếu thời gian, thiếu thông tin hoặc cảm giác an toàn bị xáo trộn.`, support));
  }

  if (coreBodies.length > 1) {
    const firstBody = coreBodies[0];
    const secondBody = coreBodies[1];
    const firstMode = semanticFor(index, firstBody).sign;
    const secondMode = semanticFor(index, secondBody).sign;
    paragraphs.push(paragraph(`${plan.title} đặt ${firstBody.name}, với cách ${firstMode.sign_style || "giữ nhịp riêng"}, cạnh ${secondBody.name}, vốn vận hành theo cách ${secondMode.sign_style || "đáp lại khác"}. Sự khác tốc độ này giải thích vì sao ${plan.focus} có thể trôi chảy trong bối cảnh này nhưng cần thêm thời gian ở bối cảnh khác.`, support));
  }

  if (domain === "career" && chart.angles && chart.houses?.length) {
    const mc = chart.signPosition(chart.angles.mc).sign;
    const house10 = chart.houses.find((item) => item.number === 10);
    const samePoint = chart.houseSystemSemantics?.mcEqualsHouse10Cusp;
    paragraphs.push(paragraph(`Thiên Đỉnh ở ${mc.name} mô tả cách vai trò xã hội dễ được nhìn thấy, còn Nhà 10 bắt đầu ở ${house10.sign.name} cho biết cấu trúc của con đường nghề nghiệp. ${samePoint ? "Trong hệ Nhà đang dùng, hai điểm gặp nhau nhưng vẫn trả lời hai câu hỏi khác nhau." : "Hai điểm không trùng nhau trong hệ Nhà đang dùng, nên hình ảnh nghề nghiệp và cách xây sự nghiệp cần được giữ như hai lớp riêng."} Sự nghiệp vì thế gồm cả cách vai trò được nhận diện và nền trách nhiệm được tổ chức.`, support));
  }

  if (chart.houses?.length) {
    const links = plan.houses.map((house) => rulerLinkNatural(chart, house)).filter(Boolean);
    if (links.length) paragraphs.push(paragraph(links.join(" "), support));
  }

  const first = semanticFor(index, coreBodies[0]);
  const second = semanticFor(index, coreBodies[1] || coreBodies[0]);
  paragraphs.push(paragraph(`Nhịp bền hơn cho ${plan.focus} xuất hiện khi ${lowerFirst(first.sign.constructive_style || "thế mạnh thứ nhất")} có thể làm việc cùng ${lowerFirst(second.sign.constructive_style || "thế mạnh thứ hai")}. Một phía tạo động lực, phía kia giữ chất lượng hoặc kiểm tra độ phù hợp. Cách chia việc này giữ cho lĩnh vực không bị kéo hoàn toàn về một phản ứng quen thuộc.`, support));

  if (support.length >= 5 && paragraphs.length < 7) {
    paragraphs.push(paragraph(`Các mối nối ở ${lowerFirst(plan.title)} khá dày, nên lĩnh vực này phản hồi mạnh với thay đổi ở những phần liên quan. Một lựa chọn tốt giải quyết mục tiêu trước mắt, đồng thời giữ điều kiện cho ${plan.focus} tiếp tục vận hành mà không buộc một nhu cầu quan trọng khác phải trả giá quá lớn.`, support));
  }
  return paragraphs;
}

function buildDomainsV16(chart, index, evidence, planetMap) {
  return DEFAULT_DOMAINS.map((domain) => {
    const support = supportFor(evidence, domain, 7);
    if (confidenceTag(support) === "limited") return null;
    return { id: `domain_${domain}`, title: DOMAIN_PLAN[domain].title, paragraphs: domainParagraphs(domain, chart, index, evidence, planetMap) };
  }).filter(Boolean);
}

function buildDevelopmentV16(chart, index, evidence) {
  const support = supportFor(evidence, "growth", 7);
  const tensions = relevantAspects(chart, ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"], ["square", "opposition"]).slice(0, 3);
  const flow = relevantAspects(chart, ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"], ["trine", "sextile"])[0];
  const paragraphs = [];

  if (tensions[0]) paragraphs.push(paragraph(`${aspectInContext(tensions[0], index, "điểm phát triển", "tension", "Lực kéo rõ nhất nằm ở")} Trọng tâm là nhận ra lúc nào hai phía đang cùng tranh quyền quyết định. Gọi đúng chức năng quá tải đã có thể đổi cách xử lý, vì áp lực không còn bị quy thành một khuyết điểm chung của bản thân.`, evidenceForAspects(evidence, [tensions[0]], support)));
  if (tensions[1]) paragraphs.push(paragraph(`${aspectInContext(tensions[1], index, "mạch phát triển thứ hai", "tension", "Mạch tiếp theo đến từ")} Cách giải không nhất thiết giống lực kéo trước. Có tình huống cần ranh giới rõ, có tình huống cần thêm dữ liệu, và cũng có lúc một quyết định chỉ tốt hơn sau khi nhịp cảm xúc đã hạ xuống.`, evidenceForAspects(evidence, [tensions[1]], support)));
  if (!tensions.length) paragraphs.push(paragraph("Không có một lực kéo căng đủ rõ để gán thành bài toán trung tâm. Phần phát triển phù hợp hơn là quan sát lúc một thế mạnh quen thuộc đang bị dùng quá rộng, rồi trả nó về đúng phạm vi thay vì cố thay đổi toàn bộ con người mình.", support));

  if (flow) paragraphs.push(paragraph(`${aspectInContext(flow, index, "quá trình điều chỉnh", "resource", "Nguồn hỗ trợ sẵn có là")} Đường này cho phép chuyển từ phản ứng sang xử lý mà không cần phủ nhận nhu cầu của bên đang chịu áp lực.`, evidenceForAspects(evidence, [flow], support)));

  const node = chart.planets.find((item) => item.id === "north_node");
  if (node) {
    const nodeItems = evidence.filter((item) => item.evidence_root_id === "secondary:lunar_node_axis");
    paragraphs.push(paragraph(`Nút Bắc ở ${node.sign.name}${node.house ? `, Nhà ${node.house}` : ""} gợi một hướng mở rộng theo phẩm chất ${lowerFirst(node.sign.modality)} của ${node.sign.name}. Nút Nam ở đầu đối diện mô tả phản xạ quen thuộc; hai điểm tạo thành một trục phát triển mang tính biểu tượng, không phải lời kể chắc chắn về quá khứ.`, evidenceObjects([support, nodeItems])));
  }

  paragraphs.push(paragraph("Sự trưởng thành của lá số này không đòi hỏi loại bỏ một phần để phần khác thắng. Mục tiêu thực tế hơn là phân công đúng việc: chức năng nào dùng để bắt đầu, chức năng nào kiểm tra, chức năng nào giữ liên hệ và chức năng nào quyết định mức cam kết. Khi ranh giới ấy rõ, sức mạnh của từng phần bớt va vào nhau.", support));
  return { id: "development", title: "Điểm phát triển và cách tích hợp", paragraphs };
}

function paragraphOpening(text) {
  return String(text || "").toLowerCase().replace(/[^a-zà-ỹ\s]/g, " ").trim().split(/\s+/).slice(0, 3).join(" ");
}

function sentenceList(text) {
  return String(text || "").split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

function lintNarrative(sections, writerStyle = {}) {
  const issues = [];
  const paragraphs = sections.flatMap((section) => section.paragraphs.map((item) => item.text));
  const prose = paragraphs.join("\n");
  if (/[–—]/.test(prose)) issues.push("dash");
  if (/\b(?:placement|evidence|operator|weighting|confidence|rule id|dataset|json|debug|runtime)\b/i.test(prose)) issues.push("internal_language");
  const allSentences = paragraphs.flatMap(sentenceList).map((item) => item.toLowerCase());
  const seenSentences = new Set();
  if (allSentences.some((item) => seenSentences.has(item) || !seenSentences.add(item))) issues.push("duplicate_sentence");
  const openings = paragraphs.map(paragraphOpening);
  for (let index = 2; index < openings.length; index += 1) {
    if (openings[index] && openings[index] === openings[index - 1] && openings[index] === openings[index - 2]) issues.push("repeated_opening");
  }
  const tracked = writerStyle.tracked_ai_phrases || [];
  const trackedCount = tracked.reduce((sum, phrase) => sum + (prose.toLowerCase().split(String(phrase).toLowerCase()).length - 1), 0);
  const words = prose.split(/\s+/).filter(Boolean).length;
  const limit = Math.max(1, Math.ceil(words / 1000) * (writerStyle.soft_limits?.ban_phrase_occurrences_per_1000_words ?? 4));
  if (trackedCount > limit) issues.push("tracked_phrase_density");
  const formulaicContrastPatterns = [
    /không chỉ/giu,
    /không đơn thuần/giu,
    /không phải[^.!?\n]{0,160}?mà(?:\s+là)?(?=\s|[,:;.!?]|$)/giu,
    /không hẳn[^.!?\n]{0,160}?mà(?=\s|[,:;.!?]|$)/giu
  ];
  const formulaicContrastCount = formulaicContrastPatterns.reduce((sum, pattern) => sum + (prose.match(pattern) || []).length, 0);
  if (formulaicContrastCount) issues.push("formulaic_contrast");
  return { pass: issues.length === 0, issues: unique(issues), words, paragraphs: paragraphs.length, tracked_phrase_count: trackedCount, formulaic_contrast_count: formulaicContrastCount };
}

function rewriteForStyle(sections, writerStyle) {
  const replacements = [
    [/điều này không có nghĩa là/gi, "cách đọc này không đồng nhất với"],
    [/không đơn giản là/gi, "vượt ra ngoài"],
    [/điểm cần lưu ý là/gi, "phần đáng chú ý nằm ở"],
    [/khi kết hợp với/gi, "đứng cạnh"],
    [/nói cách khác/gi, "nhìn từ nhịp vận hành"],
    [/điều thú vị là/gi, "một nét riêng ở đây là"]
  ];
  const seen = new Set();
  sections.forEach((section, sectionIndex) => {
    section.paragraphs = section.paragraphs.map((item, paragraphIndex) => {
      let text = item.text.replace(/[–—]/g, ",");
      replacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
      const fresh = sentenceList(text).filter((sentence) => {
        const key = sentence.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      text = fresh.join(" ");
      if (paragraphIndex >= 2) {
        const current = paragraphOpening(text);
        const earlier = section.paragraphs.slice(Math.max(0, paragraphIndex - 2), paragraphIndex).map((entry) => paragraphOpening(entry.text));
        if (earlier.length === 2 && earlier.every((opening) => opening === current)) text = `${["Từ đây", "Trong thực tế", "Ở lớp sâu hơn"][sectionIndex % 3]}, ${lowerFirst(text)}`;
      }
      return { ...item, text: text.replace(/\s+/g, " ").trim() };
    }).filter((item) => item.text);
  });
  return { sections, qa: lintNarrative(sections, writerStyle) };
}

function createNarrative(chart, corpus, rules, signPosition, writerStyle = null) {
  if (!corpus || !Array.isArray(corpus.planet_in_sign)) return null;
  chart.signPosition = signPosition;
  const index = corpusIndex(corpus);
  const { evidence, planetMap, chartRulerId } = createEvidence(chart);
  chart.aspects.forEach((aspect) => { aspect.significance = aspectSignificance(aspect, planetMap, chartRulerId); });
  const draftSections = [
    buildSummaryV16(chart, index, evidence, planetMap, chartRulerId),
    buildBigThreeV16(chart, index, evidence, planetMap),
    buildCoreDynamicsV16(chart, index, evidence),
    ...buildDomainsV16(chart, index, evidence, planetMap),
    buildDevelopmentV16(chart, index, evidence)
  ].filter((section) => section.paragraphs.some((item) => item.text));
  const result = rewriteForStyle(draftSections, writerStyle || {});
  delete chart.signPosition;
  return {
    version: NARRATIVE_VERSION,
    corpus_id: corpus.corpus_id,
    rules_id: rules?.rules_id || null,
    writer_style_id: writerStyle?.style_id || null,
    evidence,
    style_qa: result.qa,
    sections: result.sections
  };
}

module.exports = { NARRATIVE_VERSION, DEFAULT_DOMAINS, createEvidence, createNarrative, lintNarrative };
