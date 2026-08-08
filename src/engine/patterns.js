"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationIds = getRelationIds;
exports.detectCoreConfigurations = detectCoreConfigurations;
exports.detectAdjacentFormations = detectAdjacentFormations;
exports.analyzeActivationNetwork = analyzeActivationNetwork;
exports.buildConfigurationParagraphs = buildConfigurationParagraphs;
exports.buildAdjacentParagraphs = buildAdjacentParagraphs;
exports.buildActivationParagraph = buildActivationParagraph;

const TRIADS = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];

const CONFIGURATIONS = [
    {
        id: "tu-phu-vu-tuong",
        name: "Tử Phủ Vũ Tướng",
        required: ["tu-vi", "thien-phu", "vu-khuc", "thien-tuong"],
        emphasis: "khả năng tổ chức, quản trị nguồn lực, duy trì trật tự và đảm nhận trách nhiệm trong một cấu trúc lớn"
    },
    {
        id: "sat-pha-tham",
        name: "Sát Phá Tham",
        required: ["that-sat", "pha-quan", "tham-lang"],
        emphasis: "khả năng thích ứng với biến động, tái cấu trúc, cạnh tranh và mở một chu kỳ mới khi khuôn cũ không còn phù hợp"
    },
    {
        id: "co-nguyet-dong-luong",
        name: "Cơ Nguyệt Đồng Lương",
        required: ["thien-co", "thai-am", "thien-dong", "thien-luong"],
        emphasis: "tư duy quan sát, điều phối, tích lũy kinh nghiệm và xử lý tình huống theo hướng mềm, có độ lùi"
    },
    {
        id: "cu-nhat",
        name: "Cự Nhật",
        required: ["cu-mon", "thai-duong"],
        emphasis: "năng lực diễn đạt, phản biện, công khai quan điểm và chịu trách nhiệm trước cộng đồng"
    },
    {
        id: "nhat-nguyet",
        name: "Nhật Nguyệt",
        required: ["thai-duong", "thai-am"],
        emphasis: "sự đan xen giữa hướng ngoại và chiều sâu nội tâm, giữa nhu cầu tạo ảnh hưởng và khả năng quan sát kín đáo"
    }
];

const ADJACENT_FORMATIONS = [
    { id: "ta-huu", name: "Tả Hữu giáp", pair: ["ta-phu", "huu-bat"], tone: "support", effect: "khả năng nhận trợ lực từ hai phía, phối hợp nhân sự và tổ chức công việc theo nhóm" },
    { id: "xuong-khuc", name: "Xương Khúc giáp", pair: ["van-xuong", "van-khuc"], tone: "support", effect: "năng lực học hỏi, diễn đạt, xử lý thông tin và hoàn thiện kỹ năng bằng cả tư duy hệ thống lẫn cảm thụ" },
    { id: "khoi-viet", name: "Khôi Việt giáp", pair: ["thien-khoi", "thien-viet"], tone: "support", effect: "khả năng gặp người dẫn dắt, tiếp cận nguồn lực tốt hoặc được nhìn nhận ở thời điểm phù hợp" },
    { id: "nhat-nguyet-giap", name: "Nhật Nguyệt giáp", pair: ["thai-duong", "thai-am"], tone: "mixed", effect: "sự tác động đồng thời của trách nhiệm hướng ngoại và nhu cầu ổn định nội tâm" },
    { id: "kinh-da", name: "Kình Đà giáp", pair: ["kinh-duong", "da-la"], tone: "challenge", effect: "sức ép vừa trực diện vừa kéo dài, khiến quá trình phát triển phải xử lý cả va chạm trước mắt lẫn độ trễ âm ỉ" },
    { id: "khong-kiep", name: "Không Kiếp giáp", pair: ["dia-khong", "dia-kiep"], tone: "challenge", effect: "độ biến động cao, nguy cơ thay đổi đột ngột và khoảng cách lớn giữa kế hoạch ban đầu với tình thế thực tế" },
    { id: "hoa-linh", name: "Hỏa Linh giáp", pair: ["hoa-tinh", "linh-tinh"], tone: "challenge", effect: "nhịp phản ứng mạnh, căng thẳng dễ bùng phát hoặc tích tụ rồi chuyển trạng thái nhanh" }
];

function movePalace(start, offset) {
    return ((start - 1 + offset) % 12 + 12) % 12 + 1;
}

function getPalace(palaces, id) {
    return palaces.find((item) => item.id === id);
}

function starIdsInPalaces(palaces, ids) {
    return new Set(ids.flatMap((id) => (getPalace(palaces, id)?.stars || []).map((star) => star.id)));
}

function getRelationIds(targetId) {
    const triad = TRIADS.find((group) => group.includes(targetId)) || [];
    return Array.from(new Set([...triad, movePalace(targetId, 6)]));
}

function detectCoreConfigurations(palaces, targetId) {
    const relationIds = getRelationIds(targetId);
    const present = starIdsInPalaces(palaces, relationIds);
    return CONFIGURATIONS.filter((configuration) => configuration.required.every((id) => present.has(id))).map((configuration) => ({
        ...configuration,
        targetId,
        relationIds,
        starPalaces: configuration.required.map((starId) => {
            const palace = palaces.find((item) => item.stars.some((star) => star.id === starId));
            const star = palace?.stars.find((item) => item.id === starId);
            return { starId, starName: star?.name || starId, palaceId: palace?.id || null, palaceName: palace?.name || "", branch: palace?.branch || "" };
        })
    }));
}

function detectAdjacentFormations(palaces, targetId) {
    const previous = getPalace(palaces, movePalace(targetId, -1));
    const next = getPalace(palaces, movePalace(targetId, 1));
    const previousIds = new Set((previous?.stars || []).map((star) => star.id));
    const nextIds = new Set((next?.stars || []).map((star) => star.id));
    return ADJACENT_FORMATIONS.filter((formation) => {
        const [a, b] = formation.pair;
        return (previousIds.has(a) && nextIds.has(b)) || (previousIds.has(b) && nextIds.has(a));
    }).map((formation) => ({ ...formation, targetId, previous, next }));
}

function pairRelation(a, b) {
    if (a === b)
        return "same";
    if (movePalace(a, 6) === b)
        return "opposite";
    if ((TRIADS.find((group) => group.includes(a)) || []).includes(b))
        return "triad";
    if (movePalace(a, 1) === b || movePalace(a, -1) === b)
        return "adjacent";
    return "separate";
}

function analyzeActivationNetwork(palaces, focusIds) {
    const ids = focusIds.filter((id) => Number.isInteger(id) && id >= 1 && id <= 12);
    const counts = new Map();
    ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const uniqueIds = [...counts.keys()];
    const exact = [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ palace: getPalace(palaces, id), count }));
    const relations = { triad: [], opposite: [], adjacent: [], separate: [] };
    for (let i = 0; i < uniqueIds.length; i += 1) {
        for (let j = i + 1; j < uniqueIds.length; j += 1) {
            const a = uniqueIds[i];
            const b = uniqueIds[j];
            const relation = pairRelation(a, b);
            if (relation === "same")
                continue;
            relations[relation].push({ a: getPalace(palaces, a), b: getPalace(palaces, b) });
        }
    }
    const connectedPairs = relations.triad.length + relations.opposite.length + relations.adjacent.length;
    let structure = "distributed";
    if (exact.length || connectedPairs >= Math.max(2, uniqueIds.length - 1))
        structure = "concentrated";
    else if (connectedPairs)
        structure = "linked";
    return { ids, uniqueIds, exact, relations, connectedPairs, structure };
}

function formatList(values) {
    const list = Array.from(new Set(values.filter(Boolean)));
    if (!list.length)
        return "";
    if (list.length === 1)
        return list[0];
    if (list.length === 2)
        return `${list[0]} và ${list[1]}`;
    return `${list.slice(0, -1).join(", ")} và ${list[list.length - 1]}`;
}

function buildConfigurationParagraphs(palaces, targetId) {
    const target = getPalace(palaces, targetId);
    return detectCoreConfigurations(palaces, targetId).map((configuration) => {
        const placements = configuration.starPalaces.map((item) => `${item.starName} tại ${item.palaceName} ở ${item.branch}`);
        return `Tam phương tứ chính của cung ${target.name} hội đủ nhóm ${configuration.name}, gồm ${formatList(placements)}. Cách cục này không được hiểu như một nhãn dự báo độc lập, mà cho thấy bốn cung liên hệ cùng chia sẻ một trục vận hành về ${configuration.emphasis}. Mức độ biểu hiện còn phụ thuộc trạng thái sáng tối của từng chính tinh, các sao phụ đi kèm và lớp vận hạn đang kích hoạt cung nào trong toàn bộ cấu trúc.`;
    });
}

function buildAdjacentParagraphs(palaces, targetId) {
    const target = getPalace(palaces, targetId);
    return detectAdjacentFormations(palaces, targetId).map((formation) => {
        const tone = formation.tone === "support"
            ? "Hai cung kề tạo một lớp hỗ trợ bao quanh, giúp chính tinh tại cung trung tâm có thêm điều kiện triển khai"
            : formation.tone === "challenge"
                ? "Hai cung kề cùng tạo sức ép, khiến chính tinh tại cung trung tâm phải xử lý ảnh hưởng từ hai phía trước khi phát huy ổn định"
                : "Hai cung kề đưa vào những lực tác động khác nhau, vì vậy cung trung tâm cần cân bằng giữa hai hướng vận hành";
        return `Cung ${target.name} tại ${target.branch} được ${formation.name} bởi hai cung kề ${formation.previous.name} ở ${formation.previous.branch} và ${formation.next.name} ở ${formation.next.branch}. ${tone}. Trong thực tế, cấu trúc này làm nổi bật ${formation.effect}; tác động chỉ rõ khi các sao giáp cung đồng thời được vận hạn hoặc Tứ Hóa kích hoạt.`;
    });
}

function pairLabels(pairs, limit = 3) {
    return pairs.slice(0, limit).map((pair) => `${pair.a.name} ở ${pair.a.branch} với ${pair.b.name} ở ${pair.b.branch}`);
}

function buildActivationParagraph(palaces, focusIds, label) {
    const network = analyzeActivationNetwork(palaces, focusIds);
    if (!network.uniqueIds.length)
        return `${label} chưa có đủ vị trí để xác định lĩnh vực nào đáng chú ý hơn. Phần vận hạn vì thế chủ yếu dựa vào đặc điểm gốc của lá số.`;
    const clauses = [];
    if (network.exact.length)
        clauses.push(`có nhiều mốc cùng đi vào ${formatList(network.exact.map((item) => `${item.palace.name} ở ${item.palace.branch}`))}`);
    if (network.relations.triad.length)
        clauses.push(`các cặp tam hợp đáng chú ý gồm ${formatList(pairLabels(network.relations.triad))}`);
    if (network.relations.opposite.length)
        clauses.push(`các cặp xung chiếu gồm ${formatList(pairLabels(network.relations.opposite))}`);
    if (network.relations.adjacent.length)
        clauses.push(`các cung kề nhau gồm ${formatList(pairLabels(network.relations.adjacent))}`);
    let conclusion = `Các mốc phân bố tương đối rời, nên diễn biến có thể xuất hiện ở nhiều lĩnh vực thay vì tập trung vào một việc duy nhất.`;
    if (network.structure === "linked")
        conclusion = `Các cung có liên hệ nhưng chưa cùng quy tụ vào một vị trí. Một thay đổi có thể kéo theo cung tam hợp, xung chiếu hoặc cung kề, song mức độ còn tùy thời điểm.`;
    if (network.structure === "concentrated")
        conclusion = `Nhiều mốc cùng tập trung vào một số cung. Chủ đề của các cung đó dễ xuất hiện rõ và có thể kéo theo những lĩnh vực liên quan qua tam hợp hoặc xung chiếu.`;
    return `${label} ${clauses.length ? clauses.join("; ") : "phân bố trên các cung chưa tạo thành quan hệ trực tiếp"}. ${conclusion}`;
}
