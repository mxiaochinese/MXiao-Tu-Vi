"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterpretations = buildInterpretations;
const fortune_1 = require("./fortune");
const patterns_1 = require("./patterns");
const content_pipeline_1 = require("./content-pipeline");

const MAJOR_PROFILES = {
    "tu-vi": { core: "khả năng quy tụ, tổ chức và giữ vai trò trung tâm", tension: "xu hướng muốn tự mình nắm toàn bộ quyền quyết định" },
    "liem-trinh": { core: "ý thức nguyên tắc, danh dự và ranh giới", tension: "sự cứng rắn hoặc nhạy cảm trước chuyện đúng sai" },
    "thien-dong": { core: "khả năng thích nghi, kết nối và thay đổi theo môi trường", tension: "tâm thế dễ dao động khi điều kiện bên ngoài biến chuyển" },
    "vu-khuc": { core: "năng lực quản lý nguồn lực, tính toán và theo đuổi kết quả", tension: "cách xử lý thiên về hiệu quả nên đôi lúc trở nên khô cứng" },
    "thai-duong": { core: "tính chủ động, tinh thần trách nhiệm và nhu cầu tạo ảnh hưởng công khai", tension: "áp lực phải thể hiện vai trò hoặc gánh trách nhiệm quá sớm" },
    "thien-co": { core: "khả năng quan sát biến động, suy tính và tìm phương án", tension: "tư duy liên tục khiến quyết định dễ bị kéo dài" },
    "thien-phu": { core: "năng lực quản trị, tích lũy và duy trì sự ổn định", tension: "tâm lý ưu tiên an toàn có thể làm chậm thay đổi cần thiết" },
    "thai-am": { core: "sự tinh tế, khả năng tích lũy và quan sát chiều sâu", tension: "cảm xúc kín và xu hướng suy nghĩ nhiều trước khi bộc lộ" },
    "tham-lang": { core: "khả năng kết nối, trải nghiệm và nhận diện cơ hội", tension: "sự phân tán khi có quá nhiều lựa chọn cùng xuất hiện" },
    "cu-mon": { core: "năng lực phân tích, phản biện và diễn đạt", tension: "tranh luận, hiểu lầm hoặc áp lực từ lời nói" },
    "thien-tuong": { core: "khả năng phối hợp, giữ tiêu chuẩn và bảo vệ quan hệ", tension: "tâm thế phải cân bằng quá nhiều phía" },
    "thien-luong": { core: "sự coi trọng nguyên tắc, lý lẽ và chất lượng quyết định", tension: "khuynh hướng tự nhận quá nhiều trách nhiệm" },
    "that-sat": { core: "khả năng quyết định, chịu áp lực và xử lý tình huống khó", tension: "nhịp hành động mạnh, dễ tạo va chạm khi thiếu khoảng lùi" },
    "pha-quan": { core: "năng lực cải tổ, kết thúc chu kỳ cũ và mở chu kỳ mới", tension: "biến động lớn khi quá trình thay đổi thiếu sự chuẩn bị" }
};

const PALACE_THEMES = {
    "Mệnh": "khí chất, cách tiếp nhận hoàn cảnh và cách đưa ra lựa chọn",
    "Phụ Mẫu": "quan hệ với cha mẹ, người hỗ trợ và các khuôn mẫu hình thành từ gia đình",
    "Phúc Đức": "đời sống tinh thần, ảnh hưởng dòng họ và sức bền nội tâm",
    "Điền Trạch": "nhà ở, tài sản cố định và cảm giác ổn định trong môi trường cư trú",
    "Quan Lộc": "nghề nghiệp, vị trí xã hội và phương thức tạo ra thành tựu",
    "Nô Bộc": "bạn bè, đồng nghiệp, cộng sự và chất lượng các mối quan hệ xã hội",
    "Thiên Di": "hoạt động bên ngoài, dịch chuyển và cách cá nhân được nhìn nhận trong xã hội",
    "Tật Ách": "thể trạng, nhịp năng lượng và phản ứng khi áp lực tích tụ",
    "Tài Bạch": "khả năng tạo lập, quản lý và luân chuyển nguồn lực tài chính",
    "Tử Tức": "con cái, dự án dài hạn và những thành quả cần thời gian nuôi dưỡng",
    "Phu Thê": "quan hệ gắn bó, hôn nhân và cách hai bên phối hợp trong đời sống lâu dài",
    "Huynh Đệ": "anh chị em, quan hệ ngang hàng và cách chia sẻ trách nhiệm"
};

const PALACE_MANIFESTATIONS = {
    "Mệnh": "nhịp ra quyết định, mức chủ động và cách xác lập ranh giới cá nhân",
    "Phụ Mẫu": "cách tiếp nhận kỳ vọng gia đình, quan hệ với người nâng đỡ và mức độ kế thừa khuôn mẫu cũ",
    "Phúc Đức": "sức bền tâm lý, cách hồi phục sau biến động và ảnh hưởng của nền gia tộc",
    "Điền Trạch": "cách tạo không gian ổn định, tích lũy tài sản cố định và thích ứng với thay đổi nơi ở",
    "Quan Lộc": "kiểu công việc, cách nhận trách nhiệm và nhịp phát triển vị trí xã hội",
    "Nô Bộc": "cách chọn cộng sự, phân chia lợi ích và duy trì độ tin cậy trong mạng lưới",
    "Thiên Di": "cách phản ứng với môi trường mới, năng lực dịch chuyển và hình ảnh thể hiện ra bên ngoài",
    "Tật Ách": "nhịp tiêu hao năng lượng, khả năng hồi phục và phản ứng của cơ thể trước áp lực kéo dài",
    "Tài Bạch": "cách tạo thu nhập, quản lý dòng tiền và phản ứng trước cơ hội tài chính",
    "Tử Tức": "cách nuôi dưỡng con cái hoặc dự án dài hạn, mức kiên nhẫn và khả năng trao quyền",
    "Phu Thê": "cách hình thành cam kết, phân chia vai trò và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "cách tương tác với người ngang hàng, chia sẻ trách nhiệm và duy trì ranh giới trong quan hệ gần"
};

const PALACE_LEADS = {
    "Mệnh": "Cách suy nghĩ, phản ứng và đưa ra lựa chọn",
    "Phụ Mẫu": "Quan hệ với cha mẹ, người nâng đỡ và các khuôn mẫu gia đình",
    "Phúc Đức": "Đời sống tinh thần và khả năng hồi phục sau biến động",
    "Điền Trạch": "Nhu cầu ổn định về nhà ở và tài sản tích lũy",
    "Quan Lộc": "Con đường nghề nghiệp và cách đảm nhận trách nhiệm",
    "Nô Bộc": "Cách chọn cộng sự và duy trì độ tin cậy trong quan hệ xã hội",
    "Thiên Di": "Khả năng thích nghi khi bước ra môi trường bên ngoài",
    "Tật Ách": "Nhịp sinh hoạt và cách cơ thể phản ứng khi áp lực kéo dài",
    "Tài Bạch": "Khả năng tạo thu nhập, giữ nguồn lực và xử lý biến động dòng tiền",
    "Tử Tức": "Cách nuôi dưỡng con cái hoặc những dự án cần thời gian",
    "Phu Thê": "Cách hình thành cam kết và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "Cách chia sẻ trách nhiệm và giữ ranh giới với người ngang hàng"
};

const DECADE_MANIFESTATIONS = {
    "Mệnh": "cách tự quyết định, xây năng lực và xác lập vị trí cá nhân",
    "Phụ Mẫu": "quan hệ với gia đình, người hướng dẫn và những tiêu chuẩn được kế thừa",
    "Phúc Đức": "đời sống tinh thần, khả năng hồi phục và trách nhiệm với gia đình gốc",
    "Điền Trạch": "nơi ở, tài sản dài hạn và việc tạo một môi trường sống ổn định",
    "Quan Lộc": "vai trò nghề nghiệp, trách nhiệm xã hội và hướng phát triển công việc",
    "Nô Bộc": "cộng sự, mạng lưới nghề nghiệp và cách phân chia lợi ích",
    "Thiên Di": "thay đổi môi trường, mở rộng phạm vi hoạt động và hình ảnh xã hội",
    "Tật Ách": "sức bền, nhịp sinh hoạt và cách quản lý áp lực kéo dài",
    "Tài Bạch": "thu nhập, cách giữ tiền và những quyết định liên quan tới tài sản",
    "Tử Tức": "con cái, sản phẩm sáng tạo hoặc dự án cần nhiều năm để hoàn thành",
    "Phu Thê": "cam kết, hợp tác lâu dài và cách phân chia vai trò trong quan hệ hoặc công việc chung",
    "Huynh Đệ": "người ngang hàng, quan hệ hợp tác và việc chia sẻ trách nhiệm"
};

const SUPPORT_ROLES = {
    "Lộc Tồn": "khả năng tích lũy và duy trì nguồn lực",
    "Tả Phù": "sự hỗ trợ từ cộng sự và năng lực tổ chức theo nhóm",
    "Hữu Bật": "khả năng nhận trợ giúp linh hoạt từ người xung quanh",
    "Văn Xương": "tư duy hệ thống, học tập và diễn đạt rõ ràng",
    "Văn Khúc": "khả năng cảm thụ, biểu đạt và xử lý thông tin mềm",
    "Thiên Khôi": "khả năng được nhìn nhận hoặc gặp người dẫn dắt",
    "Thiên Việt": "sự hỗ trợ đúng lúc và khả năng tiếp cận nguồn lực tốt",
    "Thiên Mã": "dịch chuyển, thay đổi môi trường và mở rộng phạm vi hoạt động",
    "Quốc Ấn": "uy tín, trách nhiệm và dấu hiệu của vị trí chính thức",
    "Đào Hoa": "sức hút xã hội và khả năng tạo kết nối",
    "Hồng Loan": "độ nhạy trong quan hệ và nhu cầu gắn kết",
    "Thiên Hỷ": "không khí cởi mở, giao tiếp thuận và sự kiện mang tính kết nối",
    "Thiên Giải": "khả năng tháo gỡ trở ngại",
    "Địa Giải": "khả năng giảm nhẹ áp lực thực tế",
    "Giải Thần": "cơ chế điều hòa khi mâu thuẫn phát sinh",
    "Ân Quang": "sự hỗ trợ về tinh thần, học hỏi và thiện ý",
    "Thiên Quý": "sự trợ giúp từ quý nhân và điều kiện thuận để tiến hành công việc",
    "Thiên Thọ": "sức bền và khả năng duy trì nhịp ổn định",
    "Thiên Phúc": "phúc khí, sự dung hòa và khả năng gặp điều kiện thuận",
    "Thiên Quan": "sự hỗ trợ từ người có thẩm quyền hoặc từ quy chuẩn chung",
    "Thiên Đức": "khả năng giảm xung đột và giữ giới hạn đạo lý",
    "Nguyệt Đức": "tính mềm hóa, thiện chí và khả năng hòa giải",
    "Bát Tọa": "nền tảng, sự sắp xếp và khả năng giữ vị trí",
    "Tam Thai": "quá trình tiến từng bậc và sự hỗ trợ theo từng giai đoạn",
    "Thai Phụ": "khả năng chuẩn bị, hỗ trợ và hoàn thiện thủ tục",
    "Phong Cáo": "sự ghi nhận, danh vị hoặc kết quả được xác lập công khai",
    "Long Trì": "môi trường thuận lợi, tính trang trọng và khả năng được bảo vệ",
    "Phượng Các": "khả năng biểu đạt, thẩm mỹ và sự ghi nhận từ cộng đồng",
    "Hoa Cái": "chiều sâu chuyên môn, thẩm mỹ và xu hướng làm việc độc lập",
    "Đường Phù": "tính quy củ, hồ sơ, giấy tờ và quy trình",
    "Thiên Tài": "khả năng ứng biến và sử dụng năng lực cá nhân đúng lúc",
    "Thiên Trù": "điều kiện nuôi dưỡng, hưởng dụng và chăm lo đời sống",
    "Thiên Y": "khả năng chăm sóc, phục hồi và quan tâm tới thể trạng",
    "Lưu Niên Văn Tinh": "nhu cầu học hỏi, viết, nói hoặc xử lý thông tin trong thời điểm được kích hoạt"
};

const CHALLENGE_ROLES = {
    "Kình Dương": "xung lực mạnh, cạnh tranh và va chạm trực diện",
    "Đà La": "trì hoãn, vướng mắc kéo dài và sức cản âm ỉ",
    "Địa Không": "khoảng trống, thay đổi đột ngột hoặc kỳ vọng khó giữ nguyên",
    "Địa Kiếp": "biến động mạnh và nguy cơ hao hụt khi quyết định thiếu độ lùi",
    "Hỏa Tinh": "nhịp phản ứng nhanh, áp lực bùng phát và tính nóng",
    "Linh Tinh": "sự bất ổn khó đoán và căng thẳng tích tụ",
    "Cự Môn": "mâu thuẫn qua lời nói và khác biệt trong cách diễn giải",
    "Thiên Hình": "tính nghiêm khắc, ranh giới pháp lý hoặc áp lực từ quy chuẩn",
    "Thiên Khốc": "gánh nặng cảm xúc và cảm giác thiếu sự chia sẻ",
    "Thiên Hư": "khoảng cách giữa kỳ vọng và kết quả thực tế",
    "Cô Thần": "xu hướng tự xử lý vấn đề và khó chia sẻ cảm xúc",
    "Quả Tú": "cảm giác tách biệt trong quan hệ gần",
    "Kiếp Sát": "tình huống bất ngờ buộc phải phản ứng nhanh",
    "Phá Toái": "sự việc vụn vặt, gián đoạn và hao tổn do nhiều đầu mối",
    "Thiên Không": "sự đảo chiều hoặc kết quả khác với dự tính ban đầu",
    "Lưu Hà": "dòng biến động khó giữ ổn định và nguy cơ bị cuốn theo tình thế",
    "Thiên La": "cảm giác bị ràng buộc bởi hoàn cảnh hoặc suy nghĩ lặp lại",
    "Địa Võng": "mạng lưới trách nhiệm chồng chéo và khó tách khỏi hệ quả cũ",
    "Thiên Riêu": "độ nhạy cảm, hấp lực cảm xúc và khả năng phát sinh nhiễu trong quan hệ",
    "Thiên Sứ": "áp lực buộc phải xử lý hậu quả hoặc phần việc khó né tránh",
    "Thiên Thương": "tổn hao do trách nhiệm, quan hệ hoặc sự cố ngoài dự tính"
};

const TRANSFORM_ROLES = {
    "Hóa Lộc": "cơ hội mở rộng nguồn lực, tiếp nhận lợi ích và gặp điều kiện thuận",
    "Hóa Quyền": "quyền chủ động lớn hơn, đi cùng trách nhiệm phải đứng ra quyết định",
    "Hóa Khoa": "sự minh bạch hơn, cơ hội học hỏi và được ghi nhận",
    "Hóa Kỵ": "điểm nghẽn, tâm lý vướng mắc hoặc vấn đề cần xử lý nhiều lần"
};
const MOVING_SUPPORT_ROLES = { ...SUPPORT_ROLES, ...TRANSFORM_ROLES };
const MOVING_CHALLENGE_ROLES = { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES };

const TRIADS = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];

function getPalace(palaces, id) {
    return palaces.find((item) => item.id === id);
}

function movePalace(start, offset) {
    return ((start - 1 + offset) % 12 + 12) % 12 + 1;
}

function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
}

function formatList(list) {
    const values = unique(list);
    if (!values.length)
        return "";
    if (values.length === 1)
        return values[0];
    if (values.length === 2)
        return `${values[0]} và ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} và ${values[values.length - 1]}`;
}

function sentenceStart(text) {
    return `${text.charAt(0).toLocaleUpperCase("vi")}${text.slice(1)}`;
}

function getStars(palace, groups) {
    return palace.stars.filter((item) => groups.includes(item.group));
}

function getMovingStars(palace, layers) {
    return layers.flatMap((layer) => palace[layer] || []);
}

function supportingStars(palace) {
    return [...getStars(palace, ["support"]), ...getStars(palace, ["transform"]).filter((star) => star.name !== "Hóa Kỵ")];
}

function challengeStars(palace) {
    return [...getStars(palace, ["malefic"]), ...getStars(palace, ["transform"]).filter((star) => star.name === "Hóa Kỵ")];
}

function starDisplay(star) {
    return `${star.name}${star.brightness ? ` ở trạng thái ${star.brightness}` : ""}`;
}

function majorDisplay(palace) {
    const major = getStars(palace, ["major"]);
    return major.length ? formatList(major.map(starDisplay)) : "vô chính diệu";
}

function balanceState(palace, movingLayers = []) {
    const natalSupport = supportingStars(palace).length;
    const natalChallenge = challengeStars(palace).length;
    const moving = getMovingStars(palace, movingLayers);
    const movingSupport = moving.filter((item) => item.group.endsWith("support")).length;
    const movingChallenge = moving.filter((item) => item.group.endsWith("malefic")).length;
    const support = natalSupport + movingSupport;
    const challenge = natalChallenge + movingChallenge;
    if (support >= challenge + 3)
        return { label: "thuận lợi nổi trội", support, challenge };
    if (challenge >= support + 3)
        return { label: "trở ngại nổi trội", support, challenge };
    return { label: "thuận lợi và trở ngại đan xen", support, challenge };
}

function relationSet(palaces, palace) {
    const triad = TRIADS.find((group) => group.includes(palace.id)) || [];
    const triadPalaces = triad.filter((id) => id !== palace.id).map((id) => getPalace(palaces, id));
    const opposite = getPalace(palaces, movePalace(palace.id, 6));
    return { triadPalaces, opposite };
}

function majorStateSummary(palace, context = "") {
    const lead = context ? `Khi xét ${context}, ` : "";
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `${lead}cung này vô chính diệu, nên các phụ tinh và các cung hội chiếu có ảnh hưởng lớn hơn bình thường tới ${PALACE_MANIFESTATIONS[palace.name]}`;
    const strengths = major.filter((star) => ["Miếu", "Vượng", "Đắc", "Lợi"].includes(star.brightness));
    const strains = major.filter((star) => ["Hãm", "Bất"].includes(star.brightness));
    const abilities = formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 3));
    const tensions = formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.tension)).slice(0, 2));
    if (strengths.length && !strains.length)
        return `${lead}${formatList(strengths.map((star) => `${star.name} ở thế ${star.brightness}`))} giúp điểm mạnh này biểu hiện rõ, nhưng vẫn cần giữ cân bằng ${tensions}`;
    if (strains.length && !strengths.length)
        return `${lead}${formatList(strains.map((star) => `${star.name} ở thế ${star.brightness}`))} không làm mất điểm mạnh, nhưng khả năng đó thường rõ hơn sau trải nghiệm; lúc thiếu ổn định, ${tensions} dễ xuất hiện trước`;
    if (strengths.length && strains.length)
        return `${lead}${formatList(strengths.map((star) => `${star.name} ở thế ${star.brightness}`))} tạo điểm mạnh về ${abilities}, còn ${formatList(strains.map((star) => `${star.name} ở thế ${star.brightness}`))} khiến ${tensions} trở thành phần phải xử lý`;
    return `${lead}${formatList(major.map((star) => star.name))} kết hợp ${abilities} với ${tensions}; phụ tinh đi cùng quyết định mặt nào xuất hiện rõ hơn`;
}

function modifierSummary(palace) {
    const support = supportingStars(palace);
    const challenges = challengeStars(palace);
    const parts = [];
    if (support.length) {
        const clauses = support.slice(0, 3).map((star) => TRANSFORM_ROLES[star.name] ? `${star.name} ${TRANSFORM_ROLES[star.name]}` : `${star.name} hỗ trợ ${SUPPORT_ROLES[star.name] || "khả năng xử lý công việc"}`);
        parts.push(clauses.join("; "));
    }
    if (challenges.length) {
        const clauses = challenges.slice(0, 3).map((star) => TRANSFORM_ROLES[star.name] ? `${star.name} ${TRANSFORM_ROLES[star.name]}` : `${star.name} làm tăng ${CHALLENGE_ROLES[star.name] || "độ trễ và vướng mắc"}`);
        parts.push(`Ngược lại, ${clauses.join("; ")}`);
    }
    const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
    if (blockers)
        parts.push(`${blockers} tại ${palace.name} khiến kết quả thường đến sau một lần đổi cách làm hoặc điều chỉnh kỳ vọng`);
    return parts.join(". ");
}

function lifeBodyInteractionParagraph(life, body) {
    if (life.id === body.id)
        return `Mệnh và Thân đồng cung tại ${life.branch}, nên điều người này coi trọng thường đi khá sát với cách họ hành động. ${majorDisplay(life)} khiến ưu điểm và áp lực của cùng một bộ sao cùng tác động lên suy nghĩ, lựa chọn và trách nhiệm lâu dài.`;
    return `Mệnh tại ${life.branch} cho thấy phản ứng ban đầu thiên về ${formatList(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core || star.name)) || "sự linh hoạt"}. Thân cư ${body.name} tại ${body.branch} khiến năng lực đó thể hiện rõ nhất qua ${PALACE_THEMES[body.name]}, với ảnh hưởng của ${majorDisplay(body)}. Vì vậy, điều người này hiểu về bản thân và nơi họ thực sự dồn công sức có thể không hoàn toàn trùng nhau ngay từ đầu.`;
}

function periodNatalContext(palace, label) {
    const focus = /^Đại hạn/u.test(label) ? DECADE_MANIFESTATIONS[palace.name] : PALACE_MANIFESTATIONS[palace.name];
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `${label} đi qua cung ${palace.name} vô chính diệu. Giai đoạn này nhạy với thay đổi của môi trường và những cung hội chiếu, nên hướng phát triển có thể cần điều chỉnh nhiều hơn một lần.`;
    return `${label} đi qua cung ${palace.name} tại ${palace.branch}, nơi có ${majorDisplay(palace)}. Giai đoạn này tác động trực tiếp tới ${focus}.`;
}

function movingBaseName(name) {
    return String(name || "")
        .replace(/^Lưu\s+/, "")
        .replace(/^Nguyệt\s+/, "")
        .replace(/^Nhật\s+/, "")
        .replace(/^Thời\s+/, "");
}

function movingRoleClause(star) {
    const base = movingBaseName(star.name);
    const role = SUPPORT_ROLES[base] || CHALLENGE_ROLES[base] || TRANSFORM_ROLES[base];
    if (role)
        return `${star.name} làm nổi bật ${role}`;
    if (base === "Thái Tuế")
        return `${star.name} xác định khu vực chịu tác động trực tiếp của năm`;
    if (["Nguyệt", "Nhật", "Thời"].includes(base))
        return `${star.name} xác định điểm tập trung của lớp thời gian đang xem`;
    return `${star.name} tạo thêm một lớp kích hoạt tại cung`;
}

function movingParagraph(palace, layerLabel, starArrayName, contextText) {
    const stars = palace[starArrayName] || [];
    const lead = `${layerLabel.charAt(0).toUpperCase()}${layerLabel.slice(1)}`;
    if (!stars.length) {
        return `Trong ${layerLabel}, cung ${palace.name} không có sao lưu nổi bật. ${sentenceStart(PALACE_MANIFESTATIONS[palace.name])} vì thế chủ yếu theo đặc điểm gốc và chịu ảnh hưởng từ ${contextText}.`;
    }
    const support = stars.filter((item) => item.group.endsWith("support"));
    const challenge = stars.filter((item) => item.group.endsWith("malefic"));
    const cycle = stars.filter((item) => item.group.endsWith("cycle"));
    const movingRoles = (group, roleMap, fallback) => roleSummary(group.map((star) => ({ ...star, name: movingBaseName(star.name) })), roleMap, fallback);
    let conclusion = `${lead} nhấn vào ${PALACE_MANIFESTATIONS[palace.name]} tại cung ${palace.name}`;
    if (support.length && challenge.length)
        conclusion = `${lead} đem lại cả cơ hội lẫn trở ngại tại cung ${palace.name}`;
    if ((support.length > 0 && challenge.length === 0) || support.length >= challenge.length + 2)
        conclusion = `${lead} tạo điều kiện thuận hơn bình thường cho ${PALACE_MANIFESTATIONS[palace.name]}`;
    if ((challenge.length > 0 && support.length === 0) || challenge.length >= support.length + 2)
        conclusion = `${lead} dễ làm ${PALACE_MANIFESTATIONS[palace.name]} gặp độ trễ, va chạm hoặc phải đổi cách xử lý`;
    const technical = formatList([...cycle, ...support, ...challenge].slice(0, 5).map((star) => star.name));
    const effects = [];
    if (cycle.length)
        effects.push(`${formatList(cycle.map((star) => star.name))} đánh dấu nơi những việc của giai đoạn này dễ bộc lộ`);
    if (support.length)
        effects.push(`${formatList(support.map((star) => star.name))} gợi thêm ${movingRoles(support, MOVING_SUPPORT_ROLES, "khả năng nhận hỗ trợ và chủ động xử lý")}`);
    if (challenge.length)
        effects.push(`${formatList(challenge.map((star) => star.name))} có thể kéo theo ${movingRoles(challenge, MOVING_CHALLENGE_ROLES, "sức cản hoặc thay đổi ngoài dự tính")}`);
    if (!effects.length)
        effects.push(`${technical} đánh dấu lĩnh vực cần chú ý trong thời điểm này`);
    return `${conclusion}. ${sentenceStart(effects.join("; "))}.`;
}

function annualSubjectMovement(primary, related, viewYear) {
    const stars = primary.annualStars || [];
    if (!stars.length) {
        const nearby = related.filter((palace) => palace.annualStars?.length);
        const indirectEffects = {
            "Quan Lộc": `Năm ${viewYear}, ${formatList(nearby.map((palace) => palace.name))} có sao lưu, còn Quan Lộc thì không. Cách nhận việc, chọn môi trường và gánh trách nhiệm có thể đổi theo những chuyển động ở các cung liên quan.`,
            "Tài Bạch": `Các sao lưu ở ${formatList(nearby.map((palace) => palace.name))} đặt chuyện tiền bạc vào bối cảnh rộng hơn trong năm ${viewYear}. Thu nhập và kế hoạch chi tiêu cần được nhìn cùng nhịp công việc và những khoản tích lũy dài hạn.`,
            "Phu Thê": `Năm ${viewYear}, dấu hiệu sao lưu nằm ở ${formatList(nearby.map((palace) => palace.name))} thay vì Phu Thê. Nhu cầu riêng và khả năng lắng nghe nhau có thể thay đổi theo những chuyển động ấy.`,
            "Tật Ách": `Trong năm ${viewYear}, ${formatList(nearby.map((palace) => palace.name))} có sao lưu nhưng Tật Ách không nhận tác động trực tiếp. Nhịp nghỉ ngơi và sức bền có thể đổi theo áp lực tinh thần và cách sắp xếp đời sống thường ngày.`
        };
        return nearby.length
            ? indirectEffects[primary.name]
            : `Năm ${viewYear}, cung ${primary.name} và các cung liên quan không có sao lưu nổi bật. ${sentenceStart(PALACE_MANIFESTATIONS[primary.name])} chủ yếu tiếp nối đặc điểm gốc trong bối cảnh Đại hạn và Tiểu hạn.`;
    }
    const support = stars.filter((star) => star.group.endsWith("support"));
    const challenge = stars.filter((star) => star.group.endsWith("malefic"));
    const challengeEffects = {
        "Quan Lộc": "khiến công việc dễ phát sinh thêm việc khó xử lý",
        "Tài Bạch": "khiến dòng tiền và kế hoạch chi tiêu dễ bị xáo trộn",
        "Phu Thê": "khiến việc trao đổi và phối hợp trong quan hệ dễ căng hơn",
        "Tật Ách": "khiến nhịp sinh hoạt và hồi phục dễ bị xáo trộn"
    };
    const subjectContext = {
        "Quan Lộc": "Điều đó thể hiện qua cách nhận trách nhiệm và phối hợp với người khác trong công việc.",
        "Tài Bạch": "Tác động rõ hơn ở cách sắp xếp dòng tiền, chi tiêu và những khoản cần giữ lâu dài.",
        "Phu Thê": "Trong quan hệ gắn bó, cách hai bên giữ cam kết và chia sẻ trách nhiệm vẫn là điều cần xét cùng.",
        "Tật Ách": "Mức độ thể hiện còn tùy nhịp sinh hoạt, khả năng nghỉ và những việc đang phải gánh trong năm."
    };
    if (stars.length === 1 && support.length === 1) {
        const role = roleSummary([{ ...stars[0], name: movingBaseName(stars[0].name) }], MOVING_SUPPORT_ROLES, "khả năng nhận hỗ trợ");
        return `Năm ${viewYear}, ${stars[0].name} tại cung ${primary.name} gợi thêm ${role}. ${subjectContext[primary.name]}`;
    }
    if (stars.length === 1 && challenge.length === 1) {
        const role = roleSummary([{ ...stars[0], name: movingBaseName(stars[0].name) }], MOVING_CHALLENGE_ROLES, "");
        return `Năm ${viewYear}, ${stars[0].name} tại cung ${primary.name} có thể ${role ? `làm rõ ${role}` : challengeEffects[primary.name]}. ${subjectContext[primary.name]}`;
    }
    const clauses = [];
    if (support.length)
        clauses.push(`${formatList(support.map((star) => star.name))} gợi thêm ${roleSummary(support.map((star) => ({ ...star, name: movingBaseName(star.name) })), MOVING_SUPPORT_ROLES, "khả năng nhận hỗ trợ")}`);
    if (challenge.length) {
        const role = roleSummary(challenge.map((star) => ({ ...star, name: movingBaseName(star.name) })), MOVING_CHALLENGE_ROLES, "");
        clauses.push(role
            ? `${formatList(challenge.map((star) => star.name))} gợi ${role}`
            : `${formatList(challenge.map((star) => star.name))} có thể ${challengeEffects[primary.name]}`);
    }
    if (!clauses.length)
        clauses.push(`${formatList(stars.map((star) => star.name))} nhấn vào ${PALACE_MANIFESTATIONS[primary.name]}, nhưng tự chúng chưa cho biết diễn biến sẽ thuận hay khó`);
    return `Năm ${viewYear}, ${formatList(stars.slice(0, 5).map((star) => star.name))} xuất hiện tại cung ${primary.name}. ${sentenceStart(clauses.join("; "))}.`;
}

function annualNatalFoundation(primary) {
    const major = getStars(primary, ["major"]);
    if (!major.length) {
        if (primary.name === "Quan Lộc")
            return "Quan Lộc vô chính diệu, nên hướng công việc cần đọc cùng các phụ tinh và những cung hội chiếu. Mệnh và Thiên Di giúp làm rõ cách người này nhận vai trò, thích nghi với môi trường và tìm chỗ phát huy năng lực.";
        if (primary.name === "Tài Bạch")
            return "Tài Bạch vô chính diệu, nên cách tạo thu nhập và giữ tiền không thể luận từ một chính tinh tại bản cung. Quan Lộc và Điền Trạch cho thêm bối cảnh về công việc, dòng tiền và kế hoạch tài sản dài hạn.";
        if (primary.name === "Phu Thê")
            return "Phu Thê vô chính diệu, nên quan hệ gắn bó chịu ảnh hưởng rõ hơn từ các phụ tinh và cung hội chiếu. Mệnh và Phúc Đức giúp hiểu cách người này thể hiện nhu cầu riêng và hồi phục sau bất đồng.";
        return "Tật Ách vô chính diệu, nên nhịp sống và sức bền cần được đọc cùng các phụ tinh, cung Mệnh và Phúc Đức. Cách người này chia sẻ trách nhiệm và nghỉ ngơi có thể làm thay đổi phản ứng trước áp lực kéo dài.";
    }
    const abilityList = unique(major.map((star) => MAJOR_PROFILES[star.id]?.core));
    const abilities = abilityList.length > 1 ? `${abilityList[0]} cùng ${abilityList[1]}` : abilityList[0] || "khả năng thích ứng với hoàn cảnh";
    const tensions = unique(major.map((star) => MAJOR_PROFILES[star.id]?.tension))[0] || "áp lực từ các cung liên quan";
    const stars = majorDisplay(primary);
    if (primary.name === "Quan Lộc")
        return `Con đường công việc vốn mang dấu ấn của ${stars} tại Quan Lộc. ${sentenceStart(abilities)} là điểm có thể phát huy, còn ${tensions} dễ xuất hiện khi trách nhiệm tăng; môi trường bên ngoài và cách tự đưa ra lựa chọn cũng ảnh hưởng tới vai trò nghề nghiệp.`;
    if (primary.name === "Tài Bạch")
        return `Tài Bạch có ${stars}, gắn cách tạo thu nhập và giữ tiền với ${abilities}. ${sentenceStart(tensions)} có thể làm các quyết định tài chính chậm hoặc khó đổi hướng; công việc và kế hoạch tài sản dài hạn cũng cần được xét cùng nhau.`;
    if (primary.name === "Phu Thê")
        return `Trong quan hệ gắn bó, ${stars} tại Phu Thê gợi cách người này phát huy ${abilities}. Khi ${tensions} xuất hiện, cách hai người trao đổi và chia sẻ trách nhiệm sẽ quan trọng hơn việc chỉ phân định đúng sai.`;
    return `Ở cung Tật Ách, ${stars} gợi ${abilities}. Sức bền còn chịu ảnh hưởng từ ${tensions}; cách người này chia sẻ trách nhiệm, nghỉ ngơi và hồi phục sau những giai đoạn nhiều áp lực vì vậy cần được xét cùng nhau.`;
}

function palaceEvidence(palace, groups = ["major", "support", "malefic", "transform"]) {
    const stars = getStars(palace, groups);
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function selectedStarEvidence(palace, stars) {
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function roleSummary(stars, roleMap, fallback) {
    const roles = unique(stars.map((star) => roleMap[star.name])).slice(0, 2);
    return roles.length ? formatList(roles) : fallback;
}

function periodEvidenceSummary(palace) {
    const support = supportingStars(palace).slice(0, 3);
    const challenges = challengeStars(palace).slice(0, 2);
    const clauses = [];
    if (support.length)
        clauses.push(`Nhận định về cơ hội dựa chủ yếu vào ${formatList(support.map((star) => star.name))}`);
    if (challenges.length)
        clauses.push(`phía trở ngại thể hiện qua ${formatList(challenges.map((star) => star.name))}`);
    const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
    if (blockers)
        clauses.push(`${blockers} tại ${palace.name} báo hiệu kết quả có thể đến sau khi phải điều chỉnh cách làm hoặc kỳ vọng`);
    return clauses.length ? `${clauses.join("; ")}.` : "";
}

function palaceMainClaim(palace) {
    const major = getStars(palace, ["major"]);
    const stars = major.length ? majorDisplay(palace) : "vô chính diệu";
    const abilities = formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 3)) || "khả năng thích ứng theo hoàn cảnh";
    const openings = {
        "Mệnh": `Mệnh có ${stars}. Nét nổi bật là ${abilities}, thể hiện trực tiếp trong cách suy nghĩ, phản ứng và nhận trách nhiệm`,
        "Phụ Mẫu": `Phụ Mẫu có ${stars}. Quan hệ với gia đình và người đi trước chịu ảnh hưởng rõ của ${abilities}`,
        "Phúc Đức": `Phúc Đức có ${stars}. Khả năng giữ cân bằng tinh thần và hồi phục sau áp lực gắn với ${abilities}`,
        "Điền Trạch": `Điền Trạch có ${stars}. Cách tạo nơi ở ổn định và tích lũy tài sản thiên về ${abilities}`,
        "Quan Lộc": `Quan Lộc có ${stars}. Con đường nghề nghiệp được định hình bởi ${abilities}`,
        "Nô Bộc": `Nô Bộc có ${stars}. Việc chọn cộng sự và duy trì quan hệ xã hội phụ thuộc nhiều vào ${abilities}`,
        "Thiên Di": `Thiên Di có ${stars}. Khi bước ra môi trường bên ngoài, người này thường dùng ${abilities}`,
        "Tật Ách": `Tật Ách có ${stars}. Sức bền và phản ứng khi căng thẳng chịu ảnh hưởng của ${abilities}`,
        "Tài Bạch": `Tài Bạch có ${stars}. Cách tạo thu nhập và giữ tiền gắn chặt với ${abilities}`,
        "Tử Tức": `Tử Tức có ${stars}. Con cái hoặc các dự án dài hạn đòi hỏi ${abilities}`,
        "Phu Thê": `Phu Thê có ${stars}. Trong quan hệ gắn bó, nhu cầu cam kết và phối hợp mang dấu ấn của ${abilities}`,
        "Huynh Đệ": `Huynh Đệ có ${stars}. Quan hệ với anh chị em và người ngang hàng thể hiện rõ ${abilities}`
    };
    return openings[palace.name] || `${PALACE_LEADS[palace.name]} chịu ảnh hưởng của ${stars} và ${abilities}`;
}

function relationTone(palace) {
    const balance = balanceState(palace);
    if (balance.support >= balance.challenge + 3) return "có nhiều điều kiện thuận lợi";
    if (balance.challenge >= balance.support + 3) return "có những vướng mắc cần tính trước";
    return "vừa có điểm mạnh vừa có điểm khó";
}

function relationSynthesis(palaces, palace) {
    const pairs = {
        "Mệnh": ["Quan Lộc", "Tài Bạch", "Năng lực cá nhân phát huy tốt nhất khi công việc cho đủ quyền chủ động và thu nhập không bị kéo theo mỗi lần đổi hướng"],
        "Phụ Mẫu": ["Phúc Đức", "Huynh Đệ", "Kỳ vọng từ gia đình tác động lâu dài tới cách chia sẻ trách nhiệm; ranh giới rõ sẽ giảm cảm giác phải gánh thay người khác"],
        "Phúc Đức": ["Mệnh", "Tật Ách", "Khả năng hồi phục tinh thần liên hệ trực tiếp với cách tự xử lý áp lực; càng ôm việc một mình, sức bền càng dễ giảm"],
        "Điền Trạch": ["Tài Bạch", "Phúc Đức", "Quyết định về nơi ở hoặc tài sản chỉ bền khi vừa phù hợp dòng tiền vừa tạo được cảm giác an tâm lâu dài"],
        "Quan Lộc": ["Mệnh", "Tài Bạch", "Vấn đề chính không chỉ là có năng lực làm việc, mà là biến năng lực đó thành một vai trò đủ bền để thu nhập không dao động theo từng thay đổi nghề nghiệp"],
        "Nô Bộc": ["Thiên Di", "Huynh Đệ", "Quan hệ xã hội tốt lên khi người này chọn đúng nhóm và phân chia trách nhiệm rõ, thay vì duy trì kết nối chỉ vì nể nang"],
        "Thiên Di": ["Mệnh", "Quan Lộc", "Môi trường bên ngoài có thể mở cơ hội nghề nghiệp, nhưng hiệu quả phụ thuộc việc người này giữ được cách làm riêng hay phải liên tục thích ứng với yêu cầu mới"],
        "Tật Ách": ["Mệnh", "Phúc Đức", "Áp lực tinh thần và nhịp sinh hoạt có quan hệ gần; thời gian nghỉ và khả năng chia sẻ trách nhiệm ảnh hưởng rõ tới sức bền"],
        "Tài Bạch": ["Quan Lộc", "Điền Trạch", "Thu nhập chịu ảnh hưởng từ lựa chọn nghề nghiệp, còn khả năng giữ tiền liên hệ với kế hoạch nhà cửa và tài sản; hai việc này không nên được quyết định tách rời"],
        "Tử Tức": ["Phu Thê", "Điền Trạch", "Dự án dài hạn hoặc trách nhiệm với con cái cần sự thống nhất về cam kết và môi trường sống; thiếu một trong hai sẽ làm quá trình kéo dài hơn dự tính"],
        "Phu Thê": ["Mệnh", "Phúc Đức", "Quan hệ bền hơn khi nhu cầu cá nhân được nói rõ và cả hai có cách hồi phục sau mâu thuẫn, thay vì để trách nhiệm tích tụ thành khoảng cách"],
        "Huynh Đệ": ["Nô Bộc", "Phụ Mẫu", "Cách chia sẻ trách nhiệm trong gia đình dễ lặp lại trong quan hệ với bạn bè và đồng nghiệp; ranh giới nhất quán giúp giảm xung đột" ]
    };
    const [firstName, secondName, conclusion] = pairs[palace.name] || [relationSet(palaces, palace).triadPalaces[0].name, relationSet(palaces, palace).opposite.name, `${PALACE_THEMES[palace.name]} chịu ảnh hưởng rõ từ các lĩnh vực liên quan`];
    const first = palaces.find((item) => item.name === firstName);
    const second = palaces.find((item) => item.name === secondName);
    return `${first.name} có ${majorDisplay(first)} và ${relationTone(first)}, trong khi ${second.name} có ${majorDisplay(second)} và ${relationTone(second)}. ${conclusion}.`;
}

function palaceParagraphs(palaces, palace) {
    const first = `${palaceMainClaim(palace)}. ${majorStateSummary(palace)}.`;
    const modifiers = modifierSummary(palace);
    const second = modifiers
        ? `${modifiers}. Những yếu tố này thể hiện rõ nhất qua ${PALACE_MANIFESTATIONS[palace.name]}.`
        : `Cung không có nhiều phụ tinh nổi bật, nên ${PALACE_MANIFESTATIONS[palace.name]} chủ yếu theo đặc tính của chính tinh và hoàn cảnh thực tế.`;
    const relation = relationSynthesis(palaces, palace);
    const detail = palace.stars.length + Number(palace.hasTuan) * 2 + Number(palace.hasTriet) * 2;
    return detail < 7 ? [first, `${second} ${relation}`] : [first, second, relation];
}

function makeItem(id, topic, title, paragraphs) {
    const cleanParagraphs = paragraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean);
    return { id, topic, title, paragraphs: cleanParagraphs, body: cleanParagraphs.join("\n\n") };
}

function repeatedFocusParagraph(palaces, focusIds, label) {
    const counts = new Map();
    focusIds.filter(Boolean).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ palace: getPalace(palaces, id), count }));
    const repeated = ranked.filter((item) => item.count > 1);
    if (repeated.length) {
        return `${label} cùng hướng về ${formatList(repeated.map((item) => `${item.palace.name} ở ${item.palace.branch}`))}. Vì nhiều mốc thời gian gặp nhau tại đây, ${formatList(repeated.map((item) => PALACE_MANIFESTATIONS[item.palace.name]))} đáng chú ý hơn các lĩnh vực chỉ xuất hiện một lần.`;
    }
    return `${label} phân bố trên nhiều cung khác nhau. Diễn biến vì thế không tập trung hoàn toàn vào một lĩnh vực mà có thể xuất hiện qua nhiều đầu mối, từ bối cảnh mười năm đến những thay đổi riêng của năm.`;
}

function thematicSynthesis(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((item) => item.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((item) => item.name === name)).filter(Boolean);
    const byName = (name) => palaces.find((item) => item.name === name);
    const starNames = (palace, groups) => formatList(getStars(palace, groups).slice(0, 5).map((star) => star.name));
    const challenges = (palace) => roleSummary(challengeStars(palace), { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "áp lực khi hoàn cảnh thay đổi");
    if (title === "Sự nghiệp") {
        const life = byName("Mệnh");
        const travel = byName("Thiên Di");
        const finance = byName("Tài Bạch");
        const mobile = [...getStars(primary, ["support", "malefic"]), ...getStars(travel, ["support", "malefic"])].some((star) => star.name === "Thiên Mã");
        return [
            `${palaceMainClaim(primary)}. ${majorStateSummary(primary, "sự nghiệp")}. Công việc phù hợp hơn với môi trường ${mobile ? "cho phép thay đổi vai trò, mở rộng phạm vi hoặc di chuyển" : "có trách nhiệm rõ và đủ khoảng chủ động để sắp xếp cách làm"}.`,
            `Mệnh có ${majorDisplay(life)}, còn Thiên Di có ${majorDisplay(travel)}. Sự kết hợp này cho thấy người này nhận việc tốt nhất khi hiểu mục tiêu và có quyền xử lý, nhưng ${challenges(primary)} có thể tạo khoảng cách giữa năng lực thực tế với vị trí hoặc sự ghi nhận trong một số giai đoạn.`,
            `Tài Bạch có ${majorDisplay(finance)} và ${relationTone(finance)}. Vì vậy, mỗi thay đổi nghề nghiệp cần được tính cùng ảnh hưởng tới thu nhập; khả năng làm việc chỉ chuyển thành kết quả bền khi vai trò, quyền quyết định và dòng tiền cùng ổn định.`
        ];
    }
    if (title === "Tài chính") {
        const career = byName("Quan Lộc");
        const property = byName("Điền Trạch");
        const transforms = starNames(primary, ["transform"]);
        return [
            `${palaceMainClaim(primary)}. ${majorStateSummary(primary, "tài chính")}. Khả năng kiếm tiền và khả năng giữ tiền ${balanceState(primary).challenge > balanceState(primary).support ? "không hoàn toàn đồng đều, nên kế hoạch dự phòng quan trọng hơn việc trông chờ dòng tiền đều sẵn có" : "có thể hỗ trợ nhau nếu mục tiêu chi tiêu và tích lũy được xác định rõ"}.`,
            `Quan Lộc có ${majorDisplay(career)}, còn Điền Trạch có ${majorDisplay(property)}. Thu nhập vì thế chịu ảnh hưởng từ lựa chọn nghề nghiệp, trong khi phần tích lũy dài hạn liên hệ với nhà ở và tài sản; thay đổi ở công việc có thể kéo theo một thời gian phải sắp xếp lại kế hoạch tài chính.`,
            `${transforms ? `Tứ Hóa tại nhóm cung này gồm ${transforms}, làm rõ khả năng tăng nguồn lực, nắm quyền quyết định hoặc gặp điểm nghẽn.` : "Nhóm cung tài chính không có Tứ Hóa nổi bật tại bản cung."} Rủi ro hành vi đáng lưu ý là ${challenges(primary)}, nhất là khi quyết định được đưa ra dưới áp lực thời gian.`
        ];
    }
    if (title === "Tình cảm") {
        const life = byName("Mệnh");
        const spirit = byName("Phúc Đức");
        return [
            `${palaceMainClaim(primary)}. ${majorStateSummary(primary, "tình cảm")}. Người này cần một quan hệ có cam kết rõ nhưng vẫn tôn trọng cách mỗi bên tự xử lý công việc và cảm xúc.`,
            `Mệnh có ${majorDisplay(life)}, trong khi Phúc Đức có ${majorDisplay(spirit)}. Nhu cầu cá nhân và cách hồi phục sau mâu thuẫn vì thế ảnh hưởng trực tiếp tới độ gần gũi; nếu khác biệt không được nói rõ, ${challenges(primary)} dễ tạo khoảng cách dù hai bên vẫn có thiện chí.`,
            `${modifierSummary(primary) || "Phụ tinh tại Phu Thê không tạo điểm nhấn riêng."} Quan hệ thuận hơn khi vai trò và kỳ vọng được thống nhất sớm; ngược lại, việc giữ im lặng quá lâu có thể khiến một vấn đề nhỏ tích tụ thành cảm giác thiếu đồng hành.`
        ];
    }
    if (title === "Gia đình và quan hệ") {
        const parents = byName("Phụ Mẫu");
        const siblings = byName("Huynh Đệ");
        const network = byName("Nô Bộc");
        return [
            `${palaceMainClaim(primary)}. ${majorStateSummary(primary, "gia đình và quan hệ")}. Gia đình gốc có ảnh hưởng rõ tới cách người này hiểu về trách nhiệm, sự hỗ trợ và cảm giác thuộc về.`,
            `Phụ Mẫu có ${majorDisplay(parents)}, còn Huynh Đệ có ${majorDisplay(siblings)}. Điều này cho thấy trách nhiệm giữa các thế hệ và người ngang hàng cần được phân chia rõ; nếu không, ${challenges(parents)} có thể chuyển thành cảm giác phải gánh phần việc của người khác.`,
            `Nô Bộc có ${majorDisplay(network)} và ${relationTone(network)}. Mạng lưới quan hệ có thể là nguồn hỗ trợ thực tế, nhưng chất lượng quan trọng hơn số lượng; ranh giới nhất quán giúp tránh lặp lại áp lực gia đình trong quan hệ bạn bè hoặc đồng nghiệp.`
        ];
    }
    if (title === "Sức khỏe và nhịp sống") {
        const life = byName("Mệnh");
        const spirit = byName("Phúc Đức");
        return [
            `${palaceMainClaim(primary)}. ${majorStateSummary(primary, "sức khỏe và nhịp sống")}. Sức bền chịu ảnh hưởng rõ từ nhịp sinh hoạt và cách phản ứng khi nhiều trách nhiệm đến cùng lúc.`,
            `Mệnh có ${majorDisplay(life)}, còn Phúc Đức có ${majorDisplay(spirit)}. Khi suy nghĩ kéo dài hoặc khó chia sẻ việc đang gánh, mức tiêu hao dễ tăng; ngược lại, thời gian nghỉ đều và khả năng tách việc quan trọng khỏi việc vụn giúp hồi phục tốt hơn.`,
            `${modifierSummary(primary) || "Cung Tật Ách không có nhiều phụ tinh nổi bật."} Điểm cần quan sát là phản ứng với căng thẳng, chất lượng giấc nghỉ và khả năng trở lại nhịp bình thường sau giai đoạn bận rộn.`
        ];
    }
    return [`${palaceMainClaim(primary)}. ${majorStateSummary(primary)}.`, ...related.slice(0, 2).map((item) => relationSynthesis(palaces, item))];
}

function periodParagraphs(palaces, palace, label, contextIds, movingConfig) {
    const balance = balanceState(palace, movingConfig ? [movingConfig.arrayName] : []);
    const contextPalaces = contextIds.filter(Boolean).map((id) => getPalace(palaces, id));
    const life = palaces.find((item) => item.name === "Mệnh");
    const body = palaces.find((item) => item.isBody) || life;
    const periodFocus = /^Đại hạn/u.test(label) ? DECADE_MANIFESTATIONS[palace.name] : PALACE_MANIFESTATIONS[palace.name];
    const first = `${periodNatalContext(palace, label)} ${majorStateSummary(palace, label.toLowerCase())}.`;
    const opportunity = balance.support > balance.challenge
        ? `Cơ hội đáng chú ý nằm ở ${roleSummary(supportingStars(palace), { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, periodFocus)}`
        : `Cơ hội vẫn đến từ việc chủ động cải thiện ${periodFocus}`;
    const difficulty = balance.challenge > 0
        ? `Khó khăn chính liên quan đến ${roleSummary([...getStars(palace, ["malefic"]), ...getStars(palace, ["transform"]).filter((star) => star.name === "Hóa Kỵ")], { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "độ trễ và thay đổi ngoài dự tính")}`
        : `Trở ngại không tập trung ở một nhóm sao riêng, nên chất lượng quyết định thực tế giữ vai trò lớn hơn`;
    const evidence = periodEvidenceSummary(palace);
    const second = `Riêng ${label.toLowerCase()}, ${opportunity.charAt(0).toLowerCase()}${opportunity.slice(1)}. ${difficulty}. ${evidence || `Chính tinh ${majorDisplay(palace)} giữ vai trò quyết định trong giai đoạn này.`}`;
    const context = contextPalaces.length
        ? `Trong ${label.toLowerCase()}, cung này đồng thời liên hệ với ${formatList(contextPalaces.map((item) => `${item.name} có ${majorDisplay(item)}`))}. Vì vậy, thay đổi ở ${periodFocus} có thể kéo theo ${formatList(contextPalaces.map((item) => PALACE_THEMES[item.name]))}.`
        : `Với ${label.toLowerCase()}, khi trọng tâm đi qua ${palace.name}, Mệnh có ${majorDisplay(life)} và Thân cư ${body.name} có ${majorDisplay(body)}. Cách giai đoạn này biểu hiện riêng ở người này phụ thuộc việc ${periodFocus} có phù hợp với cách họ suy nghĩ và nơi họ dồn trách nhiệm hay không.`;
    const paragraphs = [first, second, context];
    if (movingConfig) {
        paragraphs.push(movingParagraph(palace, movingConfig.label, movingConfig.arrayName, movingConfig.context));
    }
    return paragraphs;
}

function timelineParagraphs(palaces, activeDecadePalaceId) {
    const ordered = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
    const activeIndex = ordered.findIndex((palace) => palace.id === activeDecadePalaceId);
    const selectedIds = new Set();
    if (activeIndex >= 0) [activeIndex - 1, activeIndex, activeIndex + 1, activeIndex + 2].filter((index) => ordered[index]).forEach((index) => selectedIds.add(ordered[index].id));
    const candidates = activeIndex >= 0 ? ordered.slice(0, Math.min(ordered.length, activeIndex + 4)) : ordered.slice(0, 6);
    [...candidates]
        .sort((a, b) => {
            const score = (item) => Math.abs(balanceState(item).support - balanceState(item).challenge) * 2 + item.stars.length + Number(item.hasTuan || item.hasTriet) * 3;
            return score(b) - score(a);
        })
        .forEach((palace) => { if (selectedIds.size < 5) selectedIds.add(palace.id); });
    const selected = ordered.filter((palace) => selectedIds.has(palace.id));
    return selected.map((palace) => {
        const index = ordered.findIndex((item) => item.id === palace.id);
        const previous = ordered[index - 1];
        const balance = balanceState(palace);
        const transition = previous ? `So với ${previous.decadeStart}-${previous.decadeEnd} tuổi ở cung ${previous.name}, điểm khác là ${DECADE_MANIFESTATIONS[palace.name]} được đặt ra rõ hơn` : "Đây là giai đoạn mở đầu của chuỗi Đại hạn";
        const tone = balance.support > balance.challenge
            ? `cơ hội nằm ở ${roleSummary(supportingStars(palace), { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, DECADE_MANIFESTATIONS[palace.name])}`
            : `khó khăn nằm ở ${roleSummary(challengeStars(palace), { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "việc thích nghi với thay đổi")}`;
        const current = palace.id === activeDecadePalaceId ? " Đây là Đại hạn hiện tại theo tuổi mụ." : "";
        return `${palace.decadeStart}-${palace.decadeEnd} tuổi đi qua ${palace.name} có ${majorDisplay(palace)}. ${transition}; ${tone}.${current}`;
    });
}

function overviewTopicParagraph(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((palace) => palace.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((palace) => palace.name === name)).filter(Boolean);
    const strongest = [...related].sort((a, b) => Math.abs(balanceState(b).support - balanceState(b).challenge) - Math.abs(balanceState(a).support - balanceState(a).challenge))[0];
    const focus = {
        "Sự nghiệp": `Sự nghiệp chịu ảnh hưởng của ${majorDisplay(primary)} tại Quan Lộc; môi trường phù hợp cần cân bằng trách nhiệm với quyền chủ động`,
        "Tài chính": `Tài chính cho thấy cách kiếm tiền và giữ tiền ${balanceState(primary).challenge > balanceState(primary).support ? "không hoàn toàn đồng đều" : "có khả năng hỗ trợ nhau nếu kế hoạch đủ rõ"}`,
        "Tình cảm": `Tình cảm đặt trọng tâm vào cách hình thành cam kết và xử lý khác biệt, dưới ảnh hưởng của ${majorDisplay(primary)}`,
        "Gia đình và quan hệ": `Gia đình và quan hệ nhấn mạnh việc chia sẻ trách nhiệm, giữ ranh giới và chọn đúng nguồn hỗ trợ`
    }[title] || `${title} tập trung vào ${PALACE_MANIFESTATIONS[primary.name]}`;
    return `${focus}. ${strongest.name} có ${majorDisplay(strongest)} và ${relationTone(strongest)}, vì vậy đây là lĩnh vực liên quan có khả năng làm kết luận thay đổi rõ nhất.`;
}

function compactDecadeParagraph(palace) {
    const balance = balanceState(palace);
    const opportunity = roleSummary(supportingStars(palace), { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, PALACE_MANIFESTATIONS[palace.name]);
    const obstacleStars = [...getStars(palace, ["malefic"]), ...getStars(palace, ["transform"]).filter((star) => star.name === "Hóa Kỵ")];
    const obstacle = roleSummary(obstacleStars, { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "việc thích nghi khi hoàn cảnh đổi khác");
    if (balance.support > balance.challenge)
        return `${palace.decadeStart}-${palace.decadeEnd} tuổi đi qua ${palace.name} có ${majorDisplay(palace)}. ${DECADE_MANIFESTATIONS[palace.name]} có điều kiện phát triển qua ${opportunity}; phần cần lưu ý là ${obstacle}.`;
    return `${palaceMainClaim(palace)} trong khoảng ${palace.decadeStart}-${palace.decadeEnd} tuổi. Giai đoạn này đòi hỏi xử lý ${obstacle}, còn cơ hội nằm ở ${opportunity}.`;
}

function buildInterpretations(params) {
    const {
        palaces,
        annualStars,
        monthlyStars,
        dailyStars,
        hourlyStars,
        viewScope = "legacy",
        monthlyFortunes = [],
        lifePalace,
        bodyPalace,
        nominalAge,
        birthElement,
        bureauElement,
        bureauLabel,
        activeDecadePalaceId,
        annualDecadePalaceId,
        minorFortunePalaceId,
        yearBranchPalaceId,
        monthlyPalaceId,
        dailyPalaceId,
        hourlyPalaceId,
        viewYear,
        viewYearCanChi,
        viewMonth,
        viewLeap,
        monthCanChi,
        viewDay,
        viewDayCanChi,
        viewHourBranch,
        viewHourCanChi
    } = params;
    const items = [];
    const life = getPalace(palaces, lifePalace);
    const body = getPalace(palaces, bodyPalace);
    const activeDecade = activeDecadePalaceId ? getPalace(palaces, activeDecadePalaceId) : null;
    const annualDecade = annualDecadePalaceId ? getPalace(palaces, annualDecadePalaceId) : null;
    const minorFortune = minorFortunePalaceId ? getPalace(palaces, minorFortunePalaceId) : null;
    const yearBranchPalace = yearBranchPalaceId ? getPalace(palaces, yearBranchPalaceId) : null;
    const monthlyPalace = monthlyPalaceId ? getPalace(palaces, monthlyPalaceId) : null;
    const dailyPalace = dailyPalaceId ? getPalace(palaces, dailyPalaceId) : null;
    const hourlyPalace = hourlyPalaceId ? getPalace(palaces, hourlyPalaceId) : null;
    const hasAnnualScope = Number.isInteger(viewYear) && Boolean(minorFortune) && Boolean(yearBranchPalace);
    const bureauRelation = (0, fortune_1.getElementRelation)(birthElement, bureauElement);

    items.push(makeItem("overview-structure", "Tổng quan", "Khí chất và cách hành động", [
        `Nét dễ nhận thấy ở người này là ${formatList(unique(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 3)) || "khả năng thích ứng theo hoàn cảnh"}. Cung Mệnh có ${majorDisplay(life)}; ${majorStateSummary(life, "bức tranh tổng quan").charAt(0).toLowerCase()}${majorStateSummary(life, "bức tranh tổng quan").slice(1)}.`,
        `${lifeBodyInteractionParagraph(life, body)} Quan hệ Mệnh - Cục ${bureauRelation.description}, cho thấy cách cá nhân dùng năng lực của mình có thể thuận theo hoàn cảnh hoặc cần thêm thời gian điều chỉnh.`,
        `Quan Lộc có ${majorDisplay(palaces.find((palace) => palace.name === "Quan Lộc"))}, còn Tài Bạch có ${majorDisplay(palaces.find((palace) => palace.name === "Tài Bạch"))}. Vì vậy, năng lực cá nhân chỉ chuyển thành kết quả bền khi vai trò nghề nghiệp và dòng tiền không liên tục bị xáo trộn cùng lúc.`
    ]));

    items.push(makeItem("overview-capacity", "Tổng quan", "Điểm mạnh và mâu thuẫn chính", [
        `Điểm mạnh dễ nhận thấy là ${roleSummary([...getStars(life, ["support"]), ...getStars(life, ["transform"]).filter((star) => star.name !== "Hóa Kỵ")], { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, "khả năng tự sắp xếp và chịu trách nhiệm")}. ${formatList(getStars(life, ["support", "transform"]).slice(0, 5).map((star) => star.name)) || majorDisplay(life)} là các yếu tố giải thích nhận định này.`,
        `Mâu thuẫn quan trọng nằm ở ${roleSummary([...getStars(life, ["malefic"]), ...getStars(life, ["transform"]).filter((star) => star.name === "Hóa Kỵ")], { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "việc suy nghĩ nhiều hoặc tự tạo áp lực khi kết quả chưa đạt kỳ vọng")}. Vì vậy, cùng một khả năng phân tích và chịu trách nhiệm có thể trở thành lợi thế khi mục tiêu rõ, nhưng dễ gây mệt khi người này cố kiểm soát quá nhiều đầu việc.`
    ]));

    items.push(makeItem("overview-work", "Tổng quan", "Công việc và nguồn lực", [
        overviewTopicParagraph(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"]),
        overviewTopicParagraph(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])
    ]));

    items.push(makeItem("overview-relations", "Tổng quan", "Quan hệ và đời sống tinh thần", [
        overviewTopicParagraph(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"]),
        overviewTopicParagraph(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Nô Bộc"])
    ]));

    items.push(makeItem("overview-timeline", "Tổng quan", "Dòng thời gian đáng chú ý", [
        `Các mốc dưới đây dùng tuổi mụ và chỉ chọn những Đại hạn có khác biệt đáng kể về bộ sao, mức thuận lợi hoặc trở ngại. Đây không phải danh sách tuổi tốt hay tuổi xấu.`,
        ...timelineParagraphs(palaces, activeDecadePalaceId)
    ]));

    if (hasAnnualScope) {
        items.push(makeItem("overview-period", "Tổng quan", `Điểm đáng chú ý trong năm ${viewYearCanChi}`, [
            `Ở tuổi mụ ${nominalAge}, ${activeDecade ? `năm ${viewYearCanChi} nằm trong Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại ${activeDecade.name}` : "năm này nằm trước Đại hạn mười năm đầu tiên"}. Những lĩnh vực dễ được chú ý hơn là ${formatList(unique([activeDecade, annualDecade, minorFortune, yearBranchPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}.`,
            repeatedFocusParagraph(palaces, [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId, monthlyPalaceId], `Các mốc vận hạn trong năm ${viewYear}`),
            `Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, Tiểu hạn ở ${minorFortune.name}, còn Lưu Thái Tuế tại ${yearBranchPalace.name}. Khi các vị trí này cùng liên quan tới một quyết định, ảnh hưởng thường thể hiện qua nhiều lĩnh vực thay vì một sự kiện đơn lẻ.`
        ]));
    }

    items.push(makeItem("life-detail", "Mệnh - Thân", `Chân dung Mệnh và Thân`, [
        `Với ${majorDisplay(life)} tại Mệnh, người này thường muốn hiểu rõ vấn đề trước khi quyết định và có xu hướng tự chịu trách nhiệm cho lựa chọn của mình. ${majorStateSummary(life, "chân dung Mệnh và Thân")}.`,
        `${lifeBodyInteractionParagraph(life, body)} ${modifierSummary(body) || `Cung Thân chịu ảnh hưởng chính của ${majorDisplay(body)}`}.`,
        `Công việc và tài chính là hai nơi thử thách rõ khả năng biến tiêu chuẩn cá nhân thành kết quả thực tế. Người này phát huy tốt hơn khi có quyền chủ động, nhưng cần tránh tự nhận phần việc vượt quá sức mình.`
    ]));

    palaces.forEach((palace) => {
        items.push(makeItem(`palace-${palace.id}`, "12 cung", `${palace.name} tại ${palace.branch}`, palaceParagraphs(palaces, palace)));
    });

    items.push(makeItem("career-synthesis", "Sự nghiệp", "Cấu trúc nghề nghiệp và vị trí xã hội", thematicSynthesis(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"])));
    items.push(makeItem("finance-synthesis", "Tài chính", "Khả năng tạo lập và giữ nguồn lực", thematicSynthesis(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])));
    items.push(makeItem("relationship-synthesis", "Tình cảm", "Mẫu hình quan hệ gắn bó", thematicSynthesis(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"])));
    items.push(makeItem("family-synthesis", "Gia đình - Quan hệ", "Gia đình và mạng lưới quan hệ", thematicSynthesis(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Tử Tức", "Nô Bộc"])));
    items.push(makeItem("health-synthesis", "Sức khỏe - Nhịp sống", "Thể trạng và phản ứng trước áp lực", [
        ...thematicSynthesis(palaces, "Sức khỏe và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]),
        "Phần này chỉ mô tả khuynh hướng nhịp năng lượng và phản ứng trước áp lực theo hệ thống Tử Vi truyền thống. Nội dung không thay thế đánh giá y khoa hoặc chẩn đoán sức khỏe."
    ]));

    if (viewScope === "natal_overview") {
        const ordered = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
        const activeIndex = ordered.findIndex((item) => item.id === activeDecadePalaceId);
        ordered.forEach((decade, index) => {
            const previous = ordered[index - 1];
            const next = ordered[index + 1];
            const nearby = activeIndex >= 0 && index >= activeIndex - 1 && index <= activeIndex + 2;
            const paragraphs = nearby
                ? periodParagraphs(palaces, decade, `Đại hạn ${decade.decadeStart}-${decade.decadeEnd} tuổi`, [], null)
                : [compactDecadeParagraph(decade)];
            if (nearby) {
                paragraphs.push(`${previous ? `So với Đại hạn ${previous.decadeStart}-${previous.decadeEnd} tuổi ở ${previous.name}` : "So với thời kỳ trước Đại hạn đầu tiên"}, thay đổi rõ nhất nằm ở ${PALACE_MANIFESTATIONS[decade.name]}.${next ? ` Trước khi sang ${next.decadeStart}-${next.decadeEnd} tuổi ở ${next.name}, giai đoạn này cần giải quyết tốt ${roleSummary(challengeStars(decade), { ...CHALLENGE_ROLES, ...TRANSFORM_ROLES }, "những việc còn thiếu ổn định")}.` : ""}`);
            }
            if (decade.id === activeDecadePalaceId)
                paragraphs.push(`Đây là Đại hạn hiện tại ở tuổi mụ ${nominalAge}. Vì nằm gần thời điểm đang sống, phần này được luận chi tiết hơn các giai đoạn xa.`);
            items.push(makeItem(`decade-${decade.decadeStart}`, "Đại vận", `Đại hạn ${decade.decadeStart}-${decade.decadeEnd} tuổi`, paragraphs));
        });
    }
    else if (activeDecade) {
        const orderedDecades = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
        const activeIndex = orderedDecades.findIndex((palace) => palace.id === activeDecade.id);
        const previous = orderedDecades[activeIndex - 1];
        const next = orderedDecades[activeIndex + 1];
        const decadeCopy = periodParagraphs(
            palaces,
            activeDecade,
            `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`,
            [annualDecadePalaceId, minorFortunePalaceId],
            null
        );
        decadeCopy.push(`${previous ? `So với ${previous.decadeStart}-${previous.decadeEnd} tuổi ở ${previous.name}` : "So với thời kỳ trước Đại hạn đầu tiên"}, Đại hạn hiện tại khác rõ ở ${PALACE_MANIFESTATIONS[activeDecade.name]}.${next ? ` Trước khi sang ${next.decadeStart}-${next.decadeEnd} tuổi ở ${next.name}, đây là thời gian cần hoàn thiện những việc còn thiếu ổn định trong ${PALACE_THEMES[activeDecade.name]}.` : ""}`);
        items.push(makeItem("decade-main", "Đại vận", `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`, decadeCopy));
    }
    else if (hasAnnualScope) {
        const firstDecade = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart)[0];
        items.push(makeItem("decade-before-start", "Đại vận", "Giai đoạn trước đại vận đầu tiên", [
            `Tuổi mụ ${nominalAge} chưa bước vào đại vận mười năm đầu. Đại vận đầu bắt đầu từ ${firstDecade.decadeStart} tuổi tại cung ${firstDecade.name} ở ${firstDecade.branch}. Giai đoạn hiện tại vì thế được đọc chủ yếu từ cung Mệnh, cung Thân và các lớp lưu niên.`,
            `${periodNatalContext(firstDecade, "Đại vận đầu tiên")} Đây là cấu trúc sẽ giữ vai trò nền khi đại vận đầu chính thức bắt đầu.`
        ]));
    }
    if (hasAnnualScope && annualDecade) {
        items.push(makeItem("annual-decade", "Đại vận", `Lưu đại hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            annualDecade,
            `Lưu đại hạn năm ${viewYear}`,
            [activeDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận mười năm và tiểu hạn" }
        )));
    }

    if (hasAnnualScope) {
        items.push(makeItem("minor-fortune", "Tiểu vận", `Lưu niên tiểu hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            minorFortune,
            `Tiểu hạn năm ${viewYearCanChi}`,
            [activeDecadePalaceId, annualDecadePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận, lưu đại hạn và Lưu Thái Tuế" }
        )));
        items.push(makeItem("annual-moving-stars", "Tiểu vận", "Cấu trúc sao lưu của năm", [
            `Sao lưu của năm phân bố trên ${palaces.filter((palace) => palace.annualStars.length).length} cung. Những thay đổi đáng chú ý liên quan đến ${formatList(palaces.filter((palace) => palace.annualStars.length).slice(0, 5).map((palace) => PALACE_THEMES[palace.name]))}.`,
            `Nhóm sao này cho biết thời điểm dễ xuất hiện cơ hội, trách nhiệm, sự ghi nhận, dịch chuyển hoặc trở ngại. Kết luận của năm vẫn cần đặt trong Đại hạn và Tiểu hạn đang có.`
        ]));

        const annualTopic = `Vận hạn ${viewYear}`;
        const focusIds = [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId];
        items.push(makeItem("year-synthesis", annualTopic, `Tổng hợp vận hạn năm ${viewYearCanChi}`, [
            `Năm ${viewYearCanChi} nằm trong Đại hạn ${activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "chưa xác định"}. Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, Tiểu hạn nằm tại ${minorFortune.name} ở ${minorFortune.branch}, còn Lưu Thái Tuế đi tới ${yearBranchPalace.name} ở ${yearBranchPalace.branch}. Các vị trí này cho biết bối cảnh dài hạn và những việc dễ cần xử lý trong riêng năm.`,
            (0, patterns_1.buildActivationParagraph)(palaces, focusIds, `Trong năm ${viewYear},`),
            `Những cung trên liên quan đến ${formatList(unique(focusIds.filter(Boolean).map((id) => PALACE_THEMES[getPalace(palaces, id).name])))}. Một lựa chọn ở lĩnh vực này có thể làm thay đổi cách xử lý ở lĩnh vực khác, nên cần đọc các mối liên hệ trước khi xét từng sao lưu.`
        ]));

        const annualSubjects = [
            ["year-career", "Công việc và vị trí xã hội", "Quan Lộc", ["Thiên Di", "Mệnh"]],
            ["year-finance", "Tài chính và nguồn lực", "Tài Bạch", ["Quan Lộc", "Điền Trạch"]],
            ["year-relationship", "Tình cảm và quan hệ gắn bó", "Phu Thê", ["Mệnh", "Phúc Đức"]],
            ["year-health", "Thể trạng và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]]
        ];
        annualSubjects.forEach(([id, title, primaryName, relatedNames]) => {
            const primary = palaces.find((item) => item.name === primaryName);
            const related = relatedNames.map((name) => palaces.find((item) => item.name === name));
            items.push(makeItem(id, annualTopic, `${title} năm ${viewYear}`, [
                annualNatalFoundation(primary),
                annualSubjectMovement(primary, related, viewYear)
            ]));
        });
        const subjectLabels = { "Quan Lộc": "công việc", "Tài Bạch": "tài chính", "Phu Thê": "quan hệ gắn bó", "Tật Ách": "nhịp sống" };
        const directlyAffected = annualSubjects
            .filter(([, , primaryName]) => palaces.find((palace) => palace.name === primaryName)?.annualStars?.length)
            .map(([, , primaryName]) => subjectLabels[primaryName]);
        items.push(makeItem("year-conclusion", annualTopic, `Nhìn lại vận hạn năm ${viewYear}`, [
            `Năm ${viewYear}, ${directlyAffected.length ? `${formatList(directlyAffected)} nổi bật hơn vì có sao lưu tại các cung tương ứng` : "cả bốn lĩnh vực vừa xét chủ yếu chuyển động theo bối cảnh chung, không có sao lưu ngay tại bản cung"}. Đại hạn ${activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại ${activeDecade.name}` : "đang có"} và Tiểu hạn tại ${minorFortune.name} vẫn là nền để hiểu những biến chuyển ấy. Một thay đổi trong công việc có thể kéo theo cách dùng tiền, thời gian và sức lực; lựa chọn trong quan hệ cũng có thể ảnh hưởng trở lại nhịp sống. Nhìn chung, cơ hội ở một mặt sẽ dễ phát huy hơn khi các mặt còn lại theo kịp, còn áp lực cục bộ không đủ để kết luận cả năm tốt hay xấu.`
        ]));
    }

    if (viewScope !== "legacy" && monthlyFortunes.length) {
        const monthTopic = viewScope === "all_months" ? `Lưu nguyệt năm ${viewYear}` : `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
        monthlyFortunes.forEach((fortune, fortuneIndex) => {
            const paragraphs = [];
            fortune.parts.forEach((part) => {
                const scopedPalaces = palaces.map((palace) => ({
                    ...palace,
                    monthlyStars: part.stars.filter((star) => star.palace === palace.id)
                }));
                const focus = getPalace(scopedPalaces, part.palaceId);
                const partParagraphs = periodParagraphs(
                    scopedPalaces,
                    focus,
                    `Lưu nguyệt ${fortune.label.toLowerCase()}${fortune.parts.length > 1 ? ` - ${part.phase.toLowerCase()}` : ""}`,
                    [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
                    { label: `${fortune.label.toLowerCase()} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
                );
                if (fortune.parts.length > 1)
                    partParagraphs[0] = `${part.phase}: ${partParagraphs[0]}`;
                paragraphs.push(...partParagraphs.slice(0, 2));
            });
            items.push(makeItem(`month-synthesis-${fortuneIndex + 1}`, monthTopic, `${fortune.label} âm lịch - ${fortune.parts.map((part) => part.monthCanChi).filter((value, index, list) => list.indexOf(value) === index).join(" / ")}`, paragraphs));
        });
    }
    else if (viewScope === "legacy") {
        const monthTopic = `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
        items.push(makeItem("month-synthesis", monthTopic, `Tổng hợp tháng ${viewMonth} âm lịch - ${monthCanChi}`, periodParagraphs(
            palaces,
            monthlyPalace,
            `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""} âm lịch`,
            [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
            { label: `tháng ${viewMonth} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
        )));
        const dayTopic = `Lưu nhật ngày ${viewDay}`;
        items.push(makeItem("day-synthesis", dayTopic, `Tổng hợp ngày ${viewDay} âm lịch - ${viewDayCanChi}`, periodParagraphs(
            palaces,
            dailyPalace,
            `Lưu nhật ngày ${viewDay} âm lịch`,
            [monthlyPalaceId, minorFortunePalaceId, annualDecadePalaceId],
            { label: `ngày ${viewDay} âm lịch`, arrayName: "dailyStars", context: "lưu nguyệt, tiểu hạn và vận năm" }
        )));
        const hourTopic = `Lưu thời giờ ${viewHourBranch}`;
        items.push(makeItem("hour-synthesis", hourTopic, `Tổng hợp giờ ${viewHourCanChi}`, periodParagraphs(
            palaces,
            hourlyPalace,
            `Lưu thời giờ ${viewHourCanChi}`,
            [dailyPalaceId, monthlyPalaceId, minorFortunePalaceId],
            { label: `giờ ${viewHourCanChi}`, arrayName: "hourlyStars", context: "lưu nhật, lưu nguyệt và tiểu hạn" }
        )));
    }
    return (0, content_pipeline_1.finalizeInterpretations)(items);
}
