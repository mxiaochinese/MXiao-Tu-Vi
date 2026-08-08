"use strict";

const NARRATIVE_VERSION = "mxiao-astrology-narrative-1.4.0";

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
    ? `Điểm phát triển rõ nhất nằm ở cách điều phối các mạch ${tension.map((item) => index.pairs.get(`${item.a}:${item.b}`)?.axis || `${item.aName} và ${item.bName}`).join("; ")}. Các góc căng cho thấy hai phía cùng cần có chỗ vận hành; mục tiêu không phải loại bỏ một phía mà là nhận ra thời điểm, giới hạn và cách chuyển nhịp phù hợp.`
    : "Lá số không tạo một lực kéo căng đủ rõ để gán thành bài toán trung tâm. Hướng phát triển phù hợp hơn là nhận ra lúc một thế mạnh quen thuộc đang được dùng quá tự động và thử mở thêm một cách phản ứng khác.";
  const resourceText = flow ? `Nguồn hỗ trợ có thể đến từ ${index.pairs.get(`${flow.a}:${flow.b}`)?.axis || `${flow.aName} và ${flow.bName}`}, vì ${lowerFirst(index.aspects.get(flow.id)?.operator || "hai chức năng có khả năng phối hợp")}. Khi được dùng có ý thức, mạch thuận này giúp bạn xử lý phần căng mà không biến việc phát triển thành tự phê bình.` : "Việc phát triển nên dựa trên quan sát lặp lại trong đời sống thực, không trên một nhãn cố định từ lá số.";
  return { id: "development", title: "Điểm phát triển và cách tích hợp", paragraphs: [paragraph(tensionText, items), paragraph(resourceText, items)] };
}

function createNarrative(chart, corpus, rules, signPosition) {
  if (!corpus || !Array.isArray(corpus.planet_in_sign)) return null;
  chart.signPosition = signPosition;
  const index = corpusIndex(corpus);
  const { evidence, planetMap, chartRulerId } = createEvidence(chart);
  chart.aspects.forEach((aspect) => { aspect.significance = aspectSignificance(aspect, planetMap, chartRulerId); });
  const sections = [
    buildSummary(chart, index, evidence, planetMap, chartRulerId),
    buildBigThree(chart, index, evidence, planetMap),
    buildCoreDynamics(chart, index, evidence),
    ...buildDomains(chart, index, evidence, planetMap),
    buildDevelopment(chart, index, evidence)
  ].filter((section) => section.paragraphs.some((item) => item.text));
  delete chart.signPosition;
  return {
    version: NARRATIVE_VERSION,
    corpus_id: corpus.corpus_id,
    rules_id: rules?.rules_id || null,
    evidence,
    sections
  };
}

module.exports = { NARRATIVE_VERSION, DEFAULT_DOMAINS, createEvidence, createNarrative };
